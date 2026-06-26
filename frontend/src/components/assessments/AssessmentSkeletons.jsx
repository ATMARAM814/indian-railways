import React from 'react';

export const CardSkeleton = () => (
  <div className="skeleton-container animate-pulse">
    {[1, 2].map((i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-icon"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-footer"></div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = () => (
  <div className="skeleton-table animate-pulse">
    <div className="skeleton-table-header"></div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="skeleton-table-row">
        <div className="skeleton-cell w-1/4"></div>
        <div className="skeleton-cell w-1/6"></div>
        <div className="skeleton-cell w-1/6"></div>
        <div className="skeleton-cell w-1/12"></div>
        <div className="skeleton-cell w-1/6"></div>
      </div>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="skeleton-form animate-pulse">
    <div className="skeleton-section h-24 mb-6"></div>
    <div className="skeleton-section h-48 mb-6"></div>
    <div className="skeleton-section h-32 mb-6"></div>
    <div className="skeleton-button h-12 w-32"></div>
  </div>
);
