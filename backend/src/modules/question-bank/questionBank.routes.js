const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const { authorize } = require("../../middleware/role.middleware");

const {
  addQuestion,
  listQuestions,
  getQuestionById,
  updateQuestion,
  activateQuestion,
  deactivateQuestion,
  importQuestions,
  uploadQuestionsController,
  uploadHistoryController,
  statsController,
  downloadExcelTemplateController,
  deleteQuestion,
  exportQuestionsController,
} = require("./questionBank.controller");

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Admin Question Bank Bulk Upload endpoints (Static - Must be before parameterized routes)
router.post(
  "/upload",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  upload.single("file"),
  uploadQuestionsController
);

router.get(
  "/upload-history",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  uploadHistoryController
);

router.get(
  "/stats",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN"),
  statsController
);

router.get(
  "/templates/excel",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  downloadExcelTemplateController
);

router.get(
  "/export",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  exportQuestionsController
);

router.post(
  "/import",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  importQuestions
);

// Read endpoints: authenticated users can access
router.get(
  "/",
  authenticate,
  enforcePasswordChange,
  listQuestions
);

// Parameterized routes (placed at the bottom)
router.get(
  "/:id",
  authenticate,
  enforcePasswordChange,
  getQuestionById
);

// Manage endpoints: Only AOM and SUPER_ADMIN
router.post(
  "/",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  addQuestion
);

router.put(
  "/:id",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  updateQuestion
);

router.patch(
  "/:id/activate",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  activateQuestion
);

router.patch(
  "/:id/deactivate",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  deactivateQuestion
);

router.delete(
  "/:id",
  authenticate,
  enforcePasswordChange,
  authorize("SUPER_ADMIN", "AOM"),
  deleteQuestion
);

module.exports = router;
