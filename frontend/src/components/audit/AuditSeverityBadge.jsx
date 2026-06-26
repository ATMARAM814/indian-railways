import React from 'react';

const AuditSeverityBadge = ({ severity }) => {
  const sev = (severity || 'LOW').toUpperCase();

  let styles;

  switch (sev) {
    case 'CRITICAL':
      styles = {
        backgroundColor: '#FEF2F2',
        color: '#991B1B',
        border: '1px solid #FCA5A5',
        dotColor: '#DC2626',
      };
      break;
    case 'HIGH':
      styles = {
        backgroundColor: '#FFF7ED',
        color: '#9A3412',
        border: '1px solid #FED7AA',
        dotColor: '#EA580C',
      };
      break;
    case 'MEDIUM':
      styles = {
        backgroundColor: '#EFF6FF',
        color: '#1E40AF',
        border: '1px solid #BFDBFE',
        dotColor: '#2B5CE6',
      };
      break;
    case 'LOW':
    default:
      styles = {
        backgroundColor: '#F8FAFC',
        color: '#334155',
        border: '1px solid #E2E8F0',
        dotColor: '#64748B',
      };
      break;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        border: styles.border,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: styles.dotColor,
        }}
      />
      {sev}
    </span>
  );
};

export default AuditSeverityBadge;
