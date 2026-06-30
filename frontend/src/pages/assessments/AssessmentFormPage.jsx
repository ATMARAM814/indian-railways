import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessments } from '../../hooks/useAssessments';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AssessmentEmployeeSummary } from '../../components/assessments/AssessmentEmployeeSummary';
import { AssessmentMcqSection } from '../../components/assessments/AssessmentMcqSection';
import { AssessmentYesNoSection } from '../../components/assessments/AssessmentYesNoSection';
import { AssessmentOperationalDetails } from '../../components/assessments/AssessmentOperationalDetails';
import { AssessmentScoreSummary } from '../../components/assessments/AssessmentScoreSummary';
import { FormSkeleton } from '../../components/assessments/AssessmentSkeletons';
import { ArrowLeft, CheckCircle2, AlertCircle, X, ClipboardCheck, Activity } from 'lucide-react';
import '../../styles/assessments.css';

const AssessmentFormPage = () => {
  const { roleCode, assessmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isViewMode = window.location.pathname.includes('/view');
  const [searchParams] = useSearchParams();
  const fromSource = searchParams.get('from');

  const {
    handleGetDetails,
    handleGetYesNoQuestions,
    handleGetDraft,
    handleGetAnswers,
    handleSaveDraft,
    handleSubmitFinal,
  } = useAssessments(roleCode);

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [assessmentResult, setAssessmentResult] = useState(null);
  const [yesNoQuestions, setYesNoQuestions] = useState([]);
  const [mcqScore, setMcqScore] = useState(0);

  // Form states
  const [answers, setAnswers] = useState({});
  const [operationalDetails, setOperationalDetails] = useState({
    pmeStatus: '',
    refStatus: '',
    counsellingRequired: false,
    trainingRequired: false,
    counsellingStatus: '',
    trainingStatus: '',
    alcoholicStatus: '',
    safetyConcernStatus: '',
    remarksForApprover: ''
  });

  const isReadOnly = isViewMode || assessmentResult?.approval_status === 'approved';

  useEffect(() => {
    const loadFormInfo = async () => {
      setLoading(true);
      try {
        const detailsRes = await handleGetDetails(assessmentId);
        if (detailsRes.success) {
          setAssessmentResult(detailsRes.data);
          setMcqScore(detailsRes.data.mcq_score || 0);

          // Populate operational details
          setOperationalDetails({
            pmeStatus: detailsRes.data.pme_status || '',
            refStatus: detailsRes.data.ref_status || '',
            counsellingRequired: !!detailsRes.data.counselling_required,
            trainingRequired: !!detailsRes.data.training_required,
            counsellingStatus: detailsRes.data.counselling_status || '',
            trainingStatus: detailsRes.data.training_status || '',
            alcoholicStatus: detailsRes.data.alcoholic_status || '',
            safetyConcernStatus: detailsRes.data.safety_concern_status || '',
            remarksForApprover: detailsRes.data.remarks_for_approver || ''
          });

          // Fetch Yes/No questions
          const questionsRes = await handleGetYesNoQuestions(detailsRes.data.assessed_role_code);
          if (questionsRes.success) {
            setYesNoQuestions(questionsRes.data);

            if (isViewMode || detailsRes.data.status === 'completed') {
              // Read-only or completed mode - fetch submitted answers
              const answersRes = await handleGetAnswers(assessmentId);
              if (answersRes.success) {
                const ansDict = {};
                answersRes.data.forEach((a) => {
                  ansDict[a.question_id] = a.answer;
                });
                setAnswers(ansDict);
              }
            } else {
              // Edit/Conduct mode - fetch draft answers if exists
              const draftRes = await handleGetDraft(assessmentId);
              if (draftRes.success && draftRes.data.length > 0) {
                const ansDict = {};
                draftRes.data.forEach((d) => {
                  ansDict[d.question_id] = d.answer;
                });
                setAnswers(ansDict);
              }
            }
          }
        } else {
          setFeedback({ type: 'error', message: detailsRes.message || 'Failed to fetch assessment details.' });
        }
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', message: 'An error occurred while loading assessment form data.' });
      } finally {
        setLoading(false);
      }
    };

    if (user && assessmentId) {
      loadFormInfo();
    }
  }, [user, assessmentId, isViewMode]);

  if (!user) return <Navigate to="/login" replace />;

  const handleAnswerChange = (questionId, sectionCode, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleOperationalChange = (name, value) => {
    setOperationalDetails((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetChecklist = () => {
    if (window.confirm("Are you sure you want to restart the form filling? This will clear all checklist answers.")) {
      setAnswers({});
    }
  };

  const calculateChecklistScore = () => {
    let score = 0;
    yesNoQuestions.forEach((q) => {
      if (answers[q.question_id] === true) {
        score += q.marks_per_question || 0;
      }
    });
    return score;
  };

  const onSave = async () => {
    setFeedback(null);
    setSavingDraft(true);

    const answersPayload = yesNoQuestions.map((q) => {
      const answerVal = answers[q.question_id];
      const marksAwarded = answerVal === true ? q.marks_per_question : 0;
      return {
        questionId: q.question_id,
        sectionCode: q.section_code,
        answer: answerVal === undefined ? null : answerVal,
        marksAwarded
      };
    });

    const res = await handleSaveDraft(assessmentId, answersPayload, { ...operationalDetails, mcqScore });
    if (res.success) {
      setFeedback({ type: 'success', message: 'Evaluation draft progress saved successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to save draft.' });
    }
    setSavingDraft(false);
  };

  const onSubmit = async () => {
    setFeedback(null);

    // Validate that all questions are answered
    const unanswered = yesNoQuestions.some((q) => answers[q.question_id] === undefined);
    if (unanswered) {
      setFeedback({
        type: 'error',
        message: 'All Yes/No checklist questions must be answered before submitting evaluation.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate mandatory Phase 3 fields
    if (mcqScore === '' || mcqScore === null || mcqScore === undefined || isNaN(mcqScore)) {
      setFeedback({
        type: 'error',
        message: 'Knowledge Marks (MCQ Test) is mandatory and must be entered before submitting evaluation.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!operationalDetails.alcoholicStatus) {
      setFeedback({
        type: 'error',
        message: 'Alcoholic Status is mandatory and must be selected before submitting evaluation.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    const answersPayload = yesNoQuestions.map((q) => {
      const answerVal = answers[q.question_id];
      return {
        questionId: q.question_id,
        answer: answerVal === true
      };
    });

    const res = await handleSubmitFinal(assessmentId, answersPayload, { ...operationalDetails, mcqScore });
    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Evaluation submitted successfully! Scoped manager will review safety categories.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate(`/assessments/${roleCode}`);
      }, 2000);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to submit evaluation.' });
    }
    setSubmitting(false);
  };

  const checklistScore = calculateChecklistScore();

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {
              if (fromSource === 'counseling') {
                navigate('/counseling');
              } else if (assessmentResult && assessmentResult.assessed_user_id) {
                navigate(`/assessments/${roleCode}/${assessmentResult.assessed_user_id}/history`);
              } else {
                navigate(`/assessments/${roleCode}`);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EFF6FF';
              e.currentTarget.style.borderColor = '#BFDBFE';
              e.currentTarget.style.color = '#2B5CE6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#475569';
            }}
            title="Back to Directory"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
              {isViewMode ? 'Safety Evaluation Sheet' : 'Conduct Safety Evaluation'}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              {isViewMode 
                ? 'Read-only archived evaluation log.' 
                : 'Fill yes/no performance metrics and set operational indicators.'}
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 rounded-lg flex items-start justify-between border ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-rose-600" />}
              <span className="text-sm font-medium">{feedback.message}</span>
            </div>
            <button 
              onClick={() => setFeedback(null)} 
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#334155'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <FormSkeleton />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header summary cards */}
            <AssessmentEmployeeSummary result={assessmentResult} />

            {/* MCQ Results */}
            <AssessmentMcqSection mcqScore={mcqScore} />

            {/* Yes No checklist */}
            {assessmentResult?.status === 'created' ? (
              <div className="yes-no-evaluation-section locked-section" style={{
                background: '#FFFFFF',
                border: '1px dashed #CBD5E1',
                borderRadius: '16px',
                padding: '24px',
                opacity: 0.85
              }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <ClipboardCheck size={18} style={{ color: '#64748B' }} />
                  <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0B2341', margin: 0 }}>
                    Phase 2: Yes/No Evaluation Checklist (75 Marks)
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px 30px' }}>
                  Fill yes/no performance metrics across critical safety parameters.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 0 0 30px',
                  padding: '8px 12px',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  color: '#B45309',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <span className="pulse-indicator" style={{ backgroundColor: '#D97706', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                  This section will unlock when the candidate completes their MCQ exam.
                </div>
              </div>
            ) : (
              <AssessmentYesNoSection
                questions={yesNoQuestions}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                readOnly={isReadOnly}
              />
            )}

            {/* Operational details */}
            {assessmentResult?.status === 'created' ? (
              <div className="operational-details-section locked-section" style={{
                background: '#FFFFFF',
                border: '1px dashed #CBD5E1',
                borderRadius: '16px',
                padding: '24px',
                opacity: 0.85
              }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Activity size={18} style={{ color: '#64748B' }} />
                  <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0B2341', margin: 0 }}>
                    Phase 3: Additional Operational & Safety Details (25 Marks)
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px 30px' }}>
                  Operational status indicators and feedback remarks.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 0 0 30px',
                  padding: '8px 12px',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  color: '#B45309',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <span className="pulse-indicator" style={{ backgroundColor: '#D97706', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                  This section will unlock when the candidate completes their MCQ exam.
                </div>
              </div>
            ) : (
              <AssessmentOperationalDetails
                details={operationalDetails}
                onChange={handleOperationalChange}
                readOnly={isReadOnly}
                assessorRole={assessmentResult?.assessor_role_code}
                mcqScore={mcqScore}
                onMcqScoreChange={(score) => setMcqScore(score)}
              />
            )}

            {/* Overall totals and scorecard */}
            {assessmentResult?.status !== 'created' && (
              <AssessmentScoreSummary
                mcqScore={mcqScore}
                checklistScore={checklistScore}
                onSaveDraft={onSave}
                onSubmitFinal={onSubmit}
                onCancel={() => {
                  if (fromSource === 'counseling') {
                    navigate('/counseling');
                  } else if (assessmentResult && assessmentResult.assessed_user_id) {
                    navigate(`/assessments/${roleCode}/${assessmentResult.assessed_user_id}/history`);
                  } else {
                    navigate(`/assessments/${roleCode}`);
                  }
                }}
                onReset={handleResetChecklist}
                savingDraft={savingDraft}
                submitting={submitting}
                readOnly={isReadOnly}
                approvalStatus={assessmentResult?.approval_status}
                approvalRemark={assessmentResult?.approval_remark}
                assessment={assessmentResult}
                alcoholicStatus={operationalDetails.alcoholicStatus}
              />
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AssessmentFormPage;
