import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const StationMasterSupervisorsPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="SMS"
      roleTitle="Station Master Supervisors"
      roleSubtitle="Manage station master supervisors registry, postings, and safety compliance"
      showStationFilter={true}
    />
  );
};

export default StationMasterSupervisorsPage;
