// HighRiskWatchlist.jsx
import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const HighRiskWatchlist = ({ list }) => {
  // Format Date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const renderCategoryBadge = (cat) => {
    if (!cat || cat === 'Unassigned') return <span style={{ color: '#94A3B8' }}>N/A</span>;
    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: cat === 'D' ? '#FEE2E2' : '#FEF3C7',
        color: cat === 'D' ? '#B91C1C' : '#D97706'
      }}>
        Cat {cat}
      </span>
    );
  };

  return (
    <div className="watchlist-card">
      <div className="watchlist-header">
        <ShieldAlert size={20} style={{ color: '#991B1B' }} />
        <h3 className="watchlist-title">High Risk Watchlist & Safety Concerns</h3>
        <span className="watchlist-badge-reason">Requires Supervision</span>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #FEE2E2', backgroundColor: '#FFF5F5' }}>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Employee Name</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Latest Score</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Last Evaluated</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Risk Reason</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.userId} style={{ borderBottom: '1px solid #FFF1F1' }}>
                <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: 600, color: '#7F1D1D' }}>
                  {row.fullName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 500, color: '#1B365D' }}>
                  {row.role}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>
                  {row.latestScore !== null ? `${parseFloat(row.latestScore).toFixed(1)}%` : '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {renderCategoryBadge(row.category)}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>
                  {formatDate(row.lastAssessmentDate)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 600, color: '#B91C1C' }}>
                    <AlertTriangle size={13} /> {row.reason}
                  </span>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px', fontSize: '13px', fontWeight: 500 }}>
                  Excellent! Zero employees currently flagged on the station watchlist.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default HighRiskWatchlist;
