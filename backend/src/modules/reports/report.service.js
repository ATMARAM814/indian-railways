const db = require("./report.repository");

// ==========================================
// SCOPE RESOLUTION HELPER
// ==========================================

async function resolveScope(userId, role) {
  const scope = { type: role, userId };

  if (role === "SM" || role === "SS" || ["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS"].includes(role) || ["Cabin Master", "CABIN MASTER"].includes(role)) {
    scope.stationId = await db.getSmStation(userId);
  } else if (role === "TI") {
    scope.stationIds = await db.getTiStations(userId);
  } else if (role === "AOM") {
    scope.divisionId = await db.getAomDivision(userId);
  }

  return scope;
}

// ==========================================
// REPORT SERVICE HANDLERS
// ==========================================

async function getAssessmentsReportService(userId, role, filters) {
  const scope = await resolveScope(userId, role);

  const total = await db.countAssessmentsReport(filters, scope);
  const records = await db.getAssessmentsReport(filters, scope);

  const limit = Number(filters.limit || 10);
  const page = Number(filters.page || 1);
  const totalPages = Math.ceil(total / limit);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

async function getStaffPerformanceReportService(userId, role, filters) {
  const scope = await resolveScope(userId, role);

  const total = await db.countStaffPerformanceReport(filters, scope);
  const records = await db.getStaffPerformanceReport(filters, scope);

  const limit = Number(filters.limit || 10);
  const page = Number(filters.page || 1);
  const totalPages = Math.ceil(total / limit);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

async function getStationSummaryReportService(userId, role, filters) {
  const scope = await resolveScope(userId, role);

  const total = await db.countStationSummaryReport(filters, scope);
  const records = await db.getStationSummaryReport(filters, scope);

  const limit = Number(filters.limit || 10);
  const page = Number(filters.page || 1);
  const totalPages = Math.ceil(total / limit);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

async function getApprovalStatusReportService(userId, role, filters) {
  const scope = await resolveScope(userId, role);

  const total = await db.countApprovalStatusReport(filters, scope);
  const records = await db.getApprovalStatusReport(filters, scope);

  const limit = Number(filters.limit || 10);
  const page = Number(filters.page || 1);
  const totalPages = Math.ceil(total / limit);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

async function getReportsSummaryService(userId, role, filters) {
  const scope = await resolveScope(userId, role);
  return await db.getReportsSummaryDb(filters, scope);
}

async function getReportsPerformanceService(userId, role, filters) {
  const scope = await resolveScope(userId, role);
  return await db.getReportsPerformanceDb(filters, scope);
}

async function getReportsHighRiskService(userId, role, filters) {
  const scope = await resolveScope(userId, role);
  return await db.getReportsHighRiskDb(filters, scope);
}

async function getReportsStationsService(userId, role, filters) {
  const scope = await resolveScope(userId, role);
  return await db.getReportsStationsDb(filters, scope);
}

async function getReportsCyclesService(userId, role, filters) {
  const scope = await resolveScope(userId, role);
  return await db.getReportsCyclesDb(filters, scope);
}

async function getEmployeeReportService(userId, role, employeeId) {
  if (role === 'PM' || role === 'TM' || role === 'Shunting Master' || role === 'SHUNTING MASTER' || role === 'SHM') {
    if (userId !== employeeId) {
      throw new Error("Access denied: You can only view your own report");
    }
  } else {
    const scope = await resolveScope(userId, role);
    const targetReport = await db.getEmployeeReportDb(employeeId);
    if (!targetReport) throw new Error("Employee not found");
    
    const target = targetReport.summary;
    if (role === 'SM' || role === 'SS' || ['Cabin Master', 'CABIN MASTER'].includes(role)) {
      if (target.stationId !== scope.stationId || (target.role !== 'PM' && target.role !== 'Shunting Master')) {
        throw new Error("Access denied: Target employee is not at your station or role not allowed");
      }
    } else if (role === 'Station Master Supervisor') {
      if (target.stationId !== scope.stationId || !['PM', 'SM', 'TM', 'SS', 'Cabin Master', 'Shunting Master'].includes(target.role)) {
        throw new Error("Access denied: Target employee is not at your station or role not allowed");
      }
    } else if (role === 'TI') {
      if (!scope.stationIds.includes(target.stationId) || !['PM', 'SM', 'TM', 'Station Master Supervisor', 'Cabin Master', 'Shunting Master'].includes(target.role)) {
        throw new Error("Access denied: Target employee is outside your area");
      }
    } else if (role === 'AOM') {
      if (target.divisionId !== scope.divisionId || !['PM', 'SM', 'TM', 'SS', 'TI', 'Station Master Supervisor', 'Cabin Master', 'Shunting Master'].includes(target.role)) {
        throw new Error("Access denied: Target employee is in another division or role not allowed");
      }
    }
  }

  return await db.getEmployeeReportDb(employeeId);
}

module.exports = {
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
};
