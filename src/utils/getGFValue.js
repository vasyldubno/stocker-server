// timeout === 100

const { load } = require('cheerio')
const { default: axios } = require("axios");

const getGFValue = async (ticker) => {
  try {
    const html = await axios.get(
      `https://www.gurufocus.com/term/gf_value/${ticker.replace(
        "-",
        "."
      )}/GF-Value/`
    );

    if (html.data) {
      const $ = load(html.data);
      const result = $("#def_body_detail_height").find("font").first().text();
      return Number(result.replace(/[^0-9.]/g, ""));
    }
    return null
  } catch {
    console.log("ERROR => GET_GF_VALUE");
    return null
  }
};

module.exports = getGFValue