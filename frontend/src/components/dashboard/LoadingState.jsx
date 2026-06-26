// LoadingState.jsx
import React from 'react';

const LoadingState = ({ cardsCount = 4 }) => {
  return (
    <div className="dashboard-content animate-pulse">
      {/* Page Header Skeleton */}
      <div className="page-header-container" style={{ gap: '12px' }}>
        <div style={{ width: '240px', height: '32px', backgroundColor: '#E2E8F0', borderRadius: '6px' }}></div>
        <div style={{ width: '400px', height: '16px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}></div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="kpi-grid">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div key={i} className="skeleton-card"></div>
        ))}
      </div>

      {/* Charts Skeleton Grid */}
      <div className="charts-grid" style={{ marginTop: '24px' }}>
        <div className="skeleton-card" style={{ minHeight: '360px' }}></div>
        <div className="skeleton-card" style={{ minHeight: '360px' }}></div>
      </div>
    </div>
  );
};

export default LoadingState;
