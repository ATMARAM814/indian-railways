import React from 'react';
import WorkforcePageLayout from '../../components/workforce/WorkforcePageLayout';

const AOMUsersPage = () => {
  return (
    <WorkforcePageLayout
      roleCode="AOM"
      roleTitle="Assistant Operations Managers"
      roleSubtitle="Manage divisional operations managers and performance"
      showStationFilter={false}
    />
  );
};

export default AOMUsersPage;
