import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ChevronRight
} from 'lucide-react';

const roleNameMap = {
  PM: 'Pointsmen',
  SM: 'Station Masters',
  TM: 'Train Managers',
  SS: 'SM Incharges',
  TI: 'Traffic Inspectors',
  AOM: 'AOM',
  'Shunting Master': 'Shunting Masters'
};

export const AssessmentRoleCard = ({ stats }) => {
  const navigate = useNavigate();
  const { 
    roleCode, 
    totalStaff, 
    activeExams, 
    pendingEvaluations, 
    completedAssessments, 
    averageScore,
    statusBreakdown 
  } = stats;
  
  const friendlyName = roleNameMap[roleCode] || roleCode;

  const handleCardClick = () => {
    navigate(`/assessments/${roleCode}`);
  };

  return (
    <div className={`assessment-role-card role-${roleCode.replace(/\s+/g, '-')}`} onClick={handleCardClick}>
      <div className="card-body">
        
        {/* Card Header with circular icon, title, dossier badge, chevron */}
        <div className="card-header">
          <div className="icon-container">
            <User className="role-icon" size={18} />
          </div>
          <div className="title-area">
            <h3 className="role-title">{friendlyName}</h3>
            <span className="dossier-badge">{roleCode} EVALUATION</span>
          </div>
          <ChevronRight className="arrow-icon" size={18} />
        </div>

        {/* Stats Grid 2x2 container */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Staff</span>
            <span className="stat-value">{totalStaff}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active MCQ</span>
            <span className="stat-value">{activeExams}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending Eval</span>
            <span className="stat-value">{pendingEvaluations}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completedAssessments}</span>
          </div>
        </div>

        {/* Average Performance Bar */}
        <div className="average-score-section">
          <div className="score-header">
            <span>Average Performance</span>
            <span className="score-value">{averageScore}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, Math.max(0, averageScore))}%` }}
            ></div>
          </div>
        </div>

        {/* Dynamic Status Breakdown Dots Row */}
        {statusBreakdown && (
          <div className="status-breakdown-row">
            <div className="status-dot-item">
              <span className="dot dot-completed"></span>
              <span className="status-dot-label">Completed</span>
              <span className="status-dot-value">{statusBreakdown.completed}</span>
            </div>
            <div className="status-dot-item">
              <span className="dot dot-pending"></span>
              <span className="status-dot-label">Pending</span>
              <span className="status-dot-value">{statusBreakdown.pending}</span>
            </div>
            <div className="status-dot-item">
              <span className="dot dot-inprogress"></span>
              <span className="status-dot-label">In Progress</span>
              <span className="status-dot-value">{statusBreakdown.inProgress}</span>
            </div>
            <div className="status-dot-item">
              <span className="dot dot-notstarted"></span>
              <span className="status-dot-label">Not Started</span>
              <span className="status-dot-value">{statusBreakdown.notStarted}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
