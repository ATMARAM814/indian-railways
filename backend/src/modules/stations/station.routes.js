const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const { validateStationId } = require("./station.validator");

const {
  getStationsController,
  getStationStaffController,
  getStationSummaryController,
  getStationStaffGroupedController,
  getDivisionsController,
  getStationIntelligenceController,
  getCategoryCandidatesController,
  createStationController
} = require("./station.controller");

router.get(
  "/",
  authenticate,
  enforcePasswordChange,
  getStationsController
);

router.post(
  "/",
  authenticate,
  enforcePasswordChange,
  createStationController
);

router.get(
  "/divisions",
  authenticate,
  enforcePasswordChange,
  getDivisionsController
);

router.get(
  "/:stationId/intelligence",
  authenticate,
  enforcePasswordChange,
  validateStationId,
  getStationIntelligenceController
);

router.get(
  "/:stationId/category-candidates",
  authenticate,
  enforcePasswordChange,
  validateStationId,
  getCategoryCandidatesController
);

router.get(
  "/:stationId/staff",
  authenticate,
  enforcePasswordChange,
  getStationStaffController
);

router.get(
  "/:stationId/summary",
  authenticate,
  enforcePasswordChange,
  getStationSummaryController
);

router.get(
  "/:stationId/staff/grouped",
  authenticate,
  enforcePasswordChange,
  getStationStaffGroupedController
);

module.exports = router;