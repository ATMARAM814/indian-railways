import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const ActiveAssessmentBanner = ({ assessment }) => {
  const navigate = useNavigate();

  if (!assessment) return null;

  const handleStartClick = () => {
    navigate(`/my-assessment/${assessment.id}/confirm`);
  };

  return (
    <div className="active-banner-card">
      <div className="active-banner-header">
        <div className="active-banner-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h3 className="active-banner-title">Pending Competency Assessment</h3>
          <p className="active-banner-desc">
            Your supervisor has scheduled a periodic safety & competency assessment for you. You must complete the {assessment.question_count || 25}-question MCQ exam.
          </p>
        </div>
      </div>

      <div className="active-banner-action">
        <button className="btn-banner-start" onClick={handleStartClick} style={{ borderRadius: '8px' }}>
          <span>Start Examination</span>
        </button>
      </div>
    </div>
  );
};

export default ActiveAssessmentBanner;
