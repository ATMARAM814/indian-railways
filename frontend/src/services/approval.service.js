import apiClient from '../api/apiClient';

export const getPendingApprovals = async () => {
  const res = await apiClient.get('/approvals/pending');
  return res.data;
};

export const approveAssessment = async (assessmentId, approvalRemark) => {
  const res = await apiClient.post(`/approvals/${assessmentId}/approve`, { approvalRemark });
  return res.data;
};

export const rejectAssessment = async (assessmentId, rejectionReason) => {
  const res = await apiClient.post(`/approvals/${assessmentId}/reject`, { rejectionReason });
  return res.data;
};

export const modifyAssessment = async (assessmentId, scores, modificationRemark) => {
  const res = await apiClient.post(`/approvals/${assessmentId}/modify`, { scores, modificationRemark });
  return res.data;
};

export const getApprovalHistory = async (filters = {}) => {
  const res = await apiClient.get('/reports/approval-status', { params: filters });
  return res.data;
};
