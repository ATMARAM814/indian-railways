const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const {
  createAssessmentController,
  getAssessmentQuestionsController,
  submitMcqAnswersController,
  submitEvaluationController,
  getAssessmentResultController,
  getMyCreatedAssessmentsController,
  getMyPendingAssessmentsController,
  getPendingEvaluationsController,
  getMyResultsController,
  saveEvaluationDraftController,
  getEvaluationDraftController,
  getEligibleStaffController,
  getAssessorRoleStatsController,
  getYesNoQuestionsController,
  getAssessmentAnswersController,
  cancelAssessmentController,
  getEmployeeAssessmentHistoryController,
  getBulkEligibleStaffController,
  createBulkAssessmentsController,
} = require("./assessment.controller");

router.post(
  "/",
  authenticate,
  enforcePasswordChange,
  createAssessmentController
);

router.get(
  "/:assessmentId/questions",
  authenticate,
  enforcePasswordChange,
  getAssessmentQuestionsController
);

router.post(
  "/:assessmentId/submit",
  authenticate,
  enforcePasswordChange,
  submitMcqAnswersController
);

router.post(
  "/:assessmentId/evaluate",
  authenticate,
  enforcePasswordChange,
  submitEvaluationController
);

router.get(
  "/:assessmentId/result",
  authenticate,
  enforcePasswordChange,
  getAssessmentResultController
);

router.get(
  "/my-created",
  authenticate,
  enforcePasswordChange,
  getMyCreatedAssessmentsController
);

router.get(
  "/my-pending",
  authenticate,
  enforcePasswordChange,
  getMyPendingAssessmentsController
);

router.get(
  "/pending-evaluation",
  authenticate,
  enforcePasswordChange,
  getPendingEvaluationsController
);

router.get(
  "/my-results",
  authenticate,
  enforcePasswordChange,
  getMyResultsController
);

router.post(
  "/:assessmentId/evaluation-draft",
  authenticate,
  enforcePasswordChange,
  saveEvaluationDraftController
);

router.get(
  "/:assessmentId/evaluation-draft",
  authenticate,
  enforcePasswordChange,
  getEvaluationDraftController
);

router.get(
  "/eligible/:roleCode",
  authenticate,
  enforcePasswordChange,
  getEligibleStaffController
);

router.get(
  "/stats/:roleCode",
  authenticate,
  enforcePasswordChange,
  getAssessorRoleStatsController
);

router.get(
  "/stats",
  authenticate,
  enforcePasswordChange,
  getAssessorRoleStatsController
);

router.get(
  "/questions/yes-no/:roleCode",
  authenticate,
  enforcePasswordChange,
  getYesNoQuestionsController
);

router.get(
  "/:assessmentId/answers",
  authenticate,
  enforcePasswordChange,
  getAssessmentAnswersController
);

router.post(
  "/:assessmentId/cancel",
  authenticate,
  enforcePasswordChange,
  cancelAssessmentController
);

router.get(
  "/employee/:employeeId/history",
  authenticate,
  enforcePasswordChange,
  getEmployeeAssessmentHistoryController
);

router.get(
  "/bulk/eligible/:roleCode",
  authenticate,
  enforcePasswordChange,
  getBulkEligibleStaffController
);

router.post(
  "/bulk",
  authenticate,
  enforcePasswordChange,
  createBulkAssessmentsController
);

module.exports = router;