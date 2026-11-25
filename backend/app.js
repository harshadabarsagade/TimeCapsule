
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://time-capsule-8wyc.vercel.app",
  "https://time-capsule-1-aptn7m0bx-harshadabarsagades-projects.vercel.app",
  "https://time-capsule-1.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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
