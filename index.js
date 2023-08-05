const express = require("express");
const cors = require("cors");
const supabase = require('@supabase/supabase-js')

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Ok", route: "/" });
});

app.get('/update-price-current', async (req, res) => {
  res.json({ route: '/update-price-current'})
})

app.listen(80, () => {
  console.log("SERVER WORK")
});
