import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMyAssessment } from '../../hooks/useMyAssessment';
import { useAuth } from '../../context/AuthContext';
import QuestionCard from '../../components/my-assessment/QuestionCard';
import QuestionPalette from '../../components/my-assessment/QuestionPalette';
import ExamNavigation from '../../components/my-assessment/ExamNavigation';
import ExitExamModal from '../../components/my-assessment/ExitExamModal';
import SubmitExamModal from '../../components/my-assessment/SubmitExamModal';
import { ShieldCheck } from 'lucide-react';
import '../../styles/my-assessment.css';

const McqExamPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();


  const {
    loading,
    error,
    activeAssessment,
    questions,
    answers,
    markedForReview,
    submitting,
    loadExamQuestions,
    saveAnswer,
    toggleReview,
    submitExam
  } = useMyAssessment();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadExamQuestions(assessmentId);
      setInitialized(true);
    };
    init();
  }, [assessmentId, loadExamQuestions]);

  const activeQuestion = useMemo(() => {
    return questions[currentIndex] || null;
  }, [questions, currentIndex]);

  const totalQuestions = questions.length;

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const currentQuestionAnswer = useMemo(() => {
    if (!activeQuestion) return null;
    return answers[activeQuestion.question_id] || null;
  }, [answers, activeQuestion]);

  const currentQuestionMarked = useMemo(() => {
    if (!activeQuestion) return false;
    return !!markedForReview[activeQuestion.question_id];
  }, [markedForReview, activeQuestion]);

  // Handlers
  const handleAnswerSelect = async (selectedOption) => {
    if (!activeQuestion) return;
    await saveAnswer(assessmentId, activeQuestion.question_id, selectedOption);
  };

  const handleToggleReview = async () => {
    if (!activeQuestion) return;
    await toggleReview(assessmentId, activeQuestion.question_id);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigate('/my-assessment');
  };

  const handleSubmitConfirm = async () => {
    const res = await submitExam(assessmentId);
    if (res.success) {
      setShowSubmitModal(false);
      navigate(`/my-assessment/${assessmentId}/success`);
    } else {
      alert(res.message || 'Error submitting assessment.');
    }
  };

  if (!initialized || (loading && totalQuestions === 0)) {
    return (
      <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Loading exam questions & answers database...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '32px' }} className="card">
          <h3 style={{ color: '#DC2626', fontWeight: 800, marginBottom: '12px', fontSize: '20px' }}>Access Prohibited or Load Error</h3>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/my-assessment')}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#FFFFFF',
              backgroundColor: '#0B2341',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '32px' }} className="card">
          <h3 style={{ color: '#DC2626', fontWeight: 800, marginBottom: '12px', fontSize: '20px' }}>No Exam Questions Scheduled</h3>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            This assessment has no questions configured. Please notify your supervisor to map active questions.
          </p>
          <button
            onClick={() => navigate('/my-assessment')}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#FFFFFF',
              backgroundColor: '#0B2341',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }


  const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const roleNameMap = {
    'PM': 'Pointsman',
    'SM': 'Station Master',
    'TM': 'Train Manager',
    'SS': 'SM Incharge',
    'TI': 'Traffic Inspector',
    'AOM': 'Assistant Operations Manager',
    'Shunting Master': 'Shunting Master',
    'SHUNTING MASTER': 'Shunting Master',
    'SHM': 'Shunting Master',
    'SMS': 'Station Master Supervisor'
  };

  const getFullRoleName = (code) => {
    return roleNameMap[code] || code || 'Pointsman';
  };

  const examTitle = `${getFullRoleName(activeAssessment?.assessed_role_code || user?.role)} CBT Competency Evaluation`.toUpperCase();
  const candidateName = activeAssessment?.assessed_name || user?.full_name || 'Candidate';
  const hrmsId = activeAssessment?.assessed_hrms_id || user?.hrms_id || '';
  const stationName = activeAssessment?.station_name || 'Nagpur Junction';
  const stationCode = activeAssessment?.station_code || 'NGP';

  return (
    <div className="exam-fullscreen-container">
      
      {/* 1. Custom Dark Header Bar */}
      <header className="exam-fullscreen-header">
        <div className="exam-fullscreen-title-container">
          <div className="exam-fullscreen-logo-badge">
            <ShieldCheck size={24} style={{ strokeWidth: 2.5 }} />
          </div>
          <div>
            <h1 className="exam-fullscreen-main-title">{examTitle}</h1>
            <p className="exam-fullscreen-subtitle">Official Railway Safety & Operational Assessment</p>
          </div>
        </div>

        <div className="exam-fullscreen-actions">
          <div className="exam-status-pill">
            <span className="exam-status-dot"></span>
            <span>STATUS: <strong className="status-highlight">Active Exam Session</strong></span>
          </div>
          <button className="btn-exit-exam" onClick={() => setShowExitModal(true)}>
            Exit Exam
          </button>
        </div>
      </header>

      {/* 2. Secondary Full-width Gray Meta-bar */}
      <div className="exam-meta-bar">
        <div className="exam-meta-left">
          <span>Candidate: <strong>{candidateName}</strong></span>
          <span className="meta-divider">|</span>
          <span>HRMS: <strong>{hrmsId}</strong></span>
          <span className="meta-divider">|</span>
          <span>Station: <strong>{stationName} ({stationCode})</strong></span>
        </div>
        
        <div className="exam-meta-right">
          <span>Progress: <strong>{answeredCount}/{totalQuestions} Answered</strong> ({pct}%)</span>
          <div className="exam-progress-bar-container">
            <div className="exam-progress-bar-fill" style={{ width: `${pct}%` }}></div>
            <div className="exam-progress-bar-dot" style={{ left: `calc(${pct}% - 5px)` }}></div>
          </div>
        </div>
      </div>

      {/* 3. Main Body Content */}
      <main className="exam-fullscreen-body">
        <div className="exam-layout-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Left Side: Exam card and navigation */}
          <div className="exam-main-panel">
            <QuestionCard
              question={activeQuestion}
              index={currentIndex}
              selectedAnswer={currentQuestionAnswer}
              onAnswerSelect={handleAnswerSelect}
              totalQuestions={totalQuestions}
              isMarkedForReview={currentQuestionMarked}
              onToggleReview={handleToggleReview}
            />

            <ExamNavigation
              currentIndex={currentIndex}
              totalQuestions={totalQuestions}
              answeredCount={answeredCount}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          </div>

          {/* Right Side: Sidebar card */}
          <div className="exam-sidebar-panel">
            <QuestionPalette
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              markedForReview={markedForReview}
              onQuestionSelect={(idx) => setCurrentIndex(idx)}
              activeAssessment={activeAssessment}
              onSubmit={() => setShowSubmitModal(true)}
              answeredCount={answeredCount}
              totalQuestions={totalQuestions}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ExitExamModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleExitConfirm}
      />

      <SubmitExamModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitConfirm}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        submitting={submitting}
      />
    </div>
  );
};

export default McqExamPage;
