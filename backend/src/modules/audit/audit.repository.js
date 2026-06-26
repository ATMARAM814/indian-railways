const pool = require("../../config/database");

// ==========================================
// AUTO-MIGRATION RUNNER
// ==========================================
async function runAutoMigration() {
  const checkTableQuery = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      performed_by UUID REFERENCES profiles(id),
      action_type VARCHAR(100) NOT NULL,
      module_name VARCHAR(100),
      entity_type VARCHAR(100) NOT NULL,
      entity_id UUID,
      entity_name VARCHAR(255),
      target_hrms_id VARCHAR(50),
      severity VARCHAR(20) DEFAULT 'LOW',
      old_data JSONB,
      new_data JSONB,
      metadata JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  const addColumnsQuery = `
    ALTER TABLE audit_logs ALTER COLUMN performed_by DROP NOT NULL;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS module_name VARCHAR(100);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_hrms_id VARCHAR(50);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'LOW';
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    UPDATE audit_logs SET module_name = 'Workforce' WHERE module_name = 'Users';
  `;

  try {
    await pool.query(checkTableQuery);
    await pool.query(addColumnsQuery);
    console.log("[Audit Logs] Database auto-migration completed successfully.");
  } catch (err) {
    console.error("[Audit Logs] Database auto-migration error:", err);
  }
}

// Run migration check upon module loading
runAutoMigration();

// ==========================================
// REPOSITORY OPERATIONS
// ==========================================

async function createAuditLog({
  performedBy,
  actionType,
  moduleName,
  entityType,
  entityId,
  entityName,
  targetHrmsId,
  severity = 'LOW',
  oldData,
  newData,
  metadata,
  ipAddress,
  userAgent,
  remarks,
}) {
  const query = `
    INSERT INTO audit_logs (
      performed_by,
      action_type,
      module_name,
      entity_type,
      entity_id,
      entity_name,
      target_hrms_id,
      severity,
      old_data,
      new_data,
      metadata,
      ip_address,
      user_agent,
      remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    performedBy || null,
    actionType,
    moduleName || null,
    entityType,
    entityId || null,
    entityName || null,
    targetHrmsId || null,
    severity,
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    metadata ? JSON.stringify(metadata) : null,
    ipAddress || null,
    userAgent || null,
    remarks || null,
  ]);

  return result.rows[0];
}

function buildAuditWhere(filters, values) {
  const conditions = [];

  if (filters.actionType) {
    values.push(filters.actionType);
    conditions.push(`a.action_type = $${values.length}`);
  }
  if (filters.moduleName) {
    values.push(filters.moduleName);
    conditions.push(`a.module_name = $${values.length}`);
  }
  if (filters.entityType) {
    values.push(filters.entityType);
    conditions.push(`a.entity_type = $${values.length}`);
  }
  if (filters.performedBy) {
    values.push(filters.performedBy);
    conditions.push(`a.performed_by = $${values.length}`);
  }
  if (filters.targetHrmsId) {
    values.push(filters.targetHrmsId);
    conditions.push(`a.target_hrms_id = $${values.length}`);
  }
  if (filters.performedByRole) {
    values.push(filters.performedByRole);
    conditions.push(`r.name = $${values.length}`);
  }
  if (filters.severity) {
    if (filters.severity === 'HIGH_CRITICAL') {
      conditions.push(`a.severity IN ('HIGH', 'CRITICAL')`);
    } else {
      values.push(filters.severity);
      conditions.push(`a.severity = $${values.length}`);
    }
  }
  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`a.created_at >= $${values.length}::timestamp`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`a.created_at <= $${values.length}::timestamp`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`
      (COALESCE(p.full_name, 'System') ILIKE $${values.length} 
       OR p.hrms_id ILIKE $${values.length}
       OR a.action_type ILIKE $${values.length} 
       OR a.entity_name ILIKE $${values.length}
       OR a.target_hrms_id ILIKE $${values.length}
       OR a.remarks ILIKE $${values.length})
    `);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

async function getAuditLogs(filters) {
  const values = [];
  const whereClause = buildAuditWhere(filters, values);

  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 10), 100);
  const offset = (page - 1) * limit;

  const query = `
    SELECT
      a.id as "auditId",
      a.performed_by as "performedBy",
      COALESCE(p.full_name, 'System') as "performedByName",
      p.hrms_id as "performedByHrmsId",
      r.name as "performedByRole",
      a.action_type as "actionType",
      a.module_name as "moduleName",
      a.entity_type as "entityType",
      a.entity_id as "entityId",
      a.entity_name as "entityName",
      a.target_hrms_id as "targetHrmsId",
      a.severity as "severity",
      a.remarks as "remarks",
      a.ip_address as "ipAddress",
      a.user_agent as "userAgent",
      a.created_at as "createdAt"
    FROM audit_logs a
    LEFT JOIN profiles p ON p.id = a.performed_by
    LEFT JOIN roles r ON r.id = p.role_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);
  return result.rows;
}

