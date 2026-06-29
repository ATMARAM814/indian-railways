const express = require("express");
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");
const {
  getCandidateCounselingController,
  saveCandidateCounselingController,
  activateRetestController
} = require("./counseling.controller");

const router = express.Router();

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

module.exports = router;
