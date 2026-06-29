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

export const getCounselingDirectory = async () => {
  const res = await apiClient.get('/counseling/directory');
  return res.data;
};

export const getCandidateCounselingHistory = async (profileId) => {
  const res = await apiClient.get(`/counseling/history/${profileId}`);
  return res.data;
};

export const getEligibleCandidatesForScheduling = async () => {
  const res = await apiClient.get('/counseling/schedule/eligible-candidates');
  return res.data;
};

export const scheduleCounseling = async (profileId) => {
  const res = await apiClient.post('/counseling/schedule', { profileId });
  return res.data;
};

export const getScheduledCounselingList = async () => {
  const res = await apiClient.get('/counseling/schedule/list');
  return res.data;
};

export const cancelScheduledCounseling = async (scheduleId) => {
  const res = await apiClient.post(`/counseling/schedule/cancel/${scheduleId}`);
  return res.data;
};

export const getRetestHistory = async () => {
  const res = await apiClient.get('/counseling/history-retests');
  return res.data;
};
