const express = require("express");
const cors = require("cors");
const supabase = require('@supabase/supabase-js')
const getPriceCurrent = require('./src/utils/getPriceCurrent.js')
const getPriceGrowth = require('./src/utils/getPriceGrowth.js')
const ROUND = require('./src/utils/round.js')
const cron = require('cron');
const { default: axios } = require("axios");
const moment = require('moment-timezone')
const { load } = require('cheerio')
const getGFValue = require('./src/utils/getGFValue.js')
const updateDividendYears = require('./src/routes/updateDividendYears.js')

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Ok", route: "/" });
});

app.get('/update-price-current', async (req, res) => {
  const client = supabase.createClient('https://cufytakzggluwlfdjqsn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4')

  const stocks = await client
  .from('stock')
  .select()
  .order('ticker', { ascending: true })

  if (stocks.data) {
    stocks.data.forEach((stock, index) => {
      setTimeout(async () => {
        try {
          if (stock.ticker && stock.price_target) {
            console.log(stock.ticker)
            const priceCurrent = await getPriceCurrent(
              stock.ticker,
              stock.exchange
            );

            if (priceCurrent) {
              const priceGrowth = getPriceGrowth(
                stock.price_target,
                priceCurrent
              );

              const priceYearHigh = stock.price_year_high && priceCurrent > stock.price_year_high ? priceCurrent : stock.price_year_high
              const gfValueMargin = ROUND(((Number(stock.gfValue) - priceCurrent) / priceCurrent) * 100)

              await client
                .from('stock')
                .update({
                  price_current: priceCurrent, 
                  price_growth: priceGrowth,
                  price_year_high: priceYearHigh,
                  gfValueMargin: gfValueMargin
                })
                .eq('ticker', stock.ticker)
            }
          }
        } catch (error) {}
      }, 600 * index);
    });
  }

  res.json({ route: '/update-price-current', result: { stocks } })
})

