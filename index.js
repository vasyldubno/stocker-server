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
  const client = supabase.createClient('https://cufytakzggluwlfdjqsn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Znl0YWt6Z2dsdXdsZmRqcXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAzNzAyMDcsImV4cCI6MjAwNTk0NjIwN30.IAvHQ2HBCWaPzq71nK3e9k_h3Cu7VYVMBzCghiaqDl4')
  res.json({ route: '/update-price-current'})
})

app.listen(80, () => {
  console.log("SERVER WORK")
});
