import apiClient from '../api/apiClient';

export const getMyAssessmentsHistory = async () => {
  const res = await apiClient.get('/my-assessments');
  return res.data;
};

export const getActiveAssessment = async () => {
  const res = await apiClient.get('/my-assessments/active');
  return res.data;
};

export const getMyAssessmentResult = async (assessmentId) => {
  const res = await apiClient.get(`/my-assessments/${assessmentId}`);
  return res.data;
};

export const getMyExamQuestions = async (assessmentId) => {
  const res = await apiClient.get(`/my-assessments/${assessmentId}/questions`);
  return res.data;
};

export const startMyExam = async (assessmentId) => {
  const res = await apiClient.post(`/my-assessments/${assessmentId}/start`);
  return res.data;
};

export const saveCandidateAnswer = async (assessmentId, questionId, selectedAnswer) => {
  const res = await apiClient.post(`/my-assessments/${assessmentId}/save-answer`, {
    questionId,
    selectedAnswer,
  });
  return res.data;
};

export const toggleMarkForReview = async (assessmentId, questionId, isMarkedForReview) => {
  const res = await apiClient.post(`/my-assessments/${assessmentId}/mark-review`, {
    questionId,
    isMarkedForReview,
  });
  return res.data;
};

export const submitMyExam = async (assessmentId) => {
  const res = await apiClient.post(`/my-assessments/${assessmentId}/submit`);
  return res.data;
};
