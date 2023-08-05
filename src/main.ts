// import { supabaseClient } from "./config/supabaseClient";
const { supabaseClient } = require("./config/supabaseClient");
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { ROUND } from "./utils/round";
import { getPriceCurrent } from "./utils/getPriceCurrent";
import { getPriceGrowth } from "./utils/getPriceGrowth";
import cron from "cron";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL }));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Ok", route: "/" });
});

app.get("/update-price-current", async (req: Request, res: Response) => {
  const stocks = await supabaseClient
    .from("stock")
    .select()
    .order("ticker", { ascending: true })
    .in("ticker", ["A", "AAL", "AAP", "AAPL"]);

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

              await supabaseClient
                .from("stock")
                .update({
                  price_current: priceCurrent,
                  price_growth: priceGrowth,
                  price_year_high:
                    stock.price_year_high &&
                    priceCurrent > stock.price_year_high
                      ? priceCurrent
                      : stock.price_year_high,
                  gfValueMargin: ROUND(
                    ((Number(stock.gfValue) - priceCurrent) / priceCurrent) *
                      100
                  ),
                })
                .eq("ticker", stock.ticker);

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
  res.json({ results: stocks, route: "/update-price-current" });
});

const job = new cron.CronJob("*/1 * * * *", async () => {
  await axios.get(`${process.env.SERVER_URL}/update-price-current`);
});
job.start();

app.listen(process.env.PORT, () => {
  console.log("SERVER WORK");
});
