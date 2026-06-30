import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import AuditSeverityBadge from './AuditSeverityBadge';

const AuditLogTable = ({ records = [], loading = false }) => {
  const navigate = useNavigate();

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

  const getModuleBadgeColor = (moduleName) => {
    switch (moduleName) {
      case 'Auth': return { bg: '#F3E8FF', color: '#6B21A8' }; // Purple
      case 'Users': return { bg: '#E0F2FE', color: '#0369A1' }; // Blue
      case 'Workforce': return { bg: '#EFF6FF', color: '#1E40AF' }; // Indigo
      case 'Assessment': return { bg: '#FEF3C7', color: '#B45309' }; // Amber
      case 'Approval': return { bg: '#DCFCE7', color: '#15803D' }; // Green
      case 'Question Bank': return { bg: '#FCE7F3', color: '#9D174D' }; // Pink
      case 'Reports': return { bg: '#E2E8F0', color: '#334155' }; // Slate
      default: return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div className="staff-table-card" style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
      <div className="staff-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
        <table className="staff-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Timestamp</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Severity</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Module</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Action</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Performed By</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Target / Entity</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'left', fontWeight: 700 }}>Remarks</th>
              <th style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', textAlign: 'center', fontWeight: 700 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '14px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '120px' }}></div></td>
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '20px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '60px' }}></div></td>
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '20px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '80px' }}></div></td>
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '14px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '100px' }}></div></td>
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '14px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '100px' }}></div></td>
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '14px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '90px' }}></div></td>
                  <td style={{ padding: '16px 24px' }}><div style={{ height: '14px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '150px' }}></div></td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}><div style={{ height: '24px', backgroundColor: '#CBD5E1', borderRadius: '4px', width: '40px', margin: '0 auto' }}></div></td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#64748B', padding: '48px', fontSize: '14px' }}>
                  No audit logs found matching the selected filters.
                </td>
              </tr>
            ) : (
              records.map((record, index) => {
                const badgeColor = getModuleBadgeColor(record.moduleName);
                return (
                  <tr
                    key={record.auditId || index}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#334155' }}>
                      {formatTimestamp(record.createdAt)}
                    </td>

                    {/* Severity */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle' }}>
                      <AuditSeverityBadge severity={record.severity} />
                    </td>

                    {/* Module */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          backgroundColor: badgeColor.bg,
                          color: badgeColor.color,
                        }}
                      >
                        {record.moduleName || 'System'}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <code style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#F1F5F9', color: '#0B2341', padding: '3px 6px', borderRadius: '4px' }}>
                        {record.actionType}
                      </code>
                    </td>

                    {/* Performed By */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>
                        {record.performedByName}
                      </span>
                      {record.performedByRole && (
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {record.performedByRole} {record.performedByHrmsId ? `(${record.performedByHrmsId})` : ''}
                        </div>
                      )}
                    </td>

                    {/* Target / Entity */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {record.entityName || record.targetHrmsId ? (
                        <>
                          <span style={{ fontWeight: 500, color: '#334155' }}>
                            {record.entityName || '—'}
                          </span>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            {record.entityType} {record.targetHrmsId ? `(${record.targetHrmsId})` : ''}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>—</span>
                      )}
                    </td>

                    {/* Remarks */}
                    <td
                      style={{
                        padding: '16px 24px',
                        fontSize: '13px',
                        verticalAlign: 'middle',
                        color: '#475569',
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={record.remarks}
                    >
                      {record.remarks || '—'}
                    </td>

                    {/* Details Button */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/audit-logs/${record.auditId}`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#0B2341',
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
                          e.currentTarget.style.color = '#0B2341';
                        }}
                        title="View Full Audit Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;
