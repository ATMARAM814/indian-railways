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

export const getEligibleCandidatesForScheduling = async (params = {}) => {
  const res = await apiClient.get('/counseling/schedule/eligible-candidates', { params });
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

export const getCounselingSubjectsForRole = async (roleCode) => {
  const res = await apiClient.get(`/counseling/subjects/${roleCode}`);
  return res.data;
};

export const createCounselingSubject = async (subjectData) => {
  const res = await apiClient.post('/counseling/subjects', subjectData);
  return res.data;
};

export const updateCounselingSubject = async (subjectId, subjectData) => {
  const res = await apiClient.put(`/counseling/subjects/${subjectId}`, subjectData);
  return res.data;
};

export const deleteCounselingSubject = async (subjectId) => {
  const res = await apiClient.delete(`/counseling/subjects/${subjectId}`);
  return res.data;
};
