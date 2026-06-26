import React from 'react';
import { ShieldCheck } from 'lucide-react';

const NoActiveAssessmentCard = () => {
  return (
    <div className="no-assessments-card">
      <div className="no-assessments-icon">
        <ShieldCheck size={36} />
      </div>
      <h3 className="no-assessments-title">All Caught Up!</h3>
      <p className="no-assessments-desc">
        There are no active or pending scheduled assessments assigned to your profile at the moment. 
        You will be notified once a supervisor schedules a new evaluation.
      </p>
    </div>
  );
};

export default NoActiveAssessmentCard;
