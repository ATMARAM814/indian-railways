// StationCommandHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, User, Mail, Phone, Shield } from 'lucide-react';

export const StationCommandHeader = ({ summary, assignedTI }) => {
  const navigate = useNavigate();

  if (!summary) return null;

  return (
    <div className="command-header-card">
      {/* Left Block: Station Details */}
      <div className="command-station-block">
        <div className="command-station-circle">
          {summary.stationCode?.toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
            {summary.stationName}
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} style={{ color: '#94A3B8', marginTop: '-1px' }} />
            <span>
              {summary.divisionName?.endsWith('Division')
                ? summary.divisionName
                : `${summary.divisionName} Division`
              } ({summary.divisionCode})
            </span>
          </p>
        </div>
      </div>

      {/* Right Block: Assigned Traffic Inspector Contact Card */}
      {assignedTI ? (
        <div className="command-ti-profile">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Shield size={20} />
          </div>
          <div className="command-ti-info">
            <span className="command-ti-label">Assigned Traffic Inspector</span>
            <span className="command-ti-name">{assignedTI.fullName}</span>
            <div className="command-ti-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} style={{ color: '#94A3B8' }} /> {assignedTI.phone || '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} style={{ color: '#94A3B8' }} /> {assignedTI.email || '—'}
              </span>
              <span style={{ color: '#CBD5E1' }}>|</span>
              <button
                onClick={() => navigate(`/workforce/profile/${assignedTI.id}`)}
                className="view-profile-link"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#FFFBEB',
          border: '1px dashed #FCD34D',
          borderRadius: '12px',
          fontSize: '13px',
          color: '#B45309',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Shield size={16} />
          No Traffic Inspector Assigned
        </div>
      )}
    </div>
  );
};
export default StationCommandHeader;
