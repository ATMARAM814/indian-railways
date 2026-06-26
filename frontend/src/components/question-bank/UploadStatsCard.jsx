import React from 'react';
import { History, Calendar, CheckSquare } from 'lucide-react';

const UploadStatsCard = ({ stats = [], history = [], totalLogs = 0 }) => {
  const totalEvents = totalLogs;

  const latestDate = history.length > 0 ? new Date(history[0].uploadedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : 'N/A';

  const activeRolesCount = stats.filter(s => s.totalQuestions > 0).length;

  return (
    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', flex: 1 }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <History size={22} style={{ color: '#2563EB' }} />
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Upload Events</p>
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 0 0' }}>{totalEvents}</h3>
        </div>
      </div>

      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', flex: 1 }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Calendar size={22} style={{ color: '#059669' }} />
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latest Upload Date</p>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '4px 0 0 0' }}>{latestDate}</h3>
        </div>
      </div>

      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', flex: 1 }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckSquare size={22} style={{ color: '#D97706' }} />
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Roles</p>
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 0 0' }}>{activeRolesCount} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Configured</span></h3>
        </div>
      </div>
    </div>
  );
};

export default UploadStatsCard;
