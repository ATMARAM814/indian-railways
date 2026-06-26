const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const {
  getPendingApprovalsController,
  approveAssessmentController,
  rejectAssessmentController,
  modifyAssessmentController,
} = require("./approval.controller");

router.get(
  "/pending",
  authenticate,
  enforcePasswordChange,
  getPendingApprovalsController
);

router.post(
  "/:assessmentId/approve",
  authenticate,
  enforcePasswordChange,
  approveAssessmentController
);

router.post(
  "/:assessmentId/reject",
  authenticate,
  enforcePasswordChange,
  rejectAssessmentController
);

router.post(
  "/:assessmentId/modify",
  authenticate,
  enforcePasswordChange,
  modifyAssessmentController
);

module.exports = router;