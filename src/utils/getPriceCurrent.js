// import axios from "axios";
const axios = require('axios')

const getPriceCurrent = async (
  ticker,
  exchange
) => {
  if (ticker && exchange) {
    const response = await axios.get(
      `https://markets.sh/api/v1/symbols/${exchange}:${ticker}?api_token=7ea62693bd4ebc0ae34595335732676b`
    );

    return Number(response.data.last_price.toFixed(2));
  }
};

module.exports = getPriceCurrent