const {
  getPmDashboardService,
  getTmDashboardService,
  getSmDashboardService,
  getTiDashboardService,
  getAomDashboardService,
  getSuperAdminDashboardService,
  getSuperAdminWorkforceActivityService,
  getSuperAdminHighRiskStaffService,
  getSmSupervisorDashboardService,
  getDashboardCategoryCandidatesService,
} = require("./dashboard.service");

async function getPmDashboard(req, res) {
  try {
    const data = await getPmDashboardService(req.user.userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getTmDashboard(req, res) {
  try {
    const data = await getTmDashboardService(req.user.userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSmDashboard(req, res) {
  try {
    const data = await getSmDashboardService(req.user.userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getTiDashboard(req, res) {
  try {
    console.log(`[BACKEND API /dashboard/ti] Logged-in TI HRMS ID: ${req.user?.hrmsId || 'N/A'}, Profile ID: ${req.user?.userId || 'N/A'}`);
    const data = await getTiDashboardService(req.user.userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(`[BACKEND API /dashboard/ti] Error:`, error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAomDashboard(req, res) {
  try {
    const data = await getAomDashboardService(req.user.userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSuperAdminDashboard(req, res) {
  try {
    const data = await getSuperAdminDashboardService();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSuperAdminWorkforceActivity(req, res) {
  try {
    const filters = {
      fromDate: req.query.fromDate || null,
      toDate: req.query.toDate || null,
      roleCode: req.query.role || null,
      actionType: req.query.activityType || null,
      stationId: req.query.stationId || null,
      stationName: req.query.stationName || null,
      category: req.query.category || null,
      search: req.query.search || null,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
    };
    const data = await getSuperAdminWorkforceActivityService(filters);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSuperAdminHighRiskStaff(req, res) {
  try {
    const filters = {
      fromDate: req.query.fromDate || null,
      toDate: req.query.toDate || null,
      stationId: req.query.stationId || null,
      stationName: req.query.stationName || null,
      roleCode: req.query.role || null,
      category: req.query.category || null,
      riskLevel: req.query.riskLevel || null,
      search: req.query.search || null,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
    };
    const data = await getSuperAdminHighRiskStaffService(filters);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSmSupervisorDashboard(req, res) {
  try {
    const data = await getSmSupervisorDashboardService(req.user.userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getDashboardCategoryCandidates(req, res) {
  try {
    const { category, search, stationSearch, limit } = req.query;
    if (!category || !["C", "D"].includes(category.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing category parameter. Must be 'C' or 'D'."
      });
    }
    const data = await getDashboardCategoryCandidatesService({
      role: req.user.role,
      userId: req.user.userId,
      category: category.toUpperCase(),
      search,
      stationSearch,
      limit: limit ? parseInt(limit, 10) : null
    });
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

module.exports = {
  getPmDashboard,
  getTmDashboard,
  getSmDashboard,
  getTiDashboard,
  getAomDashboard,
  getSuperAdminDashboard,
  getSuperAdminWorkforceActivity,
  getSuperAdminHighRiskStaff,
  getSmSupervisorDashboard,
  getDashboardCategoryCandidates,
};