app.get('/update-dividends', async (req, res) => {
  const { from, to } = req.query

  const supabaseClient = supabase.createClient(
    'https://cufytakzggluwlfdjqsn.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
  )

  const stocks = await supabaseClient
    .from("stock")
    .select()
    // .eq("ticker", "AAPL")
    // .limit(100)
    .range(from, to)
    .eq("is_dividend", true)
    .order("ticker", { ascending: true });

  if (stocks.data) {
    stocks.data.forEach((stock, index) => {
      setTimeout(async () => {
        try {
          const html = await axios.get(
            `https://stockanalysis.com/stocks/${stock.ticker.replace(
              "-",
              "."
            )}/dividend/`
          );

          /* --- UPDATE UPCOMING DIVIDEND ---  */
          console.log(stock.ticker)
          if (html) {
            const $ = load(html.data);

            const today = moment().format("YYYY-MM-DD");

            let lastPayDate = "";
            let lastCashAmount;

            $("table > tbody > tr").each((i, el) => {
              const payDate = $(el).find("td:nth-child(4)").text();
              const cashAmount = $(el).find("td:nth-child(2)").text();

              if (moment(payDate).isAfter(today)) {
                lastPayDate = moment(payDate).format("YYYY-MM-DD");
                lastCashAmount = ROUND(Number(cashAmount.split("$")[1]));
              }
            });

            await supabaseClient
              .from("stock")
              .update({
                dividend_upcoming_date: lastPayDate ? lastPayDate : null,
                dividend_upcoming_value: lastCashAmount ? lastCashAmount : null,
              })
              .eq("ticker", stock.ticker);
          }

          /* --- UPDATE DIVIDEND INCOME --- */
          const supaStockPortfolio = await supabaseClient
            .from("stock_portfolio")
            .select()
            .eq("ticker", stock.ticker);

          if (supaStockPortfolio.data) {
            supaStockPortfolio.data.forEach(async (stockPortfolio) => {
              if (html) {
                const $ = load(html.data);
                const today = moment().format("YYYY-MM-DD");
                let foundFirstMatchingRow = false;
                let lastPayDate;
                let lastCashAmount;

                $("table > tbody > tr").each((i, el) => {
                  if (!foundFirstMatchingRow) {
                    const payDate = $(el).find("td:nth-child(4)").text();
                    const cashAmount = $(el).find("td:nth-child(2)").text();
                    const exDividendDate = $(el).find("td:nth-child(1)").text();

                    if (
                      moment(payDate).isBefore(today) &&
                      moment(exDividendDate).isAfter(
                        stockPortfolio.startTradeDate
                      )
                    ) {
                      foundFirstMatchingRow = true;
                      lastPayDate = payDate;
                      lastCashAmount = cashAmount;
                    }
                  }
                });

                if (lastPayDate) {
                  const isExistDividends = moment(
                    stockPortfolio.lastDividendPayDate
                  ).isSame(lastPayDate);

                  if (!isExistDividends) {
                    console.log("NEW DIVIDENDS", stockPortfolio.ticker);
                    const supaPortfolio = await supabaseClient
                      .from("portfolio")
                      .select()
                      .eq("id", stockPortfolio.portfolio_id)
                      .single();

                    if (supaPortfolio.data) {
                      const supaUser = await supabaseClient
                        .from("user")
                        .select()
                        .eq("id", supaPortfolio.data.user_id)
                        .single();

                      if (supaUser.data) {
                        const totalDividends = ROUND(
                          Number(lastCashAmount) *
                            Number(stockPortfolio.amount_active_shares)
                        );
                        const cost =
                          Number(stockPortfolio.average_cost_per_share) *
                          Number(stockPortfolio.amount_active_shares);
                        const newTotalReturnValue = ROUND(
                          Number(stockPortfolio.total_return_value) +
                            totalDividends
                        );
                        const newTotalReturnMargin = ROUND(
                          (newTotalReturnValue / cost) * 100
                        );
                        const newTotalDividendIncome = ROUND(
                          Number(stockPortfolio.total_dividend_income) +
                            totalDividends
                        );
                        const newBalance = ROUND(
                          supaUser.data.balance + totalDividends
                        );
                        const year = Number(moment(lastPayDate).format("YYYY"));

                        await supabaseClient
                          .from("stock_portfolio")
                          .update({
                            lastDividendPayDate:
                              moment(lastPayDate).format("YYYY-MM-DD"),
                            total_dividend_income: newTotalDividendIncome,
                            total_return_value: newTotalReturnValue,
                            total_return_margin: newTotalReturnMargin,
                          })
                          .eq("ticker", stockPortfolio.ticker)
                          .eq("portfolio_id", stockPortfolio.portfolio_id);

                        await supabaseClient.from("dividend").insert({
                          amount_shares: Number(
                            stockPortfolio.amount_active_shares
                          ),
                          dividendValue: ROUND(Number(lastCashAmount)),
                          dividendYield: ROUND(
                            (Number(lastCashAmount) /
                              Number(stockPortfolio.average_cost_per_share)) *
                              100
                          ),
                          ticker: stockPortfolio.ticker,
                          payDate: moment(lastPayDate).format("YYYY-MM-DD"),
                          totalAmount: totalDividends,
                          portfolio_id: stockPortfolio.portfolio_id,
                          year,
                        });

                        await supabaseClient
                          .from("user")
                          .update({ balance: newBalance })
                          .eq("id", supaUser.data.id);
                      }
                    }
                  }
                }
              }
            });
          }
        } catch {
          console.log("ERROR");
        }
      }, index * 2000);
    });
  }

  res.json({ message: "Ok", stocks });
})

