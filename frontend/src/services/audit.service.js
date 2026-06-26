import apiClient from '../api/apiClient';

export const getAuditLogs = async (filters = {}) => {
  const res = await apiClient.get('/audit', { params: filters });
  return res.data;
};

export const getAuditSummary = async () => {
  const res = await apiClient.get('/audit/summary');
  return res.data;
};

export const getAuditLogDetails = async (id) => {
  const res = await apiClient.get(`/audit/${id}`);
  return res.data;
};

export const getCriticalAuditLogs = async (filters = {}) => {
  const res = await apiClient.get('/audit/critical', { params: filters });
  return res.data;
};
