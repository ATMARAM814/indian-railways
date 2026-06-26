import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const CabinMastersPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="Cabin Master"
      roleTitle="Cabin Masters"
      roleSubtitle="Manage cabin masters registry, postings, and safety compliance"
      showStationFilter={true}
    />
  );
};

export default CabinMastersPage;
