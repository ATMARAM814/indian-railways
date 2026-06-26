const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const { authorize } = require("../../middleware/role.middleware");

const {
  getAuditLogs,
  getAuditLogById,
  getAuditLogsSummaryController,
  getCriticalAuditLogsController,
} = require("./audit.controller");

// Only SUPER_ADMIN is allowed to view audit logs
router.get(
  "/",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getAuditLogs
);

router.get(
  "/summary",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getAuditLogsSummaryController
);

router.get(
  "/critical",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getCriticalAuditLogsController
);

router.get(
  "/:id",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  getAuditLogById
);

module.exports = router;
