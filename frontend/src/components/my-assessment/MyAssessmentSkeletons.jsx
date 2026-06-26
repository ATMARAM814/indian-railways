import React from 'react';

export const LandingSkeleton = () => {
  return (
    <div className="skeleton-container animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* KPI Cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ height: '120px' }} />
        ))}
      </div>

      {/* Active banner skeleton */}
      <div className="skeleton-card" style={{ height: '180px' }} />

      {/* Table skeleton */}
      <div className="skeleton-table">
        <div className="skeleton-table-header" style={{ height: '40px' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-table-row" style={{ display: 'flex', gap: '16px', padding: '12px 16px' }}>
            <div className="skeleton-cell" style={{ flex: 1, height: '20px' }} />
            <div className="skeleton-cell" style={{ flex: 1, height: '20px' }} />
            <div className="skeleton-cell" style={{ flex: 1, height: '20px' }} />
            <div className="skeleton-cell" style={{ width: '80px', height: '20px' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScorecardSkeleton = () => {
  return (
    <div className="skeleton-container animate-pulse" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', width: '100%' }}>
      {/* Left sidebar card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton-card" style={{ height: '320px' }} />
      </div>

      {/* Right panel cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton-card" style={{ height: '240px' }} />
        <div className="skeleton-card" style={{ height: '400px' }} />
      </div>
    </div>
  );
};

// Default export
const MyAssessmentSkeletons = {
  LandingSkeleton,
  ScorecardSkeleton
};

export default MyAssessmentSkeletons;
