import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useMyAssessment } from '../../hooks/useMyAssessment';
import { ArrowLeft, Play, AlertCircle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import '../../styles/my-assessment.css';

const ExamConfirmPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  
  const {
    loading,
    error,
    activeAssessment,
    fetchLandingData,
    startExam
  } = useMyAssessment();

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  useEffect(() => {
    fetchLandingData();
  }, [fetchLandingData]);

  // If activeAssessment is loaded and doesn't match this id, load data
  const isMatch = activeAssessment && activeAssessment.id === assessmentId;

  const handleStartExam = async () => {
    setStarting(true);
    setStartError(null);
    const res = await startExam(assessmentId);
    setStarting(false);
    if (res.success) {
      navigate(`/my-assessment/${assessmentId}/exam`);
    } else {
      setStartError(res.message || 'Failed to start the examination.');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
          {/* Back Button */}
          <button
            className="btn-premium-secondary"
            onClick={() => navigate('/my-assessment')}
            style={{ marginBottom: '24px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to My Assessments</span>
          </button>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-sm)',
              color: '#991B1B',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {startError && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-sm)',
              color: '#991B1B',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {startError}
            </div>
          )}

          {loading && !isMatch ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="animate-pulse" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Loading assessment details...
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#FFF7ED',
                  color: 'var(--primary-orange)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={32} />
                </div>
                <div>
                  <span className="badge-role" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {activeAssessment?.assessed_role_code} Exam
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-navy)', margin: '4px 0 0 0' }}>
                    Online MCQ Assessment Instructions
                  </h2>
                </div>
              </div>

              {/* Assessment Quick Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-light)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Assigned Assessor
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '2px' }}>
                    {activeAssessment?.assessor_name || `Supervisor (${activeAssessment?.assessor_role_code})`}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Duration
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '2px' }}>
                    No Time Limit
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Questions
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '2px' }}>
                    25 MCQ Items
                  </div>
                </div>
              </div>

              {/* Instructions list */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '12px' }}>
                Standard Assessment Directives
              </h3>
              
              <ul style={{
                paddingLeft: '20px',
                margin: '0 0 24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                lineHeight: 1.6
              }}>
                <li>
                  <strong>25 MCQ Questions:</strong> Every question is multiple-choice and has four options (A, B, C, D). Only one option is correct.
                </li>
                <li>
                  <strong>Automatic Answers Saving:</strong> Your progress is synced to the cloud immediately when you click any option. You don't have to save manually.
                </li>
                <li>
                  <strong>Mid-Test Save & Exit:</strong> You can pause the exam at any time by clicking "Save & Exit" at the top of the test screen. You can resume later without losing your responses.
                </li>
                <li>
                  <strong>Submission Policy:</strong> You may submit the exam even if you leave some questions unanswered. Unanswered questions score 0 marks. Once you confirm final submission, answers are permanently locked.
                </li>
                <li>
                  <strong>Checklist Activation:</strong> Upon final exam submission, your scorecard practical evaluation stages (Phase 2 & Phase 3 Checklist) will unlock for your supervisor to complete.
                </li>
              </ul>

              {/* Warning box */}
              <div style={{
                display: 'flex',
                gap: '10px',
                padding: '14px 16px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 'var(--radius-md)',
                color: '#92400E',
                fontSize: '13.5px',
                marginBottom: '32px'
              }}>
                <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Anti-Cheat Notice:</strong> Close other browser tabs and ensure a stable connection before proceeding. Opening developer consoles or trying to inspect the answers list will violate the evaluation protocol.
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                  onClick={() => navigate('/my-assessment')}
                  disabled={starting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#475569',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExam}
                  disabled={starting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    backgroundColor: '#16A34A',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803D';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.35)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#16A34A';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>{starting ? 'Initializing...' : 'Confirm & Start Exam'}</span>
                  <Play size={16} fill="#FFFFFF" style={{ border: 'none' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExamConfirmPage;
