import React from 'react';

export const PmeRefSkeletons = () => {
  return (
    <div className="pme-ref-skeleton-container">
      {/* PME Skeleton Section */}
      <div className="pme-ref-skeleton-section">
        <div className="pme-ref-skeleton-header"></div>
        <div className="pme-ref-skeleton-subheader" style={{ marginTop: '8px' }}></div>
        <div className="pme-ref-skeleton-grid" style={{ marginTop: '24px' }}>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
        </div>
        <div className="pme-ref-skeleton-table" style={{ marginTop: '24px' }}></div>
      </div>

      {/* REF Skeleton Section */}
      <div className="pme-ref-skeleton-section">
        <div className="pme-ref-skeleton-header"></div>
        <div className="pme-ref-skeleton-subheader" style={{ marginTop: '8px' }}></div>
        <div className="pme-ref-skeleton-grid" style={{ marginTop: '24px' }}>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
          <div className="pme-ref-skeleton-card"></div>
        </div>
        <div className="pme-ref-skeleton-table" style={{ marginTop: '24px' }}></div>
      </div>
    </div>
  );
};

export default PmeRefSkeletons;
