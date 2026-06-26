import React from 'react';
import { Award, FileCheck, Percent, Layers } from 'lucide-react';

const MyAssessmentKpiCards = ({ stats }) => {
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'A': return 'text-success'; // usually green/emerald
      case 'B': return 'text-blue'; // blue
      case 'C': return 'text-warning'; // amber/orange
      case 'D': return 'text-danger'; // red
      default: return 'text-muted';
    }
  };

  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'A': return 'cat-a';
      case 'B': return 'cat-b';
      case 'C': return 'cat-c';
      case 'D': return 'cat-d';
      default: return '';
    }
  };

  return (
    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
      {/* KPI Card 1: Total Completed Assessments */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-title">Completed Assessments</div>
          <div className="stat-card-icon" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
            <FileCheck size={20} />
          </div>
        </div>
        <div className="stat-card-value">{stats.total}</div>
        <div className="stat-card-desc">Total evaluations completed and approved</div>
      </div>

      {/* KPI Card 2: Latest Score */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-title">Latest Score</div>
          <div className="stat-card-icon" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <Percent size={20} />
          </div>
        </div>
        <div className="stat-card-value">
          {stats.total > 0 ? `${stats.latestScore}%` : 'N/A'}
        </div>
        <div className="stat-card-desc">Score achieved in your most recent evaluation</div>
      </div>

      {/* KPI Card 3: Average Score */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-title">Average Performance</div>
          <div className="stat-card-icon" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
            <Award size={20} />
          </div>
        </div>
        <div className="stat-card-value">
          {stats.total > 0 ? `${stats.averageScore}%` : 'N/A'}
        </div>
        <div className="stat-card-desc">Cumulative average score across all tests</div>
      </div>

      {/* KPI Card 4: Current Competency Category */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-title">Current Competency</div>
          <div className="stat-card-icon" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
            <Layers size={20} />
          </div>
        </div>
        <div className="stat-card-value">
          <span className={`category-badge-text ${getCategoryClass(stats.currentCategory)}`} style={{ fontWeight: 800 }}>
            {stats.currentCategory}
          </span>
        </div>
        <div className="stat-card-desc">
          {stats.currentCategory === 'A' && 'Highly Competent (Score ≥ 80%)'}
          {stats.currentCategory === 'B' && 'Competent (Score 70% - 79%)'}
          {stats.currentCategory === 'C' && 'Needs Monitoring (Score 60% - 69%)'}
          {stats.currentCategory === 'D' && 'Critical/Unfit (Score < 60%)'}
          {stats.currentCategory === 'N/A' && 'No assessments completed yet'}
        </div>
      </div>
    </div>
  );
};

export default MyAssessmentKpiCards;
