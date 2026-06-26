import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const TrainManagersPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="TM"
      roleTitle="Train Managers"
      roleSubtitle="Manage train managers registry and safety compliance"
      showStationFilter={false}
    />
  );
};

export default TrainManagersPage;
