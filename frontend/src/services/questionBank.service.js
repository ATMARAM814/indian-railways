import apiClient from '../api/apiClient';

export const uploadQuestionSet = async (formData) => {
  const res = await apiClient.post('/admin/question-bank/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getUploadHistory = async (page = 1, limit = 10) => {
  const res = await apiClient.get('/admin/question-bank/upload-history', {
    params: { page, limit },
  });
  return res.data;
};

export const getQuestionBankStats = async () => {
  const res = await apiClient.get('/admin/question-bank/stats');
  return res.data;
};

export const downloadExcelTemplate = async () => {
  const res = await apiClient.get('/admin/question-bank/templates/excel', {
    responseType: 'blob',
  });
  return res.data;
};

export const exportQuestionsExcel = async (roleCode) => {
  const res = await apiClient.get('/admin/question-bank/export', {
    params: { roleCode },
    responseType: 'blob',
  });
  return res.data;
};


export const getQuestionsList = async (filters = {}) => {
  const res = await apiClient.get('/question-bank', { params: filters });
  return res.data;
};

export const updateQuestion = async (id, data) => {
  const res = await apiClient.put(`/question-bank/${id}`, data);
  return res.data;
};

export const deleteQuestion = async (id) => {
  const res = await apiClient.delete(`/question-bank/${id}`);
  return res.data;
};
