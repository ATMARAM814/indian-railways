import apiClient from '../api/apiClient';

export const getPmeRefStatus = async () => {
  const res = await apiClient.get('/me/pme-ref-status');
  return res.data;
};

export const getEmployeePmeRefStatus = async (filters = {}) => {
  const res = await apiClient.get('/users/employee-pme-ref-status', { params: filters });
  return res.data;
};
