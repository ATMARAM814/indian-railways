import apiClient from '../api/apiClient';

export const getAssessmentRoleSummary = async () => {
  const res = await apiClient.get('/assessments/stats');
  return res.data;
};

export const getAssessmentList = async (roleCode, filters = {}) => {
  const res = await apiClient.get(`/assessments/eligible/${roleCode}`, { params: filters });
  return res.data;
};

export const activateMCQExam = async (payload) => {
  const res = await apiClient.post('/assessments', payload);
  return res.data;
};

export const getYesNoQuestions = async (roleCode) => {
  const res = await apiClient.get(`/assessments/questions/yes-no/${roleCode}`);
  return res.data;
};

export const saveEvaluationDraft = async (assessmentId, payload) => {
  const res = await apiClient.post(`/assessments/${assessmentId}/evaluation-draft`, payload);
  return res.data;
};

export const submitFinalEvaluation = async (assessmentId, payload) => {
  const res = await apiClient.post(`/assessments/${assessmentId}/evaluate`, payload);
  return res.data;
};

export const getAssessmentDetails = async (assessmentId) => {
  const res = await apiClient.get(`/assessments/${assessmentId}/result`);
  return res.data;
};

export const getEvaluationDraft = async (assessmentId) => {
  const res = await apiClient.get(`/assessments/${assessmentId}/evaluation-draft`);
  return res.data;
};

export const getAssessmentAnswers = async (assessmentId) => {
  const res = await apiClient.get(`/assessments/${assessmentId}/answers`);
  return res.data;
};

export const deactivateMCQExam = async (assessmentId) => {
  const res = await apiClient.delete(`/assessments/${assessmentId}`);
  return res.data;
};

export const cancelAssessment = async (assessmentId, reason) => {
  const res = await apiClient.post(`/assessments/${assessmentId}/cancel`, { reason });
  return res.data;
};

export const getEmployeeHistory = async (employeeId) => {
  const res = await apiClient.get(`/assessments/employee/${employeeId}/history`);
  return res.data;
};

export const getBulkEligibleStaff = async (roleCode) => {
  const res = await apiClient.get(`/assessments/bulk/eligible/${roleCode}`);
  return res.data;
};

export const createBulkAssessments = async (payload) => {
  const res = await apiClient.post('/assessments/bulk', payload);
  return res.data;
};

