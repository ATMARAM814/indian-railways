import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Target, Monitor, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getAuditLogDetails } from '../../services/audit.service';
import AuditSeverityBadge from '../../components/audit/AuditSeverityBadge';
import AuditChangeViewer from '../../components/audit/AuditChangeViewer';

const AuditLogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAuditLogDetails(id);
        if (res.success) {
          setLog(res.data);
        } else {
          setError(res.message || 'Failed to fetch audit log details');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.message ||
          'An error occurred while loading details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTop: '3px solid #2B5CE6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Retrieving secure audit entry...</span>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '16px 24px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '12px', color: '#991B1B', fontSize: '14px', fontWeight: 500, maxWidth: '600px', width: '100%' }}>
          {error || 'Audit entry not found.'}
        </div>
        <button
          onClick={() => navigate('/audit-logs')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back to Audit Logs
        </button>
      </div>
    );
  }

  const isSystemPerformed = !log.performedBy;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Header Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/audit-logs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EFF6FF';
            e.currentTarget.style.borderColor = '#BFDBFE';
            e.currentTarget.style.color = '#2B5CE6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Audit Record Details
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0B2341', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
            <code>{log.actionType}</code>
          </h1>
        </div>
      </div>

      {/* Main Details Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Side: General Info & Performer details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* General Metadata Panel */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} />
              Metadata Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Audit Log ID</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{log.auditId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Module Category</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2B5CE6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{log.moduleName || 'System'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Severity Rating</span>
                <AuditSeverityBadge severity={log.severity} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Logged At</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{formatTimestamp(log.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actor Profile Panel */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} />
              Actor Profile (Performed By)
            </h3>
            {isSystemPerformed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <ShieldCheck size={20} style={{ color: '#0B2341' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0B2341' }}>SYSTEM ENGINE</span>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Automated Background Operation</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Name</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{log.performedByName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>HRMS ID</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{log.performedByHrmsId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Authorized Role</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{log.performedByRole}</span>
                </div>
                {log.performedByDesignation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Designation</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{log.performedByDesignation}</span>
                  </div>
                )}
                {log.performedByStation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Station Post</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{log.performedByStation}</span>
                  </div>
                )}
                {log.performedByDivision && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Division</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{log.performedByDivision}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Target details & Metadata Client stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Target / Entity Details Panel */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} />
              Target Entity Details
            </h3>
            {log.entityName || log.targetHrmsId || log.entityId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Entity Name / Name</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{log.entityName || '—'}</span>
                </div>
                {log.targetHrmsId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Target HRMS ID</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{log.targetHrmsId}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Entity Model Type</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{log.entityType || '—'}</span>
                </div>
                {log.entityId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Entity Database ID</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', fontFamily: 'monospace' }}>{log.entityId}</span>
                  </div>
                )}
                {log.targetRole && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Target Role</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{log.targetRole}</span>
                  </div>
                )}
                {log.targetStation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Target Station</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{log.targetStation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #E2E8F0', fontSize: '13px' }}>
                No target entity or HRMS mapping associated with this log.
              </div>
            )}
          </div>

          {/* Client Device Details Panel */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={16} />
              Client Network & Context
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>IP Address</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>User Agent String</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: '1.4' }}>
                  {log.userAgent || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Remarks Text Area */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          Operation Log Remarks
        </h3>
        <p style={{ fontSize: '14px', color: '#1E293B', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '16px 20px', lineHeight: '1.6', fontWeight: 500 }}>
          {log.remarks || 'No remarks recorded for this audit event.'}
        </p>
      </div>

      {/* State Changes Comparison Block */}
      <AuditChangeViewer oldData={log.oldData} newData={log.newData} />

      {/* Secure Cryptographic Footer Watermark */}
      <div style={{ borderTop: '1px dashed #CBD5E1', padding: '16px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}>
          INDIAN RAILWAYS AUDIT SYSTEM SECURE LOG ENTRY ENTRY_HASH: {log.auditId ? log.auditId.slice(0, 8).toUpperCase() : 'N/A'}
        </span>
      </div>
    </div>
  );
};

export default AuditLogDetailPage;
