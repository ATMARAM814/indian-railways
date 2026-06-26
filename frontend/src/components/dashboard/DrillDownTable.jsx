// DrillDownTable.jsx
import React from 'react';

const DrillDownTable = ({ data = [], graphType }) => {
  
  // Render badge helper for Category
  const renderCategoryBadge = (cat) => {
    if (!cat || cat === '—') return <span style={{ color: '#94A3B8' }}>—</span>;
    
    let styles = {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600
    };

    switch (cat.toUpperCase()) {
      case 'A':
        styles = { ...styles, backgroundColor: '#E0F2FE', color: '#0369A1' }; // Light blue
        break;
      case 'B':
        styles = { ...styles, backgroundColor: '#F3E8FF', color: '#6B21A8' }; // Light purple
        break;
      case 'C':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#B45309' }; // Light amber
        break;
      case 'D':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' }; // Light red
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }

    return <span style={styles}>Cat {cat}</span>;
  };

  // Render badge helper for Risk Level
  const renderRiskBadge = (risk) => {
    if (!risk) return <span style={{ color: '#94A3B8' }}>—</span>;
    
    let styles = {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (risk.toUpperCase()) {
      case 'LOW':
        styles = { ...styles, backgroundColor: '#DCFCE7', color: '#15803D' };
        break;
      case 'MEDIUM':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#D97706' };
        break;
      case 'HIGH':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }

    return <span style={styles}>{risk}</span>;
  };

  const getHeadersAndRows = () => {
    if (graphType === 'stationEvaluationProgress') {
      const headers = ['Station Name', 'Code', 'Completed', 'Pending', 'Avg. Score', 'Category', 'Risk Level', 'Last Updated'];
      const rows = data.map((r) => [
        <strong style={{ color: '#0F172A' }}>{r.stationName}</strong>,
        r.stationCode,
        <span style={{ fontWeight: 600, color: '#1B365D' }}>{r.completed}</span>,
        <span style={{ fontWeight: 600, color: '#D69E2E' }}>{r.pending}</span>,
        <span style={{ fontWeight: 600, color: r.averageScore >= 80 ? '#16A34A' : r.averageScore >= 50 ? '#D97706' : '#DC2626' }}>
          {r.averageScore !== null ? `${r.averageScore}/100` : '—'}
        </span>,
        renderCategoryBadge(r.dominantCategory),
        renderRiskBadge(r.riskLevel),
        <span style={{ color: '#64748B' }}>{r.lastUpdated}</span>
      ]);
      return { headers, rows };
    }

    if (graphType === 'stationAverageScore') {
      const headers = ['Station Name', 'Code', 'Avg. Score', 'Completed', 'Pending', 'Category', 'Risk Level', 'Last Updated'];
      const rows = data.map((r) => [
        <strong style={{ color: '#0F172A' }}>{r.stationName}</strong>,
        r.stationCode,
        <span style={{ fontWeight: 600, color: r.averageScore >= 80 ? '#16A34A' : r.averageScore >= 50 ? '#D97706' : '#DC2626' }}>
          {r.averageScore !== null ? `${r.averageScore}/100` : '—'}
        </span>,
        r.completed,
        r.pending,
        renderCategoryBadge(r.dominantCategory),
        renderRiskBadge(r.riskLevel),
        <span style={{ color: '#64748B' }}>{r.lastUpdated}</span>
      ]);
      return { headers, rows };
    }

    if (graphType === 'categoryDistribution') {
      const headers = ['Station Name', 'Code', 'Category A', 'Category B', 'Category C', 'Category D', 'Dominant Category', 'Risk Level', 'Last Updated'];
      const rows = data.map((r) => [
        <strong style={{ color: '#0F172A' }}>{r.stationName}</strong>,
        r.stationCode,
        r.categoryA,
        r.categoryB,
        r.categoryC,
        r.categoryD,
        renderCategoryBadge(r.dominantCategory),
        renderRiskBadge(r.riskLevel),
        <span style={{ color: '#64748B' }}>{r.lastUpdated}</span>
      ]);
      return { headers, rows };
    }

    if (graphType === 'workforceActivity') {
      const headers = ['Date', 'Employee Name', 'HRMS ID', 'Role', 'Action Type', 'From Station', 'To Station', 'Performed By'];
      const rows = data.map((r) => {
        let formattedDate = r.date;
        if (r.date) {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
          }
        }
        return [
          formattedDate || '—',
          <strong style={{ color: '#0F172A' }}>{r.employeeName}</strong>,
          r.hrmsId || '—',
          r.role || '—',
          <span style={{ 
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor: r.actionType === 'Created' ? '#E0F2FE' : r.actionType === 'Transferred' ? '#FEF3C7' : r.actionType === 'Deactivated' ? '#FEE2E2' : '#DCFCE7',
            color: r.actionType === 'Created' ? '#0369A1' : r.actionType === 'Transferred' ? '#B45309' : r.actionType === 'Deactivated' ? '#B91C1C' : '#15803D'
          }}>{r.actionType}</span>,
          r.fromStation || '—',
          r.toStation || '—',
          r.performedBy || '—'
        ];
      });
      return { headers, rows };
    }

    if (graphType === 'highRiskStaff') {
      const headers = [
        'Employee Name',
        'HRMS ID',
        'Role',
        'Station Name',
        'Station Code',
        'Assigned SM',
        'Assigned TI',
        'Assigned AOM',
        'Latest Score',
        'Last Assessment Date'
      ];
      const rows = data.map((r) => [
        <strong style={{ color: '#0F172A' }}>{r.employeeName || '--'}</strong>,
        r.hrmsId || '--',
        r.role || '--',
        r.stationName || '--',
        r.stationCode || '--',
        r.assignedSm || '--',
        r.assignedTi || '--',
        r.assignedAom || '--',
        r.latestScore || '--',
        r.lastAssessmentDate || '--'
      ]);
      return { headers, rows };
    }

    return { headers: [], rows: [] };
  };

  const { headers, rows } = getHeadersAndRows();

  return (
    <div className="staff-table-card" style={{ marginTop: '16px', width: '100%' }}>
      <div className="staff-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
        <table className="staff-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '14px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: '16px 24px', fontSize: '13.5px', verticalAlign: 'middle' }}>{cell}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length || 1} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                  No stations found for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DrillDownTable;
