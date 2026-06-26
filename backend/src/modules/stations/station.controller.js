const {
  listStations,
  listStationStaff,
  getStaffSummary,
  listStationStaffGrouped,
  listDivisions,
  listScopedStationsService,
  getStationIntelligenceService,
  createStationService
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

    const staff = await listStationStaff(stationId);

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getStationSummaryController(req, res) {
  try {
    const { stationId } = req.params;

    const summary = await getStaffSummary(stationId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getStationStaffGroupedController(req, res) {
  try {
    const { stationId } = req.params;

    const groupedStaff =
      await listStationStaffGrouped(stationId);

    return res.status(200).json({
      success: true,
      data: groupedStaff,
    });
  } catch (error) {
    return res.status(500).json({
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

module.exports = {
  getStationsController,
  getStationStaffController,
  getStationSummaryController,
  getStationStaffGroupedController,
  getDivisionsController,
  getStationIntelligenceController,
  createStationController
};