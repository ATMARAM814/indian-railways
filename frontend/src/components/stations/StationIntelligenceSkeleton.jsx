// StationIntelligenceSkeleton.jsx
import React from 'react';

export const StationIntelligenceSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      {/* Banner Skeleton */}
      <div className="skeleton-card" style={{ height: '100px', borderRadius: '16px' }}></div>

      {/* Command Header Skeleton */}
      <div className="skeleton-card" style={{ height: '90px', borderRadius: '16px' }}></div>

      {/* Role Stat Grid Skeleton */}
      <div className="role-stat-grid-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="skeleton-card" style={{ height: '90px', borderRadius: '12px' }}></div>
        ))}
      </div>

      {/* Distribution Chart Skeleton */}
      <div style={{ width: '100%' }}>
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
