const db = require("./audit.repository");

// ==========================================
// SEVERITY AND MODULE RESOLUTIONS
// ==========================================

function getSeverityForAction(actionType) {
  if (!actionType) return 'LOW';
  const act = actionType.toUpperCase();
  
  // CRITICAL
  if (
    act.includes('UNAUTHORIZED_ACCESS') || 
    act.includes('BULK_IMPORT') || 
    act.includes('LOCKED') || 
    act === 'LOGIN_FAILED'
  ) {
    return 'CRITICAL';
  }
  
  // HIGH
  if (
    act.includes('DEACTIVATED') || 
    act.includes('ACTIVATED') || 
    act.includes('TRANSFER') || 
    act.includes('APPROVED') || 
    act.includes('REJECTED') || 
    act.includes('RESET') || 
    act.includes('PASSWORD_CHANGED') ||
    act.includes('FINAL_EVALUATION') ||
    act.includes('SCORE_MODIFIED')
  ) {
    return 'HIGH';
  }
  
  // MEDIUM
  if (
    act.includes('CREATED') || 
    act.includes('UPDATED') || 
    act.includes('SUBMITTED') || 
    act.includes('SAVED') ||
    act.includes('OTP')
  ) {
    return 'MEDIUM';
  }
  
  // LOW (Default)
  return 'LOW';
}

function getModuleNameForAction(actionType) {
  if (!actionType) return 'System';
  const act = actionType.toUpperCase();
  if (
    act.includes('LOGIN') || 
    act.includes('LOGOUT') || 
    act.includes('PASSWORD') || 
    act.includes('OTP') || 
    act.includes('UNAUTHORIZED')
  ) {
    return 'Auth';
  }
  if (
    act.includes('USER_') || 
    act.includes('ROLE_') || 
    act.includes('TRANSFER') || 
    act.includes('EMPLOYEE_')
  ) {
    return 'Workforce';
  }
  if (
    act.includes('ASSESSMENT_CREATED') || 
    act.includes('MCQ_') || 
    act.includes('EVALUATION_DRAFT') || 
    act.includes('FINAL_EVALUATION') ||
    act.includes('ASSESSMENT_COMPLETED') ||
    act.includes('ASSESSMENT_VIEWED')
  ) {
    return 'Assessment';
  }
  if (
    act.includes('APPROVED') || 
    act.includes('REJECTED') || 
    act.includes('SCORE_MODIFIED') || 
    act.includes('REMARK')
  ) {
    return 'Approval';
  }
  if (act.includes('QUESTION') || act.includes('QUESTIONS_')) {
    return 'Question Bank';
  }
  if (act.includes('REPORT_')) {
    return 'Reports';
  }
  if (act.includes('DASHBOARD_') || act.includes('HIGH_RISK_') || act.includes('DRILLDOWN_')) {
    return 'Dashboard';
  }
  return 'System';
}

// ==========================================
// SERVICE OPERATIONS
// ==========================================

async function logAction(
  arg1,
  actionType,
  entityType,
  entityId,
  oldData,
  newData,
  remarks
) {
  try {
    let params = {};
    if (typeof arg1 === "object" && arg1 !== null && !Array.isArray(arg1) && !actionType) {
      // New object form: logAction({ performedBy, actionType, ... })
      params = { ...arg1 };
    } else {
      // Legacy positional form
      params = {
        performedBy: arg1,
        actionType,
        entityType,
        entityId,
        oldData,
        newData,
        remarks,
      };
    }

    if (!params.actionType) {
      console.warn("[Audit Log Warning] Action type is missing. Skipping audit log.");
      return null;
    }

    // Resolve severity and module if missing
    if (!params.severity) {
      params.severity = getSeverityForAction(params.actionType);
    }
    if (!params.moduleName) {
      params.moduleName = getModuleNameForAction(params.actionType);
    }

    return await db.createAuditLog(params);
  } catch (err) {
    console.error("[Audit Log Error] Failed to write audit log:", err);
    // Do not throw to keep original business flow uninterrupted
    return null;
  }
}

async function getAuditLogsService(userId, role, filters) {
  if (role !== "SUPER_ADMIN") {
    throw new Error("Access denied. Only SUPER_ADMIN users are allowed to view audit logs.");
  }

  const total = await db.countAuditLogs(filters);
  const records = await db.getAuditLogs(filters);

  const limit = Math.min(Number(filters.limit || 10), 100);
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

async function getAuditLogByIdService(id, userId, role) {
  if (role !== "SUPER_ADMIN") {
    throw new Error("Access denied. Only SUPER_ADMIN users are allowed to view audit logs.");
  }

  const log = await db.getAuditLogById(id);
  if (!log) {
    throw new Error("Audit log not found or access denied.");
  }

  return log;
}

async function getAuditSummaryService(userId, role) {
  if (role !== "SUPER_ADMIN") {
    throw new Error("Access denied. Only SUPER_ADMIN users are allowed to view audit logs.");
  }

  return await db.getAuditSummaryStatistics();
}

module.exports = {
  logAction,
  getAuditLogsService,
  getAuditLogByIdService,
  getAuditSummaryService,
};
