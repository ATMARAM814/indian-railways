// StatCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon, trend, type = 'normal', link, clickable = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
      return;
    }

    const lowerTitle = title?.toLowerCase() || '';
    const isAssessor = ['SM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Station Master Supervisor', 'TI', 'AOM', 'SUPER_ADMIN'].includes(user?.role);

    // 1. Approvals-related cards
    if (lowerTitle.includes('pending approvals') || lowerTitle.includes('completed approvals') || lowerTitle.includes('approval')) {
      navigate('/approvals');
      return;
    }

    // 2. Stations & Divisions related cards
    if (lowerTitle.includes('station') || lowerTitle.includes('division')) {
      if (user?.role === 'TI') {
        navigate('/stations');
      } else if (['AOM', 'SUPER_ADMIN'].includes(user?.role)) {
        navigate('/division');
      }
      return;
    }

    // 3. Employee/Workforce-related cards
    if (lowerTitle.includes('employee') || lowerTitle.includes('pointsmen') || lowerTitle.includes('staff')) {
      if (isAssessor) {
        navigate('/workforce/pointsmen');
      } else {
        navigate('/profile');
      }
      return;
    }

    // 4. Score-related cards (Average Score / Latest Score)
    if (lowerTitle.includes('score')) {
      if (isAssessor) {
        navigate('/reports');
      } else {
        navigate('/my-assessment');
      }
      return;
    }

    // 5. Assessment & Evaluation related cards
    if (lowerTitle.includes('assessment') || lowerTitle.includes('evaluation')) {
      if (isAssessor) {
        navigate('/assessments');
      } else {
        navigate('/my-assessment');
      }
      return;
    }

    // 6. Category & Risk related cards
    if (lowerTitle.includes('category') || lowerTitle.includes('risk')) {
      if (isAssessor) {
        navigate('/reports');
      } else {
        navigate('/profile');
      }
      return;
    }
  };

  return (
    <div className={`stat-card ${type} ${!clickable ? 'non-clickable' : ''}`} onClick={clickable ? handleClick : undefined}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className={`stat-card-icon-container ${type}`}>
          {icon}
        </div>
      </div>
      <div className="stat-card-body">
        <span className="stat-card-value">{value !== null && value !== undefined ? value : '—'}</span>
      </div>
      {trend && (
        <div className="stat-card-footer">
          <span className="stat-card-footer-text">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
