const express = require("express");
const cors = require("cors");
const supabase = require('@supabase/supabase-js')
const getPriceCurrent = require('./src/utils/getPriceCurrent.js')
const getPriceGrowth = require('./src/utils/getPriceGrowth.js')
const ROUND = require('./src/utils/round.js')

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

  const stocks = await client.from('stock').select().in('ticker', ['A', 'AAPL'])

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

              const r = await client
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

app.listen(80, () => {
  console.log("SERVER WORK")
});