app.get('/update-margins', async (req, res) => {
  const { from, to } = req.query

  const supabaseClient = supabase.createClient(
    'https://cufytakzggluwlfdjqsn.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
  )

  const stocks = await supabaseClient
    .from("stock")
    .select()
    .range(from, to)
    .order("ticker", { ascending: true });

  if (stocks.data) {
    stocks.data.forEach((stock, index) => {
      setTimeout(async () => {
        try {
          const htmlStockAnalysis = await axios.get(
            `https://stockanalysis.com/stocks/${stock.ticker.replace(
              "-",
              "."
            )}/financials/`
          );

          console.log(stock.ticker);

          if (htmlStockAnalysis.data) {
            const $ = load(htmlStockAnalysis.data);

            let grossMargin = 0;
            let netMargin = 0;

            $("table[data-test='financials'] > tbody > tr").each((i, el) => {
              const a = $(el).find("td:nth-child(1) > span").text();

              if (a === "Gross Margin") {
                grossMargin = Number(
                  $(el).find("td:nth-child(2)").text().split("%")[0]
                );
              }

              if (a === "Profit Margin") {
                netMargin = Number(
                  $(el).find("td:nth-child(2)").text().split("%")[0]
                );
              }
            });

            await supabaseClient
              .from("stock")
              .update({
                gross_margin: Number(grossMargin),
                net_margin: Number(netMargin),
              })
              .eq("ticker", stock.ticker);
          }
        } catch {
          console.log("ERROR /update-margins");
        }
      }, index * 2000);
    });
  }

  res.json({ route: '/update-margins' })
})