async function countAuditLogs(filters) {
  const values = [];
  const whereClause = buildAuditWhere(filters, values);

  const query = `
    SELECT COUNT(DISTINCT a.id)::int as total
    FROM audit_logs a
    LEFT JOIN profiles p ON p.id = a.performed_by
    LEFT JOIN roles r ON r.id = p.role_id
    ${whereClause};
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

async function getAuditLogById(id) {
  const query = `
    SELECT
      a.id as "auditId",
      a.performed_by as "performedBy",
      COALESCE(p.full_name, 'System') as "performedByName",
      p.hrms_id as "performedByHrmsId",
      r.name as "performedByRole",
      p.designation as "performedByDesignation",
      div.name as "performedByDivision",
      st.station_name as "performedByStation",
      a.action_type as "actionType",
      a.module_name as "moduleName",
      a.entity_type as "entityType",
      a.entity_id as "entityId",
      a.entity_name as "entityName",
      a.target_hrms_id as "targetHrmsId",
      target_p.full_name as "targetName",
      target_r.name as "targetRole",
      target_st.station_name as "targetStation",
      a.severity as "severity",
      a.old_data as "oldData",
      a.new_data as "newData",
      a.metadata as "metadata",
      a.ip_address as "ipAddress",
      a.user_agent as "userAgent",
      a.remarks as "remarks",
      a.created_at as "createdAt"
    FROM audit_logs a
    LEFT JOIN profiles p ON p.id = a.performed_by
    LEFT JOIN roles r ON r.id = p.role_id
    LEFT JOIN division_assignments da ON da.profile_id = p.id AND da.is_current = true
    LEFT JOIN divisions div ON div.id = da.division_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
    LEFT JOIN stations st ON st.id = ssp.station_id
    
    -- Target Details resolution (if target is a User profile)
    LEFT JOIN profiles target_p ON target_p.hrms_id = a.target_hrms_id
    LEFT JOIN roles target_r ON target_r.id = target_p.role_id
    LEFT JOIN staff_station_postings target_ssp ON target_ssp.profile_id = target_p.id AND target_ssp.is_current = true
    LEFT JOIN stations target_st ON target_st.id = target_ssp.station_id
    WHERE a.id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function getAuditSummaryStatistics() {
  const query = `
    SELECT
      COUNT(*)::int as "totalLogs",
      COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END)::int as "criticalLogs",
      COUNT(CASE WHEN severity = 'HIGH' THEN 1 END)::int as "highSeverityLogs",
      COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int as "todayLogs",
      COUNT(CASE WHEN action_type = 'LOGIN_FAILED' THEN 1 END)::int as "failedLoginAttempts",
      COUNT(CASE WHEN module_name = 'Workforce' OR module_name = 'Users' OR action_type LIKE 'USER_%' OR action_type LIKE 'EMPLOYEE_%' THEN 1 END)::int as "userChanges",
      COUNT(CASE WHEN module_name = 'Assessment' OR action_type LIKE 'ASSESSMENT_%' OR action_type LIKE 'MCQ_%' OR action_type LIKE 'EVALUATION_%' THEN 1 END)::int as "assessmentActions",
      COUNT(CASE WHEN module_name = 'Approval' OR action_type LIKE 'ASSESSMENT_APPROVED' OR action_type LIKE 'ASSESSMENT_REJECTED' OR action_type LIKE 'ASSESSMENT_SCORE_MODIFIED' THEN 1 END)::int as "approvalActions"
    FROM audit_logs;
  `;

  const result = await pool.query(query);
  return result.rows[0];
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  countAuditLogs,
  getAuditLogById,
  getAuditSummaryStatistics,
};
