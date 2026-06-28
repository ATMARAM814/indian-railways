const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const { authorize } = require("../../middleware/role.middleware");

const {
  getPmDashboard,
  getTmDashboard,
  getSmDashboard,
  getTiDashboard,
  getAomDashboard,
  getSuperAdminDashboard,
  getSuperAdminWorkforceActivity,
  getSuperAdminHighRiskStaff,
  getSmSupervisorDashboard,
  getDashboardCategoryCandidates,
} = require("./dashboard.controller");

// PM Dashboard
router.get(
  "/pm",
  authenticate,
  enforcePasswordChange,
  authorize("PM"),
  getPmDashboard
);

// TM Dashboard
router.get(
  "/tm",
  authenticate,
  enforcePasswordChange,
  authorize("TM"),
  getTmDashboard
);

// Shunting Master Dashboard
router.get(
  "/shunting-master",
  authenticate,
  enforcePasswordChange,
  authorize("Shunting Master", "SHUNTING MASTER", "SHM"),
  getPmDashboard
);

// SM Dashboard (shared with Station Master Incharge / SS / Cabin Master)
router.get(
  "/sm",
  authenticate,
  enforcePasswordChange,
  authorize("SM", "SS", "Cabin Master", "CABIN MASTER"),
  getSmDashboard
);

// Station Master Supervisor Dashboard
router.get(
  "/station-master-supervisor",
  authenticate,
  enforcePasswordChange,
  authorize("Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS"),
  getSmSupervisorDashboard
);

// TI Dashboard
router.get(
  "/ti",
  authenticate,
  enforcePasswordChange,
  authorize("TI"),
  getTiDashboard
);

// AOM Dashboard
router.get(
  "/aom",
  authenticate,
  enforcePasswordChange,
  authorize("AOM"),
  getAomDashboard
);

// Super Admin Dashboard
router.get(
  "/super-admin",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getSuperAdminDashboard
);

router.get(
  "/super-admin/workforce-activity",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getSuperAdminWorkforceActivity
);

router.get(
  "/super-admin/high-risk-staff",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getSuperAdminHighRiskStaff
);

router.get(
  "/category-candidates",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM", "TI"),
  getDashboardCategoryCandidates
);

module.exports = router;
