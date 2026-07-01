const express = require("express");
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");
const {
  getCandidateCounselingController,
  saveCandidateCounselingController,
  activateRetestController,
  getCounselingDirectoryController,
  getCandidateCounselingHistoryController,
  getEligibleCandidatesForSchedulingController,
  scheduleCounselingController,
  getScheduledCounselingListController,
  cancelScheduledCounselingController,
  getRetestHistoryController,
  getCounselingSubjectsForRoleController,
  createCounselingSubjectController,
  updateCounselingSubjectController,
  deleteCounselingSubjectController
} = require("./counseling.controller");

const router = express.Router();

// Get list of eligible candidates for scheduling
router.get(
  "/schedule/eligible-candidates",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getEligibleCandidatesForSchedulingController
);

// Schedule a counseling session
router.post(
  "/schedule",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  scheduleCounselingController
);

// Get list of scheduled counseling sessions
router.get(
  "/schedule/list",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getScheduledCounselingListController
);

// Cancel a scheduled counseling session
router.post(
  "/schedule/cancel/:scheduleId",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  cancelScheduledCounselingController
);

// Get completed retests log
router.get(
  "/history-retests",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getRetestHistoryController
);

// Get overall counseling directory
router.get(
  "/directory",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getCounselingDirectoryController
);

// Get candidate counseling history logs
router.get(
  "/history/:profileId",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getCandidateCounselingHistoryController
);

// Get candidate profile and counseling topics checklist
router.get(
  "/candidate/:profileId",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getCandidateCounselingController
);

// Save candidate checklist statuses
router.post(
  "/save",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  saveCandidateCounselingController
);

// Activate candidate retest
router.post(
  "/activate-retest",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  activateRetestController
);

// Manage Subjects: Get subjects for a role
router.get(
  "/subjects/:roleCode",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  getCounselingSubjectsForRoleController
);

// Manage Subjects: Create a new subject
router.post(
  "/subjects",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  createCounselingSubjectController
);

// Manage Subjects: Update a subject
router.put(
  "/subjects/:subjectId",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  updateCounselingSubjectController
);

// Manage Subjects: Delete a subject
router.delete(
  "/subjects/:subjectId",
  authenticate,
  authorize("TI", "AOM", "SUPER_ADMIN", "AOM Users"),
  deleteCounselingSubjectController
);

module.exports = router;
