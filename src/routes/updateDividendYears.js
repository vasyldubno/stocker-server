const { load } = require('cheerio')
const { default: axios } = require("axios");
const supabase = require('@supabase/supabase-js')

const handler = async (req, res) => {
  const supabaseClient = supabase.createClient(
    'https://cufytakzggluwlfdjqsn.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4'
  )

  const stocks = await supabaseClient
    .from("stock")
    .select()
    .order("ticker", { ascending: true });

  if (stocks.data) {
    stocks.data.forEach(async (stock, index) => {
      try {
        const html = await axios.get(
          `https://www.marketbeat.com/stocks/${stock.exchange}/${stock.ticker}/dividend/`
        );

        if(html.data) {
          console.log(stock.ticker)
          const $ = load(html.data);

          const result = $(
            ".col-12.col-md-6 > dl > div:nth-child(3) > dt"
          ).text();

          if (result === "Dividend Increase Track Record") {
            const response = $(
              ".col-12.col-md-6 > dl > div:nth-child(3) > dd"
            ).text();

            const years = response.trim().split(" ")[0];
            const isDividendAristocrat =
              Number(years) >= 25 && Number(years) < 50;
            const isDividendKing = Number(years) >= 50;

            await supabaseClient
              .from("stock")
              .update({
                isDividendAristocrat,
                isDividendKing,
                dividend_increase_track_record: years
              })
              .eq("ticker", stock.ticker);
          }
        }
      } catch (e) {
        console.log("ERROR /update-dividend-years", e);
      }
    });
  }

  res.json({
    route: '/update-dividend-years'
  });
}

module.exports = handler