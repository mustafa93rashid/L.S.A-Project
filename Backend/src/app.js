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
// CORS Configuration
//=========================================================================
 
const allowedOrigins = [
  process.env.DASHBOARD_URL,
  process.env.WEBSITE_URL,
  process.env.DASHBOARD_URL_LOCAL,
  process.env.WEBSITE_URL_LOCAL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin header
      // such as Postman, curl, health checks, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

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

// Partner routes
app.use("/api/v1/partners", require("./routers/partner.routes"));

// Journey routes
app.use("/api/v1/journeys", require("./routers/journey.routes"));

// Team Member routes
app.use("/api/v1/team-members", require("./routers/teamMember.routes"));

// Service routes
app.use("/api/v1/services", require("./routers/service.routes"));

// Project routes
app.use("/api/v1/projects", require("./routers/project.routes"));

// Equipments routes
app.use("/api/v1/equipments", require("./routers/equipment.routes"));
app.use("/api/v1/equipments-request", require("./routers/equipmentRequest.routes"));

// Jobs routes
app.use("/api/v1/jobs", require("./routers/job.routes"));
app.use("/api/v1/job-requests", require("./routers/jobRequest.routes"));

// Contacts routes
app.use("/api/v1/contacts", require("./routers/contactInfo.routes"));

// Contact Message routes
app.use("/api/v1/contact-messages", require("./routers/contactMessage.routes"));

// Notification routes
app.use("/api/v1/notifications", require("./routers/notification.routes"));

// Company Profile routes
app.use("/api/v1/company-profile", require("./routers/companyProfile.routes"));

// Backup routes
app.use("/api/v1/backups", require("./routers/backup.routes"));

// News routes
app.use("/api/v1/news", require("./routers/news.routes")); 

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