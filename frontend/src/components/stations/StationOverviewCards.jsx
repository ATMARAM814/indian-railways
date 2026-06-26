// StationOverviewCards.jsx
import React from 'react';
import { Users, Clock, CheckCircle2, ShieldAlert, Award, AlertTriangle } from 'lucide-react';

export const StationOverviewCards = ({ overview }) => {
  if (!overview) return null;

  const cards = [
    {
      title: 'Total Workforce',
      value: overview.totalWorkforce || 0,
      icon: <Users size={20} />,
      color: '#3B82F6',
      bg: '#EFF6FF',
    },
    {
      title: 'Pending Assessments',
      value: overview.pendingAssessments || 0,
      icon: <Clock size={20} />,
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      title: 'Completed Assessments',
      value: overview.completedAssessments || 0,
      icon: <CheckCircle2 size={20} />,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      title: 'Safety Compliance %',
      value: `${overview.safetyCompliance || 100}%`,
      icon: <Award size={20} />,
      color: '#1E3A8A',
      bg: '#EEF2F6',
    },
    {
      title: 'High Risk Staff',
      value: overview.highRiskStaff || 0,
      icon: <AlertTriangle size={20} />,
      color: '#DC2626',
      bg: '#FEF2F2',
    },
    {
      title: 'Category D Staff',
      value: overview.categoryDStaff || 0,
      icon: <ShieldAlert size={20} />,
      color: '#991B1B',
      bg: '#FFF1F2',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '16px'
    }}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D7E3EF',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>
              {card.title}
            </span>
            <div style={{
              padding: '6px',
              borderRadius: '6px',
              color: card.color,
              backgroundColor: card.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {card.icon}
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};
export default StationOverviewCards;
