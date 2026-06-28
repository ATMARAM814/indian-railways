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

export const getSmDashboardData = async () => {
  const res = await apiClient.get('/dashboard/sm');
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
  return res.data;
};

export const getDashboardCategoryCandidates = async (params = {}) => {
  const res = await apiClient.get('/dashboard/category-candidates', { params });
  return res.data;
};
