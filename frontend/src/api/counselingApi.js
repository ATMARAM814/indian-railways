// counselingApi.js
import apiClient from './apiClient';

export const getCandidateCounselingData = async (profileId) => {
  const res = await apiClient.get(`/counseling/candidate/${profileId}`);
  return res.data;
};

export const saveCandidateCounselingData = async (data) => {
  const res = await apiClient.post('/counseling/save', data);
  return res.data;
};

export const activateCandidateRetest = async (profileId) => {
  const res = await apiClient.post('/counseling/activate-retest', { profileId });
  return res.data;
};
