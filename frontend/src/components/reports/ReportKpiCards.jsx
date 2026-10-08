import React from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  Award, 
  ShieldAlert, 
  CalendarDays
} from 'lucide-react';

const ReportKpiCards = ({ summary, userRole, onKpiClick }) => {
  if (!summary) return null;

  const kpis = [
    {
      title: 'Total Assessments',
      value: summary.totalAssessments || 0,
      icon: <FileText size={20} className="text-[#2B5CE6]" />,
      bg: 'bg-blue-50/50',
    },
    {
      title: 'Completed Assessments',
      value: summary.completedAssessments || 0,
      icon: <ClipboardCheck size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50/50',
    },
    {
      title: 'Category A Staff',
      value: summary.categoryAEmployees || 0,
      icon: <Award size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50/50',
    },
    {
      title: 'Category D (High Risk) Staff',
      value: summary.categoryDEmployees || 0,
      icon: <ShieldAlert size={20} className="text-rose-600" />,
      bg: 'bg-rose-50/50',
    },
    {
      title: 'Completed Cycles',
      value: summary.assessmentCyclesCompleted || 0,
      icon: <CalendarDays size={20} className="text-indigo-600" />,
      bg: 'bg-indigo-50/50',
    }
  ];

  return (
    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
      {kpis.map((kpi, idx) => {
        const isClickable = [
          'Total Assessments',
          'Completed Assessments',
          'Category A Staff',
          'Category D (High Risk) Staff',
          'Completed Cycles'
        ].includes(kpi.title);

        return (
          <div 
            key={idx} 
            className="stat-card"
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
            onClick={() => isClickable && onKpiClick && onKpiClick(kpi.title)}
          >
            <div className="stat-card-header">
              <span className="stat-card-title">{kpi.title}</span>
              <div className="stat-card-icon-container">
                {kpi.icon}
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{kpi.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportKpiCards;
