// HighRiskWatchlist.jsx
import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

export const HighRiskWatchlist = ({ 
  list,
  category = 'D',
  title = "High Risk Watchlist & Safety Concerns",
  badgeText = "Requires Supervision",
  themeColor = "#991B1B",
  themeBg = "#FEE2E2",
  themeBorder = "#FCA5A5",
  themeLightBg = "#FFFDFD",
  themeTableRowBorder = "#FFF1F1",
  onViewMore
}) => {
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
    <div className="watchlist-card" style={{
      borderColor: themeBorder,
      backgroundColor: themeLightBg,
      boxShadow: `0 4px 12px ${category === 'D' ? 'rgba(239, 68, 68, 0.03)' : 'rgba(217, 119, 6, 0.03)'}`
    }}>
      <div className="watchlist-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderColor: themeBorder,
        borderBottom: `1px solid ${themeBorder}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {category === 'D' ? (
            <ShieldAlert size={20} style={{ color: themeColor }} />
          ) : (
            <AlertTriangle size={20} style={{ color: themeColor }} />
          )}
          <h3 className="watchlist-title" style={{ color: themeColor }}>{title}</h3>
          <span className="watchlist-badge-reason" style={{ backgroundColor: themeBg, color: themeColor }}>
            {badgeText}
          </span>
        </div>
        <button
          onClick={onViewMore}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: `1px solid ${themeColor}`,
            color: themeColor,
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          View More <ArrowRight size={13} />
        </button>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${themeBorder}`, backgroundColor: category === 'D' ? '#FFF5F5' : '#FFFDF5' }}>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Employee Name</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Latest Score</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Last Evaluated</th>
              <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Risk Reason</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.userId} style={{ borderBottom: `1px solid ${themeTableRowBorder}` }}>
                <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: 600, color: category === 'D' ? '#7F1D1D' : '#78350F' }}>
                  {row.fullName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 500, color: '#1B365D' }}>
                  {row.role}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: themeColor }}>
                  {row.latestScore !== null ? `${parseFloat(row.latestScore).toFixed(1)}%` : '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {renderCategoryBadge(row.category)}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>
                  {formatDate(row.lastAssessmentDate)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 600, color: themeColor }}>
                    <AlertTriangle size={13} /> {row.reason}
                  </span>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px', fontSize: '13px', fontWeight: 500 }}>
                  Excellent! Zero employees currently flagged on the watchlist.
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
