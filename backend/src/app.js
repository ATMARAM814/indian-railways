const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./modules/auth/auth.routes");
const { authenticate } = require("./middleware/auth.middleware");
const { authorize } = require("./middleware/role.middleware");
const stationRoutes = require("./modules/stations/station.routes");
const assessmentRoutes = require("./modules/assessments/assessment.routes");
const approvalRoutes = require("./modules/approvals/approval.routes");
const userRoutes = require("./modules/users/user.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const reportRoutes = require("./modules/reports/report.routes");
const auditRoutes = require("./modules/audit/audit.routes");
const questionBankRoutes = require("./modules/question-bank/questionBank.routes");
const candidateAssessmentRoutes = require("./modules/candidate-assessments/candidateAssessment.routes");
const { getPmeRefStatusController } = require("./modules/assessments/assessment.controller");
const { globalErrorHandler } = require("./middleware/error.middleware");

const app = express();

// 1. Register Helmet for Security Headers
app.use(helmet());

// 2. Register Compression for HTTP Response Optimization
app.use(compression());

// 3. Configure CORS securely
const frontendUrl = process.env.FRONTEND_URL;
const corsOptions = {
  origin: function (origin, callback) {
    const isDevelopment = process.env.NODE_ENV !== "production";
    if (isDevelopment || !origin || origin === frontendUrl || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: origin not allowed."));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// 4. Rate Limiting protection
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50,
  message: { success: false, message: "Too many authentication attempts, please try again after 15 minutes." },
  legacyHeaders: false,
});

// Apply global rate limiting to all requests
app.use(globalLimiter);

// 5. Body Parsing Middlewares
app.use(express.json({ limit: "10mb" })); // Protection from large JSON payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6. Define Routes
app.use("/auth", authLimiter, authRoutes); // Apply stricter rate limiter to auth endpoints
app.use("/stations", stationRoutes);
app.use("/assessments", assessmentRoutes);
app.use("/approvals", approvalRoutes);
app.use("/users", userRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/reports", reportRoutes);
app.use("/audit", auditRoutes);
app.use("/question-bank", questionBankRoutes);
app.use("/admin/question-bank", questionBankRoutes);
app.use("/my-assessments", candidateAssessmentRoutes);

app.get("/me/pme-ref-status", authenticate, getPmeRefStatusController);

// Health check endpoint
app.get("/health", async (req, res) => {
  const pool = require("./config/database");
  let dbStatus = "healthy";
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    dbStatus = "unhealthy";
  }

  res.status(dbStatus === "healthy" ? 200 : 500).json({
    success: dbStatus === "healthy",
    status: dbStatus === "healthy" ? "UP" : "DOWN",
    timestamp: new Date(),
    uptime: process.uptime(),
    db: dbStatus,
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Indian Railway Evaluation System API Running",
  });
});

app.get(
  "/test/ti-only",
  authenticate,
  authorize("TI"),
  (req, res) => {
    res.json({
      success: true,
      message: "TI protected route accessed successfully",
      user: req.user,
    });
  }
);

// 7. Global Error Handler Middleware
app.use(globalErrorHandler);

module.exports = app;