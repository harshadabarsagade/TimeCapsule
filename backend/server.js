
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { initializeSocket } = require("./services/socketService");
const startCapsuleScheduler = require("./jobs/capsuleScheduler");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to backend/.env");
  process.exit(1);
}

const allowedOrigins = [
  "http://localhost:5173",
  "https://time-capsule-8wyc.vercel.app",
  "https://time-capsule-1-aptn7m0bx-harshadabarsagades-projects.vercel.app",
  "https://time-capsule-1.vercel.app"
];

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

initializeSocket(io);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    startCapsuleScheduler();

    server.listen(PORT, () => {
      console.log(`TimeCapsule backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
