// EmptyState.jsx
import React from 'react';
import { BarChart3 } from 'lucide-react';

const EmptyState = ({ 
  title = 'No metrics recorded yet', 
  description = 'Detailed analytics graphs will appear once assessments have been performed.' 
}) => {
  return (
    <div className="empty-wrapper">
      <div style={{ color: '#64748B', backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '50%', marginBottom: '12px' }}>
        <BarChart3 size={24} />
      </div>
      <span className="empty-title" style={{ fontSize: '14px', marginTop: '0' }}>{title}</span>
      {description && <p className="empty-desc" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>{description}</p>}
    </div>
  );
};

export default EmptyState;
