const express = require("express");
const cors = require("cors");
const { supabaseClient } = require("./src/config/supabaseClient.js");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Ok", route: "/" });
});

app.get('/update-pricr-current', async (req, res) => {
  const stocks = await supabaseClient.from('stock').select().order('ticker', {ascending: true})
  res.json({ stocks })
})

app.listen(process.env.PORT || 3000, () => {
  console.log("SERVER WORK")
});
