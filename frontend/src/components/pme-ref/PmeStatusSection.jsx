import React from 'react';
import StatusSummaryCards from './StatusSummaryCards';
import StatusHistoryTable from './StatusHistoryTable';

export const PmeStatusSection = ({ data }) => {
  return (
    <div className="pme-ref-section">
      <div className="pme-ref-section-header">
        <h2 className="pme-ref-section-title">PME Status Details</h2>
        <p className="pme-ref-section-subtitle">
          Track your Periodical Medical Examination schedule, completion status, due dates, and medical fitness record.
        </p>
      </div>
      <StatusSummaryCards type="pme" data={data} />
      <div style={{ marginTop: '8px' }}>
        <StatusHistoryTable type="pme" history={data?.history} />
      </div>
    </div>
  );
};

export default PmeStatusSection;
