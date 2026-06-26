// WorkforceTable.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, History, User } from 'lucide-react';

export const WorkforceTable = ({ workforce }) => {
  const navigate = useNavigate();

  // Format Date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  // Render Category Badge
  const renderCategoryBadge = (cat) => {
    if (!cat || cat === '—' || cat === 'N/A' || cat === 'Unassigned') {
      return <span style={{ color: '#94A3B8', fontWeight: 600 }}>N/A</span>;
    }
    let styles = { padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700 };

    switch (cat.toUpperCase()) {
      case 'A':
        styles = { ...styles, backgroundColor: '#E0F2FE', color: '#0369A1' };
        break;
      case 'B':
        styles = { ...styles, backgroundColor: '#F3E8FF', color: '#6B21A8' };
        break;
      case 'C':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#B45309' };
        break;
      case 'D':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }
    return <span style={styles}>Cat {cat}</span>;
  };

  // Render Status Badge
  const renderStatus = (status, approvalStatus) => {
    if (!status) return <span style={{ color: '#94A3B8', fontWeight: 500 }}>Not Assessed</span>;

    if (status === 'cancelled') {
      return <span style={{ color: '#94A3B8', fontSize: '12.5px', fontWeight: 600 }}>Cancelled</span>;
    }
    if (approvalStatus === 'approved') {
      return <span style={{ color: '#16A34A', fontSize: '12.5px', fontWeight: 600 }}>Approved</span>;
    }
    if (approvalStatus === 'rejected') {
      return <span style={{ color: '#DC2626', fontSize: '12.5px', fontWeight: 600 }}>Rejected</span>;
    }
    if (approvalStatus === 'pending_approval') {
      return <span style={{ color: '#D97706', fontSize: '12.5px', fontWeight: 600 }}>Pending Approval</span>;
    }
    
    // In-progress status checks
    if (['created', 'scheduled', 'mcq_access_sent', 'mcq_pending'].includes(status)) {
      return <span style={{ color: '#2B5CE6', fontSize: '12.5px', fontWeight: 600 }}>MCQ Pending</span>;
    }
    if (status === 'mcq_submitted') {
      return <span style={{ color: '#8B5CF6', fontSize: '12.5px', fontWeight: 600 }}>Eval Pending</span>;
    }

    return <span style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 500 }}>{status}</span>;
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF2F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Unified Station Workforce</h3>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Records Count: {workforce.length}</span>
      </div>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="staff-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 20px' }}>Employee Name</th>
              <th style={{ padding: '14px 20px' }}>Role</th>
              <th style={{ padding: '14px 20px' }}>HRMS ID</th>
              <th style={{ padding: '14px 20px' }}>Category</th>
              <th style={{ padding: '14px 20px' }}>Latest Status</th>
              <th style={{ padding: '14px 20px' }}>Latest Score</th>
              <th style={{ padding: '14px 20px' }}>Last Assessment Date</th>
              <th style={{ padding: '14px 20px' }} className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workforce.map((row) => {
              const isApproved = row.latestApprovalStatus === 'approved';
              return (
                <tr key={row.userId} className="hover-row">
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="staff-initials-avatar">
                        {row.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500, color: '#1B365D' }}>
                    {row.role}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'monospace', color: '#475569' }}>
                    {row.hrmsId}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {renderCategoryBadge(row.category)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {renderStatus(row.latestStatus, row.latestApprovalStatus)}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700 }}>
                    {isApproved && row.latestScore !== null ? (
                      <span style={{ color: row.latestScore >= 80 ? '#16A34A' : row.latestScore >= 50 ? '#D97706' : '#DC2626' }}>
                        {parseFloat(row.latestScore).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#64748B' }}>
                    {formatDate(row.lastAssessmentDate)}
                  </td>
                  <td style={{ padding: '14px 20px' }} className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/workforce/profile/${row.userId}`)}
                      className="back-btn"
                      style={{ height: '32px', padding: '0 10px', gap: '4px' }}
                      title="View Profile"
                    >
                      <User size={14} /> Profile
                    </button>
                  </td>
                </tr>
              );
            })}
            {workforce.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '36px', fontSize: '13.5px', fontWeight: 500 }}>
                  No workforce members match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default WorkforceTable;
