import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const PointsmenPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="PM"
      roleTitle="Pointsmen"
      roleSubtitle="Manage station pointsmen registry, postings, and safety compliance"
      showStationFilter={true}
    />
  );
};

export default PointsmenPage;
