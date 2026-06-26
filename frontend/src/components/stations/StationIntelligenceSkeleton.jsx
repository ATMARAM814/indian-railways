// StationIntelligenceSkeleton.jsx
import React from 'react';

export const StationIntelligenceSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      {/* Banner Skeleton */}
      <div className="skeleton-card" style={{ height: '100px', borderRadius: '16px' }}></div>

      {/* Command Header Skeleton */}
      <div className="skeleton-card" style={{ height: '90px', borderRadius: '16px' }}></div>

      {/* KPI Grid Skeleton */}
      <div className="station-overview-grid" style={{ display: 'grid', gap: '16px' }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="skeleton-card" style={{ height: '80px', borderRadius: '12px' }}></div>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="distribution-grid" style={{ display: 'grid', gap: '24px' }}>
        <div className="skeleton-card" style={{ height: '300px', borderRadius: '16px' }}></div>
        <div className="skeleton-card" style={{ height: '300px', borderRadius: '16px' }}></div>
      </div>

      {/* Trend Skeleton */}
      <div className="skeleton-card" style={{ height: '340px', borderRadius: '16px' }}></div>

      {/* Readiness Skeleton */}
      <div className="skeleton-card" style={{ height: '180px', borderRadius: '16px' }}></div>

      {/* Workforce Skeleton */}
      <div className="skeleton-card" style={{ height: '400px', borderRadius: '16px' }}></div>
    </div>
  );
};
export default StationIntelligenceSkeleton;
