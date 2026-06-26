// StaffProfileModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { cleanDesignationText } from '../../utils/dashboardMappers';

const StaffProfileModal = ({ isOpen, onClose, staff }) => {
  if (!isOpen || !staff) return null;

  const displayVal = (val) => (val !== null && val !== undefined && val !== '' ? val : '--');

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
