const {
  listStations,
  listStationStaff,
  getStaffSummary,
  listStationStaffGrouped,
  listDivisions,
  listScopedStationsService,
  getStationIntelligenceService,
  getCategoryCandidatesService,
  createStationService,
  updateStationService
} = require("./station.service");

async function getStationsController(req, res) {
  try {
    const filters = {
      stationName: req.query.stationName,
      stationCode: req.query.stationCode,
      assignedTI: req.query.assignedTI
    };
    
    // Call scoped stations list service
    const stations = await listScopedStationsService(
      req.user.userId,
      req.user.role,
      filters
    );

    return res.status(200).json({
      success: true,
      data: stations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getStationStaffController(req, res) {
  try {
    const { stationId } = req.params;

    const staff = await listStationStaff(stationId, req.user.userId, req.user.role);

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    const isAccessDenied = error.message.includes("Access Denied");
    return res.status(isAccessDenied ? 403 : 500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getStationSummaryController(req, res) {
  try {
    const { stationId } = req.params;

    const summary = await getStaffSummary(stationId, req.user.userId, req.user.role);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const isAccessDenied = error.message.includes("Access Denied");
    return res.status(isAccessDenied ? 403 : 500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getStationStaffGroupedController(req, res) {
  try {
    const { stationId } = req.params;

    const groupedStaff =
      await listStationStaffGrouped(stationId, req.user.userId, req.user.role);

    return res.status(200).json({
      success: true,
      data: groupedStaff,
    });
  } catch (error) {
    const isAccessDenied = error.message.includes("Access Denied");
    return res.status(isAccessDenied ? 403 : 500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getDivisionsController(req, res) {
  try {
    const divisions = await listDivisions();

    return res.status(200).json({
      success: true,
      data: divisions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getStationIntelligenceController(req, res) {
  try {
    const { stationId } = req.params;
    const data = await getStationIntelligenceService(
      stationId,
      req.user.userId,
      req.user.role
    );
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(error.message.includes("Access Denied") ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
}

async function createStationController(req, res) {
  try {
    if (!["TI", "AOM", "SUPER_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Unauthorized role to create stations."
      });
    }

    const station = await createStationService(
      req.user.userId,
      req.user.role,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Station created successfully",
      data: station
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

async function getCategoryCandidatesController(req, res) {
  try {
    const { stationId } = req.params;
    const { category } = req.query;
    if (!category || !["C", "D"].includes(category.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing category parameter. Must be 'C' or 'D'."
      });
    }
    const data = await getCategoryCandidatesService(
      stationId,
      category.toUpperCase(),
      req.user.userId,
      req.user.role
    );
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(error.message.includes("Access Denied") ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
}

async function updateStationController(req, res) {
  try {
    const { stationId } = req.params;

    if (!["TI", "AOM", "SUPER_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Unauthorized role to update stations."
      });
    }

    const station = await updateStationService(
      stationId,
      req.user.userId,
      req.user.role,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Station updated successfully",
      data: station
    });
  } catch (error) {
    return res.status(error.message.includes("Access Denied") ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  getStationsController,
  getStationStaffController,
  getStationSummaryController,
  getStationStaffGroupedController,
  getDivisionsController,
  getStationIntelligenceController,
  getCategoryCandidatesController,
  createStationController,
  updateStationController
};