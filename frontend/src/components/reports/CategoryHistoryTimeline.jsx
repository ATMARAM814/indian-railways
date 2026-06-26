import React from 'react';
import { TrendingUp, Calendar, User } from 'lucide-react';

const CategoryHistoryTimeline = ({ categoryHistory }) => {
  const hasHistory = Array.isArray(categoryHistory) && categoryHistory.length > 0;

  const renderCategoryBadge = (cat) => {
    if (!cat) return <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: '12px' }}>N/A</span>;
    let styles = { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 };

    switch (cat.toUpperCase()) {
      case 'A':
        return <span style={{ ...styles, backgroundColor: '#DCFCE7', color: '#15803D' }}>Cat A</span>;
      case 'B':
        return <span style={{ ...styles, backgroundColor: '#E0F2FE', color: '#0369A1' }}>Cat B</span>;
      case 'C':
        return <span style={{ ...styles, backgroundColor: '#FEF3C7', color: '#B45309' }}>Cat C</span>;
      case 'D':
        return <span style={{ ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' }}>Cat D</span>;
      default:
        return <span style={{ ...styles, backgroundColor: '#F1F5F9', color: '#475569' }}>Cat {cat}</span>;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'A': return '#16A34A';
      case 'B': return '#2563EB';
      case 'C': return '#D97706';
      case 'D': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getCategoryLightBg = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'A': return '#F0FDF4';
      case 'B': return '#EFF6FF';
      case 'C': return '#FFFBEB';
      case 'D': return '#FEF2F2';
      default: return '#F8FAFC';
    }
  };

  const getCategoryDarkText = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'A': return '#15803D';
      case 'B': return '#1D4ED8';
      case 'C': return '#B45309';
      case 'D': return '#B91C1C';
      default: return '#475569';
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={18} style={{ color: '#2B5CE6' }} />
        Category Movement History
      </h3>

      <div>
        {!hasHistory ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            No category modifications recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', marginTop: '8px' }}>
            {categoryHistory.map((hist, idx) => {
              const isLast = idx === categoryHistory.length - 1;
              const catColor = getCategoryColor(hist.category);
              const lightBg = getCategoryLightBg(hist.category);
              const darkText = getCategoryDarkText(hist.category);

              return (
                <div key={idx} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                  {/* Timeline indicator col */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                    {/* Glowing outer point ring */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: `2px solid ${catColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      boxShadow: '0 2px 4px rgba(11, 35, 65, 0.08)'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: catColor
                      }} />
                    </div>
                    
                    {/* Connecting Line to next item */}
                    {!isLast && (
                      <div style={{
                        flex: 1,
                        width: '2px',
                        backgroundColor: '#E2E8F0',
                        marginTop: '4px',
                        marginBottom: '4px'
                      }} />
                    )}
                  </div>

                  {/* Content details col */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: isLast ? 0 : '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                          Category Modification
                        </span>
                        {renderCategoryBadge(hist.category)}
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} style={{ color: '#94A3B8' }} />
                        {hist.date ? new Date(hist.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                      <User size={13} style={{ color: '#94A3B8' }} />
                      <span>Assigned by: <strong style={{ color: '#1B365D', fontWeight: 650 }}>{hist.assignedBy || 'System'}</strong></span>
                    </div>

                    {hist.remarks && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '12.5px',
                        lineHeight: '1.5',
                        color: '#334155',
                        backgroundColor: lightBg,
                        borderLeft: `4px solid ${catColor}`,
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <strong style={{ color: darkText, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                          Remarks / Notes
                        </strong>
                        {hist.remarks}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryHistoryTimeline;
