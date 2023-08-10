// import axios from "axios";
const axios = require('axios')
const ROUND = require('./round.js')

const getPriceCurrent = async (
  ticker,
  exchange
) => {
  if (ticker && exchange) {
    const response = await axios.get(
      `https://markets.sh/api/v1/symbols/${exchange}:${ticker}?api_token=7ea62693bd4ebc0ae34595335732676b`
    );

    return {
      priceCurrent: Number(response.data.last_price.toFixed(2)),
      priceTodayGrowth: ROUND(Number(response.data.change_perc_today) * 100)
    };
  }
};

module.exports = getPriceCurrent