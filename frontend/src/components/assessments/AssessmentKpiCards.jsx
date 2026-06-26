import React from 'react';
import { Users, FileClock, ShieldAlert, BadgeCheck } from 'lucide-react';

export const AssessmentKpiCards = ({ stats }) => {
  const { totalStaff = 0, activeExams = 0, pendingEvaluations = 0, completedAssessments = 0, averageScore = 0 } = stats || {};

  return (
    <div className="assessment-kpi-grid">
      <div className="assessment-kpi-card">
        <div className="kpi-icon-container">
          <Users size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-title">Scoped Staff</span>
          <span className="kpi-value">{totalStaff}</span>
        </div>
      </div>

      <div className="assessment-kpi-card">
        <div className="kpi-icon-container text-amber-500">
          <FileClock size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-title">MCQ Exam Active</span>
          <span className="kpi-value">{activeExams}</span>
        </div>
      </div>

      <div className="assessment-kpi-card">
        <div className="kpi-icon-container text-purple-400">
          <ShieldAlert size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-title">Pending Evaluation</span>
          <span className="kpi-value">{pendingEvaluations}</span>
        </div>
      </div>

      <div className="assessment-kpi-card">
        <div className="kpi-icon-container text-emerald-400">
          <BadgeCheck size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-title">Average Score</span>
          <span className="kpi-value">{completedAssessments > 0 ? `${averageScore}%` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};
