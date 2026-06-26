import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const StationMastersInchargePage = () => {
  return (
    <WorkforcePageLayout
      roleCode="SS"
      roleTitle="SM Incharges"
      roleSubtitle="Manage SM Incharges registry, postings, and safety compliance"
      showStationFilter={true}
    />
  );
};

export default StationMastersInchargePage;
