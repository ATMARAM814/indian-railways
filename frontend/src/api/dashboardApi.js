// dashboardApi.js
import apiClient from './apiClient';

export const getPmDashboardData = async () => {
  const res = await apiClient.get('/dashboard/pm');
  return res.data;
};

export const getTmDashboardData = async () => {
  const res = await apiClient.get('/dashboard/tm');
  return res.data;
};

export const getShuntingMasterDashboardData = async () => {
  const res = await apiClient.get('/dashboard/shunting-master');
  return res.data;
};

const supplementStationStaff = async (dashboardData) => {
  if (!dashboardData) return dashboardData;
  const stationId = dashboardData.station?.id;
  if (!stationId) return dashboardData;

  const needsHydration = 
    !dashboardData.pointsmen?.length || 
    !dashboardData.stationMasters?.length || 
    !dashboardData.summary?.totalEmployees || 
    dashboardData.summary.totalEmployees === 0;

  if (needsHydration) {
    try {
      const staffRes = await apiClient.get(`/stations/${stationId}/staff`);
      if (staffRes.data?.success && Array.isArray(staffRes.data.data)) {
        const allStaff = staffRes.data.data;
        const activeStaff = allStaff.filter(s => !s.status || s.status.toLowerCase() === 'active');

        const smList = activeStaff.filter(s => s.role === 'SM').map(s => ({
          id: s.id,
          fullName: s.full_name || s.fullName,
          hrmsId: s.hrms_id || s.hrmsId,
          designation: s.designation,
          category: s.category_code || s.category,
          phone: s.phone,
          role: s.role
        }));

        const ssList = activeStaff.filter(s => s.role === 'SS').map(s => ({
          id: s.id,
          fullName: s.full_name || s.fullName,
          hrmsId: s.hrms_id || s.hrmsId,
          designation: s.designation,
          category: s.category_code || s.category,
          phone: s.phone,
          role: s.role
        }));

        const cmList = activeStaff.filter(s => ['Cabin Master', 'CABIN MASTER', 'CM'].includes(s.role)).map(s => ({
          id: s.id,
          fullName: s.full_name || s.fullName,
          hrmsId: s.hrms_id || s.hrmsId,
          designation: s.designation,
          category: s.category_code || s.category,
          phone: s.phone,
          role: s.role
        }));

        const shmList = activeStaff.filter(s => ['Shunting Master', 'SHUNTING MASTER', 'SHM'].includes(s.role)).map(s => ({
          id: s.id,
          fullName: s.full_name || s.fullName,
          hrmsId: s.hrms_id || s.hrmsId,
          designation: s.designation,
          category: s.category_code || s.category,
          phone: s.phone,
          role: s.role
        }));

        const pmList = activeStaff.filter(s => s.role === 'PM').map(s => ({
          id: s.id,
          fullName: s.full_name || s.fullName,
          hrmsId: s.hrms_id || s.hrmsId,
          designation: s.designation,
          category: s.category_code || s.category,
          phone: s.phone,
          role: s.role
        }));

        const catA = pmList.filter(p => (p.category || '').toUpperCase() === 'A').length;
        const catB = pmList.filter(p => (p.category || '').toUpperCase() === 'B').length;
        const catC = pmList.filter(p => (p.category || '').toUpperCase() === 'C').length;
        const catD = pmList.filter(p => (p.category || '').toUpperCase() === 'D').length;

        if (!dashboardData.pointsmen?.length) dashboardData.pointsmen = pmList;
        if (!dashboardData.stationMasters?.length) dashboardData.stationMasters = smList;
        if (!dashboardData.stationMasterIncharges?.length) dashboardData.stationMasterIncharges = ssList;
        if (!dashboardData.cabinMasters?.length) dashboardData.cabinMasters = cmList;
        if (!dashboardData.shuntingMasters?.length) dashboardData.shuntingMasters = shmList;

        if (!dashboardData.summary) dashboardData.summary = {};
        if (!dashboardData.summary.totalEmployees || dashboardData.summary.totalEmployees === 0) {
          dashboardData.summary.totalEmployees = activeStaff.length;
        }
        if (!dashboardData.summary.totalPM || dashboardData.summary.totalPM === 0) {
          dashboardData.summary.totalPM = pmList.length;
        }
        if (!dashboardData.summary.categoryA) dashboardData.summary.categoryA = catA;
        if (!dashboardData.summary.categoryB) dashboardData.summary.categoryB = catB;
        if (!dashboardData.summary.categoryC) dashboardData.summary.categoryC = catC;
        if (!dashboardData.summary.categoryD) dashboardData.summary.categoryD = catD;
        if (!dashboardData.summary.highRiskStaff) dashboardData.summary.highRiskStaff = catD;
      }
    } catch (err) {
      console.error('Failed to supplement staff from station endpoint:', err);
    }
  }

  return dashboardData;
};

export const getSmDashboardData = async () => {
  const res = await apiClient.get('/dashboard/sm');
  if (res.data?.success && res.data?.data) {
    res.data.data = await supplementStationStaff(res.data.data);
  }
  return res.data;
};

export const getTiDashboardData = async () => {
  const res = await apiClient.get('/dashboard/ti');
  return res.data;
};

export const getAomDashboardData = async () => {
  const res = await apiClient.get('/dashboard/aom');
  return res.data;
};

export const getSuperAdminDashboardData = async () => {
  const res = await apiClient.get('/dashboard/super-admin');
  return res.data;
};

export const getSuperAdminWorkforceActivity = async (params = {}) => {
  const res = await apiClient.get('/dashboard/super-admin/workforce-activity', { params });
  return res.data;
};

export const getSuperAdminHighRiskStaff = async (params = {}) => {
  const res = await apiClient.get('/dashboard/super-admin/high-risk-staff', { params });
  return res.data;
};

export const getSmSupervisorDashboardData = async () => {
  const res = await apiClient.get('/dashboard/station-master-supervisor');
  if (res.data?.success && res.data?.data) {
    res.data.data = await supplementStationStaff(res.data.data);
  }
  return res.data;
};

export const getDashboardCategoryCandidates = async (params = {}) => {
  const res = await apiClient.get('/dashboard/category-candidates', { params });
  return res.data;
};

export const getSuperAdminTiAssessmentStats = async () => {
  const res = await apiClient.get('/dashboard/super-admin/ti-assessment-stats');
  return res.data;
};
