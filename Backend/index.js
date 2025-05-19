const express = require("express");
const cors = require("cors");
const enhanceRouter = require("./routes/enhanceRouter");
const { exec } = require("child_process");
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", enhanceRouter);
app.use("/static/LR", express.static(path.join(__dirname, "ESRGAN/LR")));
app.use(
  "/static/results",
  express.static(path.join(__dirname, "ESRGAN/results"))
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
