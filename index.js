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
  // .in('ticker', ['A', 'AAPL'])

  if (stocks.data) {
    stocks.data.forEach((stock, index) => {
      setTimeout(async () => {
        try {
          // const stockPortfolio = await supabaseClient
          //   .from("stock_portfolio")
          //   .select()
          //   .eq("ticker", stock.ticker)
          //   .in("portfolio_id", portfolioIds ?? []);

          if (stock.ticker && stock.price_target) {
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

              // const res = await client
              //   .from("stock")
              //   .update({
              //     price_current: priceCurrent,
              //     price_growth: priceGrowth,
              //     price_year_high:
              //       stock.price_year_high &&
              //       priceCurrent > stock.price_year_high
              //         ? priceCurrent
              //         : stock.price_year_high,
              //     gfValueMargin: ROUND(
              //       ((Number(stock.gfValue) - priceCurrent) / priceCurrent) *
              //         100
              //     ),
              //   })
              //   .eq("ticker", stock.ticker).select();

              // if (stockPortfolio.data) {
              //   stockPortfolio.data.forEach(async (item) => {
              //     if (
              //       item.amount_active_shares &&
              //       item.average_cost_per_share
              //     ) {
              //       const portfolio = await supabaseClient
              //         .from("portfolio")
              //         .select()
              //         .eq("id", item.portfolio_id)
              //         .single();
              //       const value = ROUND(
              //         priceCurrent * item.amount_active_shares
              //       );
              //       const cost = ROUND(
              //         item.average_cost_per_share * item.amount_active_shares
              //       );
              //       const portfolioValue = ROUND(
              //         await getPortfolioValue(item.portfolio_id)
              //       );
              //       await supabaseClient
              //         .from("stock_portfolio")
              //         .update({
              //           price_current: priceCurrent,
              //           price_growth: priceGrowth,
              //           gain_value: ROUND(value - cost),
              //           gain_margin: ROUND(((value - cost) / cost) * 100),
              //           perc_of_portfolio: ROUND(
              //             (value / portfolioValue) * 100
              //           ),
              //         })
              //         .eq("ticker", item.ticker)
              //         .eq("portfolio_id", item.portfolio_id);
              //       if (portfolio.data) {
              //         const portfolioCost = portfolio.data.cost;
              //         await supabaseClient
              //           .from("portfolio")
              //           .update({
              //             value: portfolioValue,
              //             gain_value: ROUND(portfolioValue - portfolioCost),
              //             gain_margin: ROUND(
              //               ((portfolioValue - portfolioCost) / portfolioCost) *
              //                 100
              //             ),
              //           })
              //           .eq("id", item.portfolio_id);
              //       }
              //     }
              //   });
              // }
            }
          }
        } catch (error) {}
      }, 600 * index);
    });
  }

  res.json({ route: '/update-price-current', result: { stocks } })
})

app.get('/update-dividends', async (req, res) => {

  const supabaseClient = supabase.createClient(
    'https://cufytakzggluwlfdjqsn.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
  )

  const stocks = await supabaseClient
    .from("stock")
    .select("ticker")
    .eq('is_dividend', true)
    .order("ticker", { ascending: true });

  if (stocks.data) {
    let splitArrays = [];
    for (let i = 0; i < stocks.data.length; i += 50) {
      const chunk = stocks.data.slice(i, i + 50);
      splitArrays.push(chunk);
    }

    for (let i = 0; i < splitArrays.length; i++) {
      for (let b = 0; b < splitArrays[i].length; b++) {
        const t = setTimeout(
          async () => {
            try {
                const response = await axios.get(
                  `https://api.polygon.io/v3/reference/dividends?ticker=${splitArrays[i][b].ticker}&apiKey=OZ_9x0ccKRsnzoE6OqsoW0oGeQCmAohs`
                );

                /* --- UPDATE UPCOMING DIVIDEND ---  */
                const today = moment().format("YYYY-MM-DD");

                const lastUpcomeDividend = response.data.results.find((item) =>
                  moment(item.pay_date).isAfter(today)
                );

                if(lastUpcomeDividend) {
                  console.log(splitArrays[i][b].ticker)
                }

                await supabaseClient
                  .from("stock")
                  .update({
                    dividend_upcoming_date: lastUpcomeDividend?.pay_date
                      ? lastUpcomeDividend?.pay_date
                      : null,
                    dividend_upcoming_value: lastUpcomeDividend?.cash_amount
                      ? lastUpcomeDividend?.cash_amount
                      : null,
                  })
                  .eq("ticker", splitArrays[i][b].ticker);
            } catch {}
            clearTimeout(t)
          }, 
          b * 15000
        )
      }
    }
    // splitArrays.forEach((arr) => {
    //   arr.forEach((stock, index) => {
    //     setTimeout(
    //       async () => {
    //         try {
    //       const response = await axios.get(
    //         `https://api.polygon.io/v3/reference/dividends?ticker=${stock.ticker}&apiKey=OZ_9x0ccKRsnzoE6OqsoW0oGeQCmAohs`
    //       );

    //       /* --- UPDATE UPCOMING DIVIDEND ---  */
    //       const today = moment().format("YYYY-MM-DD");

    //       const lastUpcomeDividend = response.data.results.find((item) =>
    //         moment(item.pay_date).isAfter(today)
    //       );

    //       if(lastUpcomeDividend) {
    //         console.log(stock.ticker)
    //       }

    //       await supabaseClient
    //         .from("stock")
    //         .update({
    //           dividend_upcoming_date: lastUpcomeDividend?.pay_date
    //             ? lastUpcomeDividend?.pay_date
    //             : null,
    //           dividend_upcoming_value: lastUpcomeDividend?.cash_amount
    //             ? lastUpcomeDividend?.cash_amount
    //             : null,
    //         })
    //         .eq("ticker", stock.ticker);
    //     } catch {}
    //       }, 
    //       index * 15000)
    //   })
    // })
  }

  res.json({ message: "Ok" });
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
      const t = setTimeout(async () => {
        try {
          const html = await axios.get(
            `https://stockanalysis.com/stocks/${stock.ticker.replace(
              "-",
              "."
            )}/dividend/`
          );

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

            if(lastPayDate) {
              console.log(stock.ticker)
            }

            /* --- UPDATE UPCOMING DIVIDEND ---  */
            await supabaseClient
              .from("stock")
              .update({
                dividend_upcoming_date: lastPayDate ? lastPayDate : null,
                dividend_upcoming_value: lastCashAmount ? lastCashAmount : null,
              })
              .eq("ticker", stock.ticker);
          }
        } catch {
          console.log("ERROR");
        }
        clearTimeout(t)
      }, index * 2000);
    });
  }

  res.json({ message: 'Ok' })
})

app.listen(80, async () => {
  console.log("SERVER WORK")
  // await axios.get(`${process.env.CLIENT_URL}/update-dividends`)
});
