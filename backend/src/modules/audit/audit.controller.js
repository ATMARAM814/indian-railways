const {
  getAuditLogsService,
  getAuditLogByIdService,
  getAuditSummaryService,
} = require("./audit.service");

async function getAuditLogs(req, res) {
  try {
    const data = await getAuditLogsService(
      req.user.userId,
      req.user.role,
      req.query
    );
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("Access denied") ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAuditLogById(req, res) {
  try {
    const { id } = req.params;
    const data = await getAuditLogByIdService(
      id,
      req.user.userId,
      req.user.role
    );
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("Access denied") ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAuditLogsSummaryController(req, res) {
  try {
    const data = await getAuditSummaryService(
      req.user.userId,
      req.user.role
    );
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("Access denied") ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function getCriticalAuditLogsController(req, res) {
  try {
    const filters = { ...req.query, severity: 'HIGH_CRITICAL' };
    const data = await getAuditLogsService(
      req.user.userId,
      req.user.role,
      filters
    );
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("Access denied") ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditLogsSummaryController,
  getCriticalAuditLogsController,
};
