const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const {
  getMyAssessmentsHistoryController,
  getActiveAssessmentController,
  getAssessmentResultController,
  getMcqQuestionsForExamController,
  startMcqExamController,
  saveCandidateAnswerController,
  toggleMarkForReviewController,
  submitMcqExamController,
} = require("./candidateAssessment.controller");

router.get(
  "/",
  authenticate,
  enforcePasswordChange,
  getMyAssessmentsHistoryController
);

router.get(
  "/active",
  authenticate,
  enforcePasswordChange,
  getActiveAssessmentController
);

router.get(
  "/:id",
  authenticate,
  enforcePasswordChange,
  getAssessmentResultController
);

router.get(
  "/:id/questions",
  authenticate,
  enforcePasswordChange,
  getMcqQuestionsForExamController
);

router.post(
  "/:id/start",
  authenticate,
  enforcePasswordChange,
  startMcqExamController
);

router.post(
  "/:id/save-answer",
  authenticate,
  enforcePasswordChange,
  saveCandidateAnswerController
);

router.post(
  "/:id/mark-review",
  authenticate,
  enforcePasswordChange,
  toggleMarkForReviewController
);

router.post(
  "/:id/submit",
  authenticate,
  enforcePasswordChange,
  submitMcqExamController
);

module.exports = router;
