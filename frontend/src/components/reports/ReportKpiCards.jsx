import React from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  Clock, 
  Award, 
  ShieldAlert, 
  CheckCircle,
  TrendingUp,
  Activity,
  Building2,
  CalendarDays
} from 'lucide-react';

const ReportKpiCards = ({ summary, userRole, onKpiClick }) => {
  if (!summary) return null;

  const isAomOrAdmin = ['AOM', 'SUPER_ADMIN'].includes(userRole);

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
    ...(['TI', 'AOM', 'SUPER_ADMIN'].includes(userRole) ? [{
      title: 'Pending Approvals',
      value: summary.pendingApprovals || 0,
      icon: <Clock size={20} className="text-amber-500" />,
      bg: 'bg-amber-50/50',
    }] : []),
    {
      title: 'Average Score',
      value: summary.averageScore ? `${Number(summary.averageScore).toFixed(1)}%` : '0.0%',
      icon: <TrendingUp size={20} className="text-[#0B2341]" />,
      bg: 'bg-slate-50',
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
      title: 'Pass Rate',
      value: summary.passRate ? `${Number(summary.passRate).toFixed(1)}%` : '0.0%',
      icon: <CheckCircle size={20} className="text-blue-600" />,
      bg: 'bg-blue-50/50',
    },
    {
      title: 'Safety Compliance Rate',
      value: summary.safetyComplianceRate ? `${Number(summary.safetyComplianceRate).toFixed(1)}%` : '0.0%',
      icon: <Activity size={20} className="text-purple-600" />,
      bg: 'bg-purple-50/50',
    }
  ];

  // AOM and SUPER_ADMIN exclusive cards
  const adminKpis = [
    {
      title: 'High Risk Staff',
      value: summary.highRiskStaff || 0,
      icon: <ShieldAlert size={20} className="text-rose-600" />,
      bg: 'bg-rose-50/50 border border-rose-200',
    },
    {
      title: 'Active Stations',
      value: summary.activeStations || 0,
      icon: <Building2 size={20} className="text-[#0B2341]" />,
      bg: 'bg-slate-50',
    },
    {
      title: 'Completed Cycles',
      value: summary.assessmentCyclesCompleted || 0,
      icon: <CalendarDays size={20} className="text-indigo-600" />,
      bg: 'bg-indigo-50/50',
    }
  ];

  const displayKpis = isAomOrAdmin ? [...kpis, ...adminKpis] : kpis;

  return (
    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
      {displayKpis.map((kpi, idx) => {
        const isClickable = [
          'Total Assessments',
          'Completed Assessments',
          'Pending Approvals',
          'Category A Staff',
          'Category D (High Risk) Staff',
          'High Risk Staff',
          'Active Stations',
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
