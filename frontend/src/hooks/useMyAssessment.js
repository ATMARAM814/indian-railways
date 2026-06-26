import { useState, useCallback } from 'react';
import * as service from '../services/myAssessment.service';

export const useMyAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Landing Page States
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    latestScore: 0,
    averageScore: 0,
    currentCategory: 'N/A'
  });

  // Exam Page States
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Scorecard States
  const [scorecardDetails, setScorecardDetails] = useState(null);
  const [questionsReview, setQuestionsReview] = useState([]);

  // Resolve Category letter from percentage score
  const resolveCategory = (percentage, alcoholicStatus) => {
    if (alcoholicStatus === 'Alcoholic') return 'D';
    const pct = parseFloat(percentage || 0);
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    return 'D';
  };

  const fetchLandingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeRes = await service.getActiveAssessment();
      const historyRes = await service.getMyAssessmentsHistory();
      
      const activeData = activeRes.success ? activeRes.data : null;
      const historyData = historyRes.success ? historyRes.data : [];
      
      setActiveAssessment(activeData);
      setHistory(historyData);
      
      // Calculate Stats based only on approved assessments
      const approvedHistory = historyData.filter(i => i.approval_status === 'approved');
      const total = approvedHistory.length;
      let latestScore = 0;
      let averageScore = 0;
      let currentCategory = 'N/A';
      
      if (total > 0) {
        latestScore = parseFloat(approvedHistory[0].percentage || 0);
        const totalPct = approvedHistory.reduce((acc, curr) => acc + parseFloat(curr.percentage || 0), 0);
        averageScore = parseFloat((totalPct / total).toFixed(1));
        currentCategory = resolveCategory(latestScore, approvedHistory[0].alcoholic_status);
      }
      
      setStats({
        total,
        latestScore,
        averageScore,
        currentCategory
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch assessment landing page details.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExamQuestions = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch specific assessment details to resolve candidate name, station, etc.
      try {
        const detailsRes = await service.getMyAssessmentResult(assessmentId);
        if (detailsRes.success && detailsRes.data && detailsRes.data.assessment) {
          setActiveAssessment(detailsRes.data.assessment);
        }
      } catch (detailsErr) {
        console.error('Failed to pre-fetch assessment details:', detailsErr);
      }

      const res = await service.getMyExamQuestions(assessmentId);
      if (res.success) {
        setQuestions(res.data);
        
        // Initialize local answers and marked states from DB
        const ansDict = {};
        const reviewDict = {};
        res.data.forEach((q) => {
          if (q.selected_answer !== null && q.selected_answer !== undefined) {
            ansDict[q.question_id] = q.selected_answer;
          }
          reviewDict[q.question_id] = !!q.is_marked_for_review;
        });
        setAnswers(ansDict);
        setMarkedForReview(reviewDict);
      } else {
        setError(res.message || 'Failed to fetch exam questions.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error loading exam questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const startExam = async (assessmentId) => {
    try {
      await service.startMyExam(assessmentId);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const saveAnswer = async (assessmentId, questionId, selectedAnswer) => {
    try {
      setAnswers((prev) => ({ ...prev, [questionId]: selectedAnswer }));
      const res = await service.saveCandidateAnswer(assessmentId, questionId, selectedAnswer);
      return { success: res.success };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const toggleReview = async (assessmentId, questionId) => {
    try {
      const nextVal = !markedForReview[questionId];
      setMarkedForReview((prev) => ({ ...prev, [questionId]: nextVal }));
      const res = await service.toggleMarkForReview(assessmentId, questionId, nextVal);
      return { success: res.success };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const submitExam = async (assessmentId) => {
    setSubmitting(true);
    try {
      const res = await service.submitMyExam(assessmentId);
      setSubmitting(false);
      return { success: res.success, data: res.data };
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const fetchScorecard = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.getMyAssessmentResult(assessmentId);
      if (res.success) {
        setScorecardDetails(res.data.assessment);
        setQuestionsReview(res.data.questionsReview);
      } else {
        setError(res.message || 'Failed to fetch scorecard details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error loading scorecard page data.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    activeAssessment,
    history,
    stats,
    questions,
    answers,
    markedForReview,
    submitting,
    scorecardDetails,
    questionsReview,
    fetchLandingData,
    loadExamQuestions,
    startExam,
    saveAnswer,
    toggleReview,
    submitExam,
    fetchScorecard,
    resolveCategory
  };
};
