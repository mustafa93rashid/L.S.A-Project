require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

const { initializeSocket } = require("./config/socket");

const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const xssSanitize = require("./middlewares/xss");

const app = express();
const server = http.createServer(app);

//=========================================================================
// Middleware Setup
//=========================================================================
app.use(express.json());
app.use(morgan("dev"));
app.use(cookies());
app.use(xssSanitize);

//=========================================================================
// API Routes
//=========================================================================

// Health check route
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// Auth and User routes
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));

//=========================================================================
// Error Handling Middleware
//=========================================================================
app.use(notFound);
app.use(errorHandler);

//=========================================================================
// Server Initialization
//=========================================================================
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

// Initialize Socket.IO
initializeSocket(server);

// Connect to MongoDB and start the server
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB Successfully");

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });