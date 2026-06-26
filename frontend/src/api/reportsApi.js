// reportsApi.js
import apiClient from './apiClient';

export const getStationSummaryReport = async (params = {}) => {
  const res = await apiClient.get('/reports/station-summary', { params });
  return res.data;
};
