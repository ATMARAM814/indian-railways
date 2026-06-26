// RecentActivityFeed.jsx
import React from 'react';
import { Calendar, User, FileText, Settings, ArrowLeftRight } from 'lucide-react';

export const RecentActivityFeed = ({ activities }) => {
  // Format DateTime helper (e.g. 15-Jun-2026 06:12 PM)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;
  };

  // Resolve Icon / class type based on action type
  const getActivityMeta = (action) => {
    const act = action.toUpperCase();
    if (act.includes('COMPLETED') || act.includes('SUBMITTED') || act.includes('APPROVED')) {
      return { class: 'completed', icon: <FileText size={12} style={{ color: '#FFFFFF' }} /> };
    }
    if (act.includes('CREATED') || act.includes('SCHEDULED')) {
      return { class: 'created', icon: <Calendar size={12} style={{ color: '#FFFFFF' }} /> };
    }
    if (act.includes('TRANSFERRED') || act.includes('TRANSFER')) {
      return { class: 'transferred', icon: <ArrowLeftRight size={12} style={{ color: '#FFFFFF' }} /> };
    }
    if (act.includes('CANCELLED') || act.includes('DEACTIVATED') || act.includes('REJECTED')) {
      return { class: 'cancelled', icon: <Settings size={12} style={{ color: '#FFFFFF' }} /> };
    }
    return { class: 'changed', icon: <Settings size={12} style={{ color: '#FFFFFF' }} /> };
  };

  return (
    <div className="activity-feed-card">
      <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>
        Recent Station Activity & Audit Logs
      </h3>

      <div className="activity-timeline">
        {activities.map((act) => {
          const meta = getActivityMeta(act.action);
          return (
            <div key={act.id} className="activity-item">
              <div className={`activity-dot ${meta.class}`}>
                {meta.icon}
              </div>
              <div className="activity-content">
                <div className="activity-text-row">
                  <span className="activity-title">{act.action.replace(/_/g, ' ')}</span>
                  <span className="activity-time">{formatDateTime(act.timestamp)}</span>
                </div>
                <p className="activity-desc">{act.details || 'No remarks recorded.'}</p>
                <div className="activity-users">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <User size={12} style={{ color: '#94A3B8' }} /> By: {act.performedBy || 'System'}
                  </span>
                  {act.targetEmployee && (
                    <>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <span>Target: {act.targetEmployee}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px', fontWeight: 500 }}>
            No recent activities recorded for this station.
          </div>
        )}
      </div>
    </div>
  );
};
export default RecentActivityFeed;
