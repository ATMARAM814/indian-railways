import apiClient from '../api/apiClient';

export const getReportsSummary = async (params = {}) => {
  const res = await apiClient.get('/reports/summary', { params });
  return res.data;
};

export const getReportsPerformance = async (params = {}) => {
  const res = await apiClient.get('/reports/performance', { params });
  return res.data;
};

export const getReportsHighRisk = async (params = {}) => {
  const res = await apiClient.get('/reports/high-risk', { params });
  return res.data;
};

export const getReportsStations = async (params = {}) => {
  const res = await apiClient.get('/reports/stations', { params });
  return res.data;
};

export const getReportsCycles = async (params = {}) => {
  const res = await apiClient.get('/reports/cycles', { params });
  return res.data;
};

export const getEmployeeReport = async (employeeId, params = {}) => {
  const res = await apiClient.get(`/reports/employee/${employeeId}`, { params });
  return res.data;
};

export const getStaffPerformanceReport = async (params = {}) => {
  const res = await apiClient.get('/reports/staff-performance', { params });
  return res.data;
};
