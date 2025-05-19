const express = require("express");
const cors = require("cors");
const enhanceRouter = require("./routes/enhanceRouter");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", enhanceRouter);
app.use("/static/LR", express.static(path.join(__dirname, "ESRGAN/LR")));
app.use("/static/results", express.static(path.join(__dirname, "ESRGAN/results")));

app.get("/", (req, res) => {
  res.send("Hello from Vercel backend (Express)");
});

module.exports = app;
