const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const { authorize } = require("../../middleware/role.middleware");

const {
  getAssessmentsReport,
  getStaffPerformanceReport,
  getStationSummaryReport,
  getApprovalStatusReport,
  getReportsSummary,
  getReportsPerformance,
  getReportsHighRisk,
  getReportsStations,
  getReportsCycles,
  getEmployeeReport,
} = require("./report.controller");

// Apply authentication, password change enforcement, and role authorization to all reports endpoints
const reportsAuth = [
  authenticate,
  enforcePasswordChange,
  authorize("SM", "SS", "Cabin Master", "CABIN MASTER", "Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "TI", "AOM", "SUPER_ADMIN")
];

// Detailed Assessment List Report
router.get(
  "/assessments",
  ...reportsAuth,
  getAssessmentsReport
);

// Staff-wise Performance Summary Report (Workforce Performance)
router.get(
  "/staff-performance",
  ...reportsAuth,
  getStaffPerformanceReport
);

// Station-wise Summary Report
router.get(
  "/station-summary",
  ...reportsAuth,
  getStationSummaryReport
);

// Approval Workflow Report
router.get(
  "/approval-status",
  ...reportsAuth,
  getApprovalStatusReport
);

// Reports Summary KPIs
router.get(
  "/summary",
  ...reportsAuth,
  getReportsSummary
);

// Reports Performance Chart Data
router.get(
  "/performance",
  ...reportsAuth,
  getReportsPerformance
);

// Reports High Risk Staff
router.get(
  "/high-risk",
  ...reportsAuth,
  getReportsHighRisk
);

// Reports Stations performance
router.get(
  "/stations",
  ...reportsAuth,
  getReportsStations
);

// Reports Cycle comparisons
router.get(
  "/cycles",
  ...reportsAuth,
  getReportsCycles
);

// Detailed Employee Report Card
router.get(
  "/employee/:id",
  ...reportsAuth,
  getEmployeeReport
);

module.exports = router;
