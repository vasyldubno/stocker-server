const express = require("express");
const cors = require("cors");
const supabase = require('@supabase/supabase-js')
const getPriceCurrent = require('./src/utils/getPriceCurrent.js')
const getPriceGrowth = require('./src/utils/getPriceGrowth.js')
const ROUND = require('./src/utils/round.js')
const cron = require('cron');
const { default: axios } = require("axios");
const moment = require('moment-timezone')

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
    .select()
    // .eq("is_trading", true)
    // .eq("is_dividend", true)
    // .in('ticker', ['ADM'])
    .order("ticker", { ascending: true });

  if (stocks.data) {
    stocks.data.forEach((stock, index) => {
      setTimeout(async () => {
        try {
          const response = await axios.get(
            `https://api.polygon.io/v3/reference/dividends?ticker=${stock.ticker}&apiKey=OZ_9x0ccKRsnzoE6OqsoW0oGeQCmAohs`
          );

          console.log(stock.ticker)

          /* --- UPDATE UPCOMING DIVIDEND ---  */
          const today = moment().format("YYYY-MM-DD");

          const lastUpcomeDividend = response.data.results.find((item) =>
            moment(item.pay_date).isAfter(today)
          );

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
            .eq("ticker", stock.ticker);

          /* --- UPDATE DIVIDEND INCOME --- */
          // const supaStockPortfolio = await supabaseClient
          //   .from("stock_portfolio")
          //   .select()
          //   .eq("ticker", stock.ticker);

          // if (supaStockPortfolio.data) {
          //   supaStockPortfolio.data.forEach(async (stockPortfolio) => {
          //     if (stockPortfolio.startTradeDate) {
          //       const today = moment().format("YYYY-MM-DD");
          //       const std = new Date(stockPortfolio.startTradeDate);

                

          //       const last = response.data.results.find(
          //         (res) =>
          //           moment(new Date(res.pay_date)).isBefore(new Date(today)) &&
          //           moment(new Date(res.ex_dividend_date)).isAfter(moment(std))
          //       );

          //       if (last) {
          //         const isExistDividends = moment(
          //           stockPortfolio.lastDividendPayDate
          //         ).isSame(moment(last.pay_date));

          //         if (
          //           !isExistDividends &&
          //           stockPortfolio.amount_active_shares > 0 &&
          //           stockPortfolio.average_cost_per_share
          //         ) {
          //           const supaPortfolio = await supabaseClient
          //             .from("portfolio")
          //             .select()
          //             .eq("id", stockPortfolio.portfolio_id)
          //             .single();

          //           if (supaPortfolio.data) {
          //             const supaUser = await supabaseClient
          //               .from("user")
          //               .select()
          //               .eq("id", supaPortfolio.data.user_id)
          //               .single();

          //             if (supaUser.data) {
          //               const totalDividends = ROUND(
          //                 last.cash_amount * stockPortfolio.amount_active_shares
          //               );
          //               const cost =
          //                 stockPortfolio.average_cost_per_share *
          //                 stockPortfolio.amount_active_shares;
          //               const newTotalReturnValue = ROUND(
          //                 stockPortfolio.total_return_value ? stockPortfolio.total_return_value : 0 + totalDividends
          //               );
          //               const newTotalReturnMargin = ROUND(
          //                 (newTotalReturnValue / cost) * 100
          //               );
          //               const newTotalDividendIncome = ROUND(
          //                 stockPortfolio.total_dividend_income ? stockPortfolio.total_dividend_income : 0 + totalDividends
          //               );
          //               const newBalance = ROUND(
          //                 supaUser.data.balance + totalDividends
          //               );
          //               const year = Number(
          //                 moment(last.pay_date).format("YYYY")
          //               );

          //               await supabaseClient
          //                 .from("stock_portfolio")
          //                 .update({
          //                   lastDividendPayDate: last.pay_date,
          //                   total_dividend_income: newTotalDividendIncome,
          //                   total_return_value: newTotalReturnValue,
          //                   total_return_margin: newTotalReturnMargin,
          //                 })
          //                 .eq("ticker", stockPortfolio.ticker)
          //                 .eq("portfolio_id", stockPortfolio.portfolio_id);

          //               await supabaseClient.from("dividend").insert({
          //                 amount_shares: stockPortfolio.amount_active_shares,
          //                 dividendValue: ROUND(last.cash_amount),
          //                 dividendYield: ROUND(
          //                   (last.cash_amount /
          //                     stockPortfolio.average_cost_per_share) *
          //                     100
          //                 ),
          //                 ticker: stock.ticker,
          //                 payDate: last.pay_date,
          //                 totalAmount: totalDividends,
          //                 portfolio_id: stockPortfolio.portfolio_id,
          //                 year,
          //               });

          //               await supabaseClient
          //                 .from("user")
          //                 .update({ balance: newBalance })
          //                 .eq("id", supaUser.data.id);
          //             }
          //           }
          //         }
          //       }
          //     }
          //   });
          // }
        } catch {}
      }, index * 15000);
    });
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
//     // console.log('RUN JOB-DAY'); 
//     await axios.get(`${process.env.CLIENT_URL}/update-dividends`)}, 
//     // () => {}, 
//     // true
//   )
// jobDay.start()

const job = new cron.CronJob('*/1 * * * *', () => { console.log('RUN JOB') })
// job.start()

app.listen(80, async () => {
  console.log("SERVER WORK")
  // await axios.get(`${process.env.CLIENT_URL}/update-dividends`)
});
