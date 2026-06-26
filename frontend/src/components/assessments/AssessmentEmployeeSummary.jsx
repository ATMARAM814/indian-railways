import React from 'react';
import { User, MapPin, Shield, Calendar } from 'lucide-react';
import { cleanDesignationText } from '../../utils/dashboardMappers';

export const AssessmentEmployeeSummary = ({ result }) => {
  if (!result) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  };

  return (
    <div className="employee-summary-card">
      <div className="summary-section profile-info">
        <div className="summary-icon-wrapper">
          <User size={24} />
        </div>
        <div>
          <span className="summary-label">Assessed Employee</span>
          <h4 className="summary-value">{result.assessed_name}</h4>
          <span className="summary-subtext">HRMS ID: {result.assessed_hrms_id} | Designation: {cleanDesignationText(result.assessed_role_code)}</span>
        </div>
      </div>

      <div className="summary-section assessor-info">
        <div className="summary-icon-wrapper text-blue-400">
          <Shield size={24} />
        </div>
        <div>
          <span className="summary-label">Assessing Officer</span>
          <h4 className="summary-value">{result.assessor_name}</h4>
          <span className="summary-subtext">HRMS ID: {result.assessor_hrms_id} | Role: {cleanDesignationText(result.assessor_role_code)}</span>
        </div>
      </div>

      <div className="summary-section date-info">
        <div className="summary-icon-wrapper text-emerald-400">
          <Calendar size={24} />
        </div>
        <div>
          <span className="summary-label">Initiated Date</span>
          <h4 className="summary-value">{formatDate(result.created_at)}</h4>
          {result.evaluated_at && (
            <span className="summary-subtext">Evaluated: {formatDate(result.evaluated_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
