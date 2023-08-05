const express = require("express");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Ok", route: "/" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("SERVER WORK")
});
