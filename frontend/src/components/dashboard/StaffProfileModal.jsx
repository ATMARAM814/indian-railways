// StaffProfileModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { cleanDesignationText } from '../../utils/dashboardMappers';

const StaffProfileModal = ({ isOpen, onClose, staff }) => {
  if (!isOpen || !staff) return null;

  const displayVal = (val) => (val !== null && val !== undefined && val !== '' ? val : '--');

  const formatEvalDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate());
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const isActive = (staff.status || 'Active').toLowerCase() === 'active';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="staff-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-header">
          <h3 className="staff-modal-title">Detailed Staff Card</h3>
          <button className="staff-modal-close-icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="staff-modal-body">
          {/* Navy Hero Banner Header Block */}
          <div className="staff-modal-hero">
            <span className="staff-modal-hero-subtitle">Staff Profile</span>
            <h2 className="staff-modal-hero-name">{displayVal(staff.fullName)}</h2>
            <p className="staff-modal-hero-details">
              {displayVal(cleanDesignationText(staff.designation))} • {displayVal(staff.hrmsId)}
            </p>
          </div>

          {/* Details Grid */}
          <div className="staff-modal-grid">
            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">EMPLOYEE ID / HRMS ID</span>
              <span className="staff-modal-value">{displayVal(staff.employeeId || staff.hrmsId)}</span>
            </div>
            
            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">DESIGNATION</span>
              <span className="staff-modal-value">{displayVal(cleanDesignationText(staff.designation))}</span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">CURRENT STATUS</span>
              <span className="staff-modal-value">
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2',
                  color: isActive ? '#047857' : '#B91C1C',
                  border: `1px solid ${isActive ? '#A7F3D0' : '#FECACA'}`
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#10B981' : '#EF4444'
                  }}></span>
                  {staff.status || 'Active'}
                </span>
              </span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">ASSIGNED CATEGORY</span>
              <span className="staff-modal-value">
                {staff.category ? (
                  <span className={`category-tag cat-${String(staff.category).toLowerCase()}`} style={{ fontWeight: 700, fontSize: '12px' }}>
                    Category {String(staff.category).toUpperCase()}
                  </span>
                ) : (
                  <span className="category-tag cat-none" style={{ fontWeight: 600, fontSize: '12px' }}>
                    Uncategorized / Pending
                  </span>
                )}
              </span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">LATEST ASSESSMENT SCORE</span>
              <span className="staff-modal-value">
                {staff.latestScore !== null && staff.latestScore !== undefined ? (
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                    {staff.latestScore}% {staff.totalScore !== null && staff.totalScore !== undefined ? `(${staff.totalScore} Marks)` : ''}
                  </span>
                ) : (
                  <span style={{ color: '#64748B' }}>Not Assessed</span>
                )}
              </span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">ASSESSMENT APPROVAL STATUS</span>
              <span className="staff-modal-value">
                {staff.approvalStatus ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    backgroundColor: staff.approvalStatus === 'approved' ? '#EFF6FF' : '#FEF3C7',
                    color: staff.approvalStatus === 'approved' ? '#1D4ED8' : '#D97706',
                    border: `1px solid ${staff.approvalStatus === 'approved' ? '#BFDBFE' : '#FDE68A'}`
                  }}>
                    {String(staff.approvalStatus).replace(/_/g, ' ')}
                  </span>
                ) : staff.latestAssessmentStatus ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    backgroundColor: '#F1F5F9',
                    color: '#475569'
                  }}>
                    {String(staff.latestAssessmentStatus).replace(/_/g, ' ')}
                  </span>
                ) : (
                  '--'
                )}
              </span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">CONTACT NUMBER</span>
              <span className="staff-modal-value">{displayVal(staff.phone)}</span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">EMAIL ID</span>
              <span className="staff-modal-value">{displayVal(staff.email)}</span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">CURRENT STATION PLACEMENT</span>
              <span className="staff-modal-value">{displayVal(staff.stationName)}</span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">REPORTING OFFICER</span>
              <span className="staff-modal-value">{displayVal(staff.reportingOfficer)}</span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">OPERATIONAL ZONE</span>
              <span className="staff-modal-value">{displayVal(staff.zoneName)}</span>
            </div>

            <div className="staff-modal-grid-item">
              <span className="staff-modal-label">OPERATIONAL DIVISION</span>
              <span className="staff-modal-value">{displayVal(staff.divisionName)}</span>
            </div>

            {staff.evaluatedAt && (
              <div className="staff-modal-grid-item" style={{ gridColumn: 'span 2' }}>
                <span className="staff-modal-label">LAST EVALUATION DATE</span>
                <span className="staff-modal-value">{formatEvalDate(staff.evaluatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="staff-modal-footer">
          <button className="staff-modal-close-btn" onClick={onClose}>
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;
