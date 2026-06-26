import { useState, useCallback } from 'react';
import * as questionBankService from '../services/questionBank.service';

export const useQuestionBank = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [stats, setStats] = useState([]);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await questionBankService.getQuestionBankStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to fetch question bank stats.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error occurred while fetching stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await questionBankService.getUploadHistory(page, limit);
      if (res.success) {
        setHistory(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || 'Failed to fetch upload history.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error occurred while fetching history.');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadSet = useCallback(async (roleCode, file) => {
    setUploading(true);
    setError(null);
    setValidationErrors([]);
    
    try {
      const formData = new FormData();
      formData.append('role_code', roleCode);
      formData.append('file', file);

      const res = await questionBankService.uploadQuestionSet(formData);
      return res;
    } catch (err) {
      const data = err.response?.data;
      if (data && data.errors) {
        setValidationErrors(data.errors);
      } else {
        setError(data?.message || err.message || 'Upload failed due to a server error.');
      }
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const downloadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await questionBankService.downloadExcelTemplate();
      const filename = 'questions_template.xlsx';
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Template download failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    uploading,
    error,
    validationErrors,
    stats,
    history,
    pagination,
    fetchStats,
    fetchHistory,
    uploadSet,
    downloadTemplate,
  };
};
