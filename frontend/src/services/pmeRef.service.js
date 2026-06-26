import apiClient from '../api/apiClient';

export const getPmeRefStatus = async () => {
  const res = await apiClient.get('/me/pme-ref-status');
  return res.data;
};
