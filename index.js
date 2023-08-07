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

// const job30m = new cron.CronJob('*/30 * * * *', async () => {
//   await axios.get(`${process.env.CLIENT_URL}/update-price-current`)
// })
// job30m.start()

// const jobDay = new cron.CronJob(
//   '0 0 * * *', 
//   async () => { 
//     console.log('RUN JOB-DAY'); 
//     await axios.get(`${process.env.CLIENT_URL}/update-dividends?from=100&to=150`)
//     await axios.get(`${process.env.CLIENT_URL}/update-dividends?from=150&to=200`)
//     await axios.get(`${process.env.CLIENT_URL}/update-dividends?from=200&to=250`)
//     await axios.get(`${process.env.CLIENT_URL}/update-dividends?from=250&to=300`)
//   }, 
//   () => {}, 
//   true
//   )
// jobDay.start()

app.get('/test', async (req, res) => {
  const supabaseClient = supabase.createClient(
    'https://cufytakzggluwlfdjqsn.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
  )

  const stocks = await supabaseClient
    .from("stock")
    .select()
    // .eq("ticker", "AAPL")
    // .limit(100)
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

          console.log(stock.ticker)

          if (html) {
            const $ = load(html.data);

            const today = moment().format("YYYY-MM-DD");

            /* --- UPDATE UPCOMING DIVIDEND ---  */
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
                      const exDividendDate = $(el)
                        .find("td:nth-child(1)")
                        .text();

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

                    if (isExistDividends) {
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
                          const year = Number(
                            moment(lastPayDate).format("YYYY")
                          );

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
                            ticker: stock.ticker,
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
          }
        } catch {
          console.log("ERROR");
        }
      }, index * 2000);
    });
  }

  res.json({ message: 'Ok' })
})

app.listen(80, async () => {
  console.log("SERVER WORK")
  // await axios.get(`${process.env.CLIENT_URL}/update-dividends`)
});
