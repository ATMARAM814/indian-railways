import React from 'react';
import { Users, FileText, Hourglass, TrendingUp } from 'lucide-react';

export const AssessmentSummaryStrip = ({ stats = [] }) => {
  const totalStaff = stats.reduce((acc, curr) => acc + (curr.totalStaff || 0), 0);
  const activeExams = stats.reduce((acc, curr) => acc + (curr.activeExams || 0), 0);
  const pendingEvaluations = stats.reduce((acc, curr) => acc + (curr.pendingEvaluations || 0), 0);
  const completedAssessments = stats.reduce((acc, curr) => acc + (curr.completedAssessments || 0), 0);

  const totalScorePct = stats.reduce((acc, curr) => {
    if (curr.completedAssessments > 0) {
      return acc + (curr.averageScore || 0) * curr.completedAssessments;
    }
    return acc;
  }, 0);

  const avgPerformance = completedAssessments > 0 
    ? parseFloat(totalScorePct / completedAssessments).toFixed(1)
    : '0.0';

  return (
    <div className="assessments-kpi-grid">
      {/* KPI 1: Global Scoped Staff */}
      <div className="assessment-kpi-card kpi-blue">
        <div className="kpi-icon-container">
          <Users size={20} className="kpi-icon" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Global Scoped Staff</span>
          <span className="kpi-value">{totalStaff}</span>
          <span className="kpi-subtext">Total staff in scope</span>
        </div>
      </div>
      
      {/* KPI 2: Active MCQ Exams */}
      <div className="assessment-kpi-card kpi-green">
        <div className="kpi-icon-container">
          <FileText size={20} className="kpi-icon" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Active MCQ Exams</span>
          <span className="kpi-value">{activeExams}</span>
          <span className="kpi-subtext">Currently active exams</span>
        </div>
      </div>

      {/* KPI 3: Pending Yes/No Evals */}
      <div className="assessment-kpi-card kpi-orange">
        <div className="kpi-icon-container">
          <Hourglass size={20} className="kpi-icon" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Pending Yes/No Evals</span>
          <span className="kpi-value">{pendingEvaluations}</span>
          <span className="kpi-subtext">Awaiting evaluation</span>
        </div>
      </div>

      {/* KPI 4: Average Performance */}
      <div className="assessment-kpi-card kpi-purple">
        <div className="kpi-icon-container">
          <TrendingUp size={20} className="kpi-icon" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Average Performance</span>
          <span className="kpi-value">{avgPerformance}%</span>
          <span className="kpi-subtext">Across all scoped staff</span>
        </div>
      </div>
    </div>
  );
};
