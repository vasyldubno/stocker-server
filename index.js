// import { supabaseClient } from "./config/supabaseClient";
const { supabaseClient } = require("./src/config/supabaseClient.js");
// import express, { Express, Request, Response } from "express";
const express = require("express");
// import cors from "cors";
const cors = require("cors");
// import { ROUND } from "./utils/round";
const { ROUND } = require("./src/utils/round.js")
// import { getPriceCurrent } from "./utils/getPriceCurrent";
const { getPriceCurrent } = require("./src/utils/getPriceCurrent.js")
// import { getPriceGrowth } from "./utils/getPriceGrowth";
const { getPriceGrowth } = require("./src/utils/getPriceGrowth.js")
// import cron from "cron";
const cron = require('cron')
// import axios from "axios";
const axios = require('axios')
// import * as dotenv from "dotenv";
// dotenv.config();
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

app.get("/", (req, res) => {
  res.json({ message: "Ok", route: "/" });
});

app.get("/update-price-current", async (req, res) => {
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

app.listen(process.env.PORT || 3000, () => {
  console.log("SERVER WORK")
});
