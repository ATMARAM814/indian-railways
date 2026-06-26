-- SQL Migration: Create Audit Logs Table and Indexes

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

-- Performance Indexes for Quick Filtering and Scoped Joins
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by
ON audit_logs(performed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type
ON audit_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
ON audit_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at);
