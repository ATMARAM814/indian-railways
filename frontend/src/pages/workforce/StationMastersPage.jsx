import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const StationMastersPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="SM"
      roleTitle="Station Masters"
      roleSubtitle="Manage station masters registry, postings, and safety compliance"
      showStationFilter={true}
    />
  );
};

export default StationMastersPage;
