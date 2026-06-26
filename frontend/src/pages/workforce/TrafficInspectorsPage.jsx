import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const TrafficInspectorsPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="TI"
      roleTitle="Traffic Inspectors"
      roleSubtitle="Manage divisional traffic inspectors and area compliance"
      showStationFilter={false}
    />
  );
};

export default TrafficInspectorsPage;
