// ChartCard.jsx
import React from 'react';

const ChartCard = ({ title, subtitle, children, headerAction, style, bodyStyle }) => {
  return (
    <div className="chart-card" style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="chart-card-header" style={{ marginBottom: 0 }}>
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {headerAction && <div className="chart-card-action">{headerAction}</div>}
      </div>
      <div className="chart-card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