app.get('/update-fundamentals', async (req, res) => {
  const { from, to } = req.query

  const convertMarketCap = (numberString) => {
    if (typeof numberString !== "string") {
      throw new Error("Input must be a string.");
    }

    const lastChar = numberString.slice(-1).toUpperCase();
    const numericPart = parseFloat(numberString);

    if (isNaN(numericPart)) {
      throw new Error("Invalid number format.");
    }

    let multiplier;

    switch (lastChar) {
      case "B":
        multiplier = 1000000000;
        break;
      case "M":
        multiplier = 1000000;
        break;
      default:
        throw new Error('Invalid abbreviation. Use "B" or "M".');
    }

    return numericPart * multiplier;
  };

  const supabaseClient = supabase.createClient(
    'https://cufytakzggluwlfdjqsn.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
  )

  const stocks = await supabaseClient
    .from("stock")
    .select()
    // .eq('ticker', 'AAPL')
    .range(from, to)
    .order("ticker", { ascending: true });

  if (stocks.data) {
    stocks.data.forEach((stock, index) => {
      const t = setTimeout(async () => {
        try {
          // const html = await axios.get(
          //   `https://finviz.com/quote.ashx?t=${stock.ticker}`
          // );

          // console.log(stock.ticker);

          // if(html.data) {
          //   const $ = load(html.data);

          //   const pe = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(1) td:nth-child(4)"
          //   ).text();
          //   const roe = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(6) td:nth-child(8)"
          //   ).text();
          //   const annualDividend = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(7) td:nth-child(2)"
          //   ).text();
          //   const dividendYield = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(8) td:nth-child(2)"
          //   ).text();
          //   const payoutRation = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(11) td:nth-child(8)"
          //   ).text();
          //   const marketCap = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(2) td:nth-child(2)"
          //   ).text();
          //   const de = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(10) td:nth-child(4)"
          //   ).text();
          //   const beta = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(7) td:nth-child(12)"
          //   ).text();
          //   const epsGrowth5Y = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(7) td:nth-child(6)"
          //   )
          //     .text()
          //     .split("%")[0];
          //   const yearHigh = $(
          //     ".snapshot-table-wrapper > table > tbody > tr:nth-child(6) td:nth-child(10)"
          //   )
          //     .text()
          //     .split("-")[1];

          console.log(stock.ticker)
            const GFValue = await getGFValue(stock.ticker);

            const getGFValueMargin = () => {
              if (GFValue && stock.price_current) {
                const result = ROUND(((GFValue - stock.price_current) / stock.price_current) * 100);
                return result;
              } else {
                return 0;
              }
            };

            const htmlStockAnalysisA = await axios.get(`https://stockanalysis.com/stocks/${stock.ticker}/financials/ratios/`)
            
            let pe;
            let marketCap;
            let de;
            let roe;
            let dividendYield;
            let payoutRatio;
            let beta;
            let yearHigh;
            
            if(htmlStockAnalysisA.data) {
              const $ = load(htmlStockAnalysisA.data)
              const a = $("table[data-test='financials'] > tbody > tr:nth-child(1) > td:nth-child(2)").text()
              marketCap = Number(a.replace(/,/g, '')) * 1000000
              
              $("table[data-test='financials'] > tbody > tr").each((i, el) => {
                const cell = $(el).find("td:nth-child(1) > span").text();
                
                if (cell === "PE Ratio") {
                  pe = Number($(el).find("td:nth-child(2)").text());
                }
                
                if (cell === "Debt / Equity Ratio") {
                  de = Number($(el).find("td:nth-child(2)").text());
                }
                
                if (cell === "Return on Equity (ROE)") {
                  roe = Number($(el).find("td:nth-child(2)").text().replace('%', ''));
                }
                
                if (cell === "Dividend Yield") {
                  dividendYield = Number($(el).find("td:nth-child(2)").text().replace('%', ''));
                }
                
                if (cell === "Payout Ratio") {
                  payoutRatio = Number($(el).find("td:nth-child(2)").text().replace('%', ''));
                }
              });
            }
            
            const htmlStockAnalysisB = await axios.get(`https://stockanalysis.com/stocks/${stock.ticker}/`)
            
            if(htmlStockAnalysisB.data) {
              const $ = load(htmlStockAnalysisB.data)
              beta = $('main > div:nth-child(2) > div:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(6) > td:nth-child(2)').text()
              yearHigh = (($('main > div:nth-child(2) > div:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(5) > td:nth-child(2)').text()).split('-')[1]).trim()
            }
            
            // console.log('pe', pe)
            // console.log('marketCap', marketCap)
            // console.log('de', de)
            // console.log('roe', roe)
            // console.log('dividendYield', dividendYield)
            // console.log('payoutRatio', payoutRatio)
            // console.log('beta', beta)
            // console.log('yearHigh', yearHigh)

            await supabaseClient
              .from("stock")
              .update({
                pe: Number(pe),
                roe: Number(roe),
                // annualDividend: Number(annualDividend),
                dividendYield: Number(dividendYield),
                payoutRation: Number(payoutRatio),
                marketCap: marketCap,
                gfValue: GFValue,
                gfValueMargin: getGFValueMargin(),
                de: Number(de),
                // eps_growth_past_5y: Number(epsGrowth5Y),
                beta: Number(beta),
                price_year_high: Number(yearHigh),
              })
              .eq("ticker", stock.ticker);

          /* --- UPDATE REPORT_DATE --- */
          const htmlZacks = await axios.get(
            `https://www.zacks.com/stock/research/${stock.ticker}/earnings-calendar`
          );
          
          if(htmlZacks.data) {
            const $ = load(htmlZacks.data);
            const element = $(
              ".key-expected-earnings-data-module > table > tbody > tr > th:nth-child(1)"
            ).text();

            const isValid = !element.startsWith("NA");

            if (isValid && element.length > 0) {
              try {
                const month = element.split("/")[0];
                const day = element.split("/")[1];
                const year = element.split("/")[2].substring(0, 4);

                const date = `${year}-${month}-${day}`;
                await supabaseClient
                  .from("stock")
                  .update({ report_date: date })
                  .eq("ticker", stock.ticker);
              } catch {
                console.log("ERROR REPORT_DATE", stock.ticker);
              }
            }
          }
        } catch (e) {
          console.log("ERROR /update-fundamentals", stock.ticker, e);
        }
        clearTimeout(t)
      }, 2000 * index);
    });
  }
  
  res.json({ route: '/update-fundamentals' })
})

app.get('/update-dividend-years', updateDividendYears)

app.get('/test', async (req, res) => {
  res.json({ message: 'Ok' })
})

app.listen(80, async () => {
  console.log("SERVER WORK")
});
