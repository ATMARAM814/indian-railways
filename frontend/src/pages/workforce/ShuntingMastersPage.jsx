import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const ShuntingMastersPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="Shunting Master"
      roleTitle="Shunting Masters"
      roleSubtitle="Manage shunting masters registry, postings, and safety compliance"
      showStationFilter={true}
    />
  );
};

export default ShuntingMastersPage;
