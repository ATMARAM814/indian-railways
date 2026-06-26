const { logAction } = require("../audit/audit.service");
const {
  getAssessmentsReportService,
  getStaffPerformanceReportService,
  getStationSummaryReportService,
  getApprovalStatusReportService,
  getReportsSummaryService,
  getReportsPerformanceService,
  getReportsHighRiskService,
  getReportsStationsService,
  getReportsCyclesService,
  getEmployeeReportService,
} = require("./report.service");

async function getAssessmentsReport(req, res) {
  try {
    const data = await getAssessmentsReportService(
      req.user.userId,
      req.user.role,
      req.query
    );
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

async function getStaffPerformanceReport(req, res) {
  try {
    const data = await getStaffPerformanceReportService(
      req.user.userId,
      req.user.role,
      req.query
    );
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

async function getStationSummaryReport(req, res) {
  try {
    const data = await getStationSummaryReportService(
      req.user.userId,
      req.user.role,
      req.query
    );
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

async function getApprovalStatusReport(req, res) {
  try {
    const data = await getApprovalStatusReportService(
      req.user.userId,
      req.user.role,
      req.query
    );
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

async function getReportsSummary(req, res) {
  try {
    const data = await getReportsSummaryService(
      req.user.userId,
      req.user.role,
      req.query
    );

    await logAction({
      performedBy: req.user.userId,
      actionType: "REPORT_VIEWED",
      entityType: "REPORT",
      remarks: `Viewed reports summary with filters: ${JSON.stringify(req.query)}`
    });

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

async function getReportsPerformance(req, res) {
  try {
    const data = await getReportsPerformanceService(
      req.user.userId,
      req.user.role,
      req.query
    );

    await logAction({
      performedBy: req.user.userId,
      actionType: "REPORT_FILTERED",
      entityType: "REPORT",
      remarks: `Filtered performance charts with filters: ${JSON.stringify(req.query)}`
    });

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

async function getReportsHighRisk(req, res) {
  try {
    const data = await getReportsHighRiskService(
      req.user.userId,
      req.user.role,
      req.query
    );
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

async function getReportsStations(req, res) {
  try {
    const data = await getReportsStationsService(
      req.user.userId,
      req.user.role,
      req.query
    );

    await logAction({
      performedBy: req.user.userId,
      actionType: "STATION_REPORT_VIEWED",
      entityType: "REPORT",
      remarks: `Viewed station performance report with filters: ${JSON.stringify(req.query)}`
    });

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

async function getReportsCycles(req, res) {
  try {
    const data = await getReportsCyclesService(
      req.user.userId,
      req.user.role,
      req.query
    );
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

async function getEmployeeReport(req, res) {
  try {
    const data = await getEmployeeReportService(
      req.user.userId,
      req.user.role,
      req.params.id
    );

    await logAction({
      performedBy: req.user.userId,
      actionType: "EMPLOYEE_REPORT_VIEWED",
      entityType: "PROFILE",
      entityId: req.params.id,
      remarks: `Viewed detailed employee report card for user ID: ${req.params.id}`
    });

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

module.exports = {
  getAssessmentsReport,
  getStaffPerformanceReport,
  getStationSummaryReport,
  getApprovalStatusReport,
  getReportsSummary,
  getReportsPerformance,
  getReportsHighRisk,
  getReportsStations,
  getReportsCycles,
  getEmployeeReport,
};
