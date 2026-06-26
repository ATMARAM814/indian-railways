import { useState, useEffect, useCallback } from 'react';
import {
  getAssessmentRoleSummary,
  getAssessmentList,
  activateMCQExam,
  getYesNoQuestions,
  saveEvaluationDraft,
  submitFinalEvaluation,
  getAssessmentDetails,
  getEvaluationDraft,
  getAssessmentAnswers,
  deactivateMCQExam,
  cancelAssessment,
  getEmployeeHistory,
  getBulkEligibleStaff,
  createBulkAssessments,
} from '../services/assessment.service';
import { getStationsList } from '../services/workforce.service';

export const useAssessments = (roleCode) => {
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const [eligibleStaff, setEligibleStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);
  const [totalStaff, setTotalStaff] = useState(0);

  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);

  // Load stations dropdown
  useEffect(() => {
    const loadStations = async () => {
      setStationsLoading(true);
      try {
        const res = await getStationsList();
        if (res.success) {
          setStations(res.data);
        }
      } catch (err) {
        console.error('Failed to load stations', err);
      } finally {
        setStationsLoading(false);
      }
    };
    loadStations();
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await getAssessmentRoleSummary();
      if (res.success) {
        setStats(res.data);
      } else {
        setStatsError(res.message || 'Failed to fetch assessment stats');
      }
    } catch (err) {
      setStatsError(err.response?.data?.message || err.message || 'Error fetching stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchEligibleStaff = useCallback(async (filters = {}, page = 1, limit = 10) => {
    if (!roleCode) return;
    setStaffLoading(true);
    setStaffError(null);
    try {
      const res = await getAssessmentList(roleCode, { ...filters, page, limit });
      if (res.success) {
        setEligibleStaff(res.data);
        setTotalStaff(res.total || 0);
      } else {
        setStaffError(res.message || 'Failed to fetch eligible staff');
      }
    } catch (err) {
      setStaffError(err.response?.data?.message || err.message || 'Error fetching staff');
    } finally {
      setStaffLoading(false);
    }
  }, [roleCode]);

  const handleActivateExam = async (employeeId) => {
    try {
      const res = await activateMCQExam({ assessedUserId: employeeId, assessedRoleCode: roleCode });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to activate MCQ Exam' };
    }
  };

  const handleDeactivateExam = async (assessmentId) => {
    try {
      const res = await deactivateMCQExam(assessmentId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to deactivate MCQ Exam' };
    }
  };

  const handleScheduleAssessment = async (payload) => {
    try {
      const res = await activateMCQExam(payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to schedule assessment' };
    }
  };

  const handleCancelAssessment = async (assessmentId, reason) => {
    try {
      const res = await cancelAssessment(assessmentId, reason);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to cancel assessment' };
    }
  };

  const handleGetEmployeeHistory = useCallback(async (employeeId) => {
    try {
      const res = await getEmployeeHistory(employeeId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to fetch assessment history' };
    }
  }, []);

  const handleSaveDraft = async (assessmentId, answers, operationalDetails) => {
    try {
      const res = await saveEvaluationDraft(assessmentId, { answers, operationalDetails });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to save draft' };
    }
  };

  const handleSubmitFinal = async (assessmentId, answers, operationalDetails) => {
    try {
      const res = await submitFinalEvaluation(assessmentId, { answers, operationalDetails });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to submit final evaluation' };
    }
  };

  const handleGetDetails = async (assessmentId) => {
    try {
      const res = await getAssessmentDetails(assessmentId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to get details' };
    }
  };

  const handleGetDraft = async (assessmentId) => {
    try {
      const res = await getEvaluationDraft(assessmentId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to get draft' };
    }
  };

  const handleGetYesNoQuestions = async (role) => {
    try {
      const res = await getYesNoQuestions(role || roleCode);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to fetch questions' };
    }
  };

  const handleGetAnswers = async (assessmentId) => {
    try {
      const res = await getAssessmentAnswers(assessmentId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to get answers' };
    }
  };

  const handleGetBulkEligibleStaff = useCallback(async () => {
    try {
      const res = await getBulkEligibleStaff(roleCode);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to fetch bulk eligible staff' };
    }
  }, [roleCode]);

  const handleCreateBulkAssessments = async (payload) => {
    try {
      const res = await createBulkAssessments({ ...payload, roleCode });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to schedule bulk assessments' };
    }
  };

  return {
    stats,
    statsLoading,
    statsError,
    eligibleStaff,
    staffLoading,
    staffError,
    totalStaff,
    stations,
    stationsLoading,
    fetchStats,
    fetchEligibleStaff,
    handleActivateExam,
    handleDeactivateExam,
    handleScheduleAssessment,
    handleCancelAssessment,
    handleGetEmployeeHistory,
    handleSaveDraft,
    handleSubmitFinal,
    handleGetDetails,
    handleGetDraft,
    handleGetYesNoQuestions,
    handleGetAnswers,
    handleGetBulkEligibleStaff,
    handleCreateBulkAssessments,
  };
};
