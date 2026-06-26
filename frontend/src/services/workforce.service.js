import apiClient from '../api/apiClient';

export const getWorkforceList = async (filters = {}) => {
  const res = await apiClient.get('/users', { params: filters });
  return res.data;
};

export const getWorkforceDetails = async (id) => {
  const res = await apiClient.get(`/users/${id}`);
  return res.data;
};

export const createWorkforceUser = async (data) => {
  const res = await apiClient.post('/users', data);
  return res.data;
};

export const updateWorkforceUser = async (id, data) => {
  const res = await apiClient.put(`/users/${id}`, data);
  return res.data;
};

export const transferWorkforceUser = async (id, data) => {
  const res = await apiClient.post(`/users/${id}/transfer`, data);
  return res.data;
};

export const activateWorkforceUser = async (id) => {
  const res = await apiClient.patch(`/users/${id}/activate`);
  return res.data;
};

export const deactivateWorkforceUser = async (id) => {
  const res = await apiClient.patch(`/users/${id}/deactivate`);
  return res.data;
};

export const getStationsList = async () => {
  const res = await apiClient.get('/stations');
  return res.data;
};

export const getDivisionsList = async () => {
  const res = await apiClient.get('/stations/divisions');
  return res.data;
};

export const getWorkforcePresence = async () => {
  const res = await apiClient.get('/users/workforce-presence');
  return res.data;
};

export const resetWorkforceUserPassword = async (id) => {
  const res = await apiClient.post(`/users/${id}/reset-password`);
  return res.data;
};

