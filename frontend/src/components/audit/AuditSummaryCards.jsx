import React from 'react';
import {
  FileText,
  ShieldAlert,
  AlertCircle,
  Calendar,
  UserX,
  Users,
  ClipboardList,
  CheckSquare,
} from 'lucide-react';

const AuditSummaryCards = ({ summary = {}, loading = false }) => {
  const cardData = [
    {
      title: 'Total Logs',
      value: summary.totalLogs,
      icon: <FileText size={20} />,
      description: 'Total logged operations',
    },
    {
      title: 'Critical Logs',
      value: summary.criticalLogs,
      icon: <ShieldAlert size={20} className="text-red-600" />,
      description: 'Critical issues logged',
    },
    {
      title: 'High Severity Logs',
      value: summary.highSeverityLogs,
      icon: <AlertCircle size={20} />,
      description: 'High severity actions',
    },
    {
      title: "Today's Activity",
      value: summary.todayLogs,
      icon: <Calendar size={20} />,
      description: 'Logs recorded today',
    },
    {
      title: 'Failed Logins',
      value: summary.failedLoginAttempts,
      icon: <UserX size={20} />,
      description: 'Failed login attempts',
    },
    {
      title: 'User Changes',
      value: summary.userChanges,
      icon: <Users size={20} />,
      description: 'Profile creations & updates',
    },
    {
      title: 'Assessment Actions',
      value: summary.assessmentActions,
      icon: <ClipboardList size={20} />,
      description: 'Created, drafts, submissions',
    },
    {
      title: 'Approval Actions',
      value: summary.approvalActions,
      icon: <CheckSquare size={20} />,
      description: 'Approvals & score edits',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
      }}
    >
      {cardData.map((card, idx) => (
        <div key={idx} className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">{card.title}</span>
            <div className="stat-card-icon-container">
              {card.icon}
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-card-value">
              {loading ? '...' : card.value !== null && card.value !== undefined ? card.value : '0'}
            </span>
          </div>
          <div className="stat-card-footer">
            <span className="stat-card-footer-text">{card.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditSummaryCards;
