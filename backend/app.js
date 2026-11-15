const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({ message: "TimeCapsule API is running!" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/capsules", require("./routes/capsuleRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
