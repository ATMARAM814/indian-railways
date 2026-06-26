import React from 'react';
import StatusSummaryCards from './StatusSummaryCards';
import StatusHistoryTable from './StatusHistoryTable';

export const RefStatusSection = ({ data }) => {
  return (
    <div className="pme-ref-section">
      <div className="pme-ref-section-header">
        <h2 className="pme-ref-section-title">REF Course Status Details</h2>
        <p className="pme-ref-section-subtitle">
          Track your Refresher Course training history, current status, and upcoming due dates.
        </p>
      </div>
      <StatusSummaryCards type="ref" data={data} />
      <div style={{ marginTop: '8px' }}>
        <StatusHistoryTable type="ref" history={data?.history} />
      </div>
    </div>
  );
};

export default RefStatusSection;
