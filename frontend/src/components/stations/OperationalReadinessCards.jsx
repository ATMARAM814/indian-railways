// OperationalReadinessCards.jsx
import React from 'react';
import { Stethoscope, GraduationCap, MessagesSquare, Award } from 'lucide-react';

export const OperationalReadinessCards = ({ data }) => {
  if (!data) return null;

  const cards = [
    {
      label: 'PME Due / Overdue',
      val: data.pmeDue || 0,
      icon: <Stethoscope size={20} />,
      color: '#B91C1C',
      bg: '#FEF2F2',
      highlight: data.pmeDue > 0
    },
    {
      label: 'REF Due / Overdue',
      val: data.refDue || 0,
      icon: <GraduationCap size={20} />,
      color: '#B45309',
      bg: '#FFFBEB',
      highlight: data.refDue > 0
    },
    {
      label: 'Counselling Required',
      val: data.counsellingRequired || 0,
      icon: <MessagesSquare size={20} />,
      color: '#0369A1',
      bg: '#F0F9FF',
      highlight: data.counsellingRequired > 0
    },
    {
      label: 'Training Required',
      val: data.trainingRequired || 0,
      icon: <Award size={20} />,
      color: '#4F46E5',
      bg: '#EEF2FF',
      highlight: data.trainingRequired > 0
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
        Operational Readiness & Compliance Alerts
      </h3>
      <div className="readiness-grid">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className={`readiness-card ${card.highlight ? 'highlight' : ''}`}
            style={card.highlight ? { borderLeftColor: card.color } : {}}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="readiness-label">{card.label}</span>
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
            <div className="readiness-val" style={card.highlight ? { color: card.color } : {}}>
              {card.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default OperationalReadinessCards;
