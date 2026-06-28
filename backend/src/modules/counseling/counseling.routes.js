const express = require("express");
const { authenticate, authorize } = require("../../middleware/auth");
const {
  getCandidateCounselingController,
  saveCandidateCounselingController
} = require("./counseling.controller");

const router = express.Router();

// Get candidate profile and counseling topics checklist
router.get(
  "/candidate/:profileId",
  authenticate,
  authorize(["TI", "SMS", "AOM", "SUPER_ADMIN", "Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "AOM Users", "AOM Users"]),
  getCandidateCounselingController
);

// Save candidate checklist statuses
router.post(
  "/save",
  authenticate,
  authorize(["TI", "SMS", "AOM", "SUPER_ADMIN", "Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "AOM Users", "AOM Users"]),
  saveCandidateCounselingController
);

module.exports = router;
