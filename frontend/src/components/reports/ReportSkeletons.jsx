import React from 'react';

export const KpiCardsSkeleton = () => {
  return (
    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat-card animate-pulse" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '60%' }}></div>
            <div style={{ height: '24px', backgroundColor: '#CBD5E1', borderRadius: '4px', width: '30%' }}></div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E2E8F0' }}></div>
        </div>
      ))}
    </div>
  );
};

export const ChartsSkeleton = () => {
  return (
    <div className="charts-grid" style={{ marginBottom: '24px' }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="chart-card animate-pulse">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ height: '16px', backgroundColor: '#CBD5E1', borderRadius: '4px', width: '25%' }}></div>
            <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '50%' }}></div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: '8px', minHeight: '200px' }}></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="staff-table-card animate-pulse" style={{ marginBottom: '24px' }}>
      <div style={{ backgroundColor: '#F1F5F9', height: '40px', width: '100%', marginBottom: '16px' }}></div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '32px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '100%' }}></div>
        <div style={{ height: '32px', backgroundColor: '#F1F5F9', borderRadius: '4px', width: '100%' }}></div>
        <div style={{ height: '32px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '100%' }}></div>
        <div style={{ height: '32px', backgroundColor: '#F1F5F9', borderRadius: '4px', width: '100%' }}></div>
      </div>
    </div>
  );
};
