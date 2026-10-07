import React from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

export const AssessmentScoreSummary = ({
  mcqScore = 0,
  checklistScore = 0,
  alertnessScore = null,
  onSaveDraft,
  onSubmitFinal,
  onCancel,
  onReset,
  savingDraft = false,
  submitting = false,
  readOnly = false,
  approvalStatus,
  approvalRemark,
  assessment = null,
  alcoholicStatus = '',
  pmeStatus = '',
  isFormSubmittable = false,
  submittableValidationMsg = '',
  allMarksFilled = false,
  answeredCount = 0,
  totalQuestionsCount = 0,
  feedback = null
}) => {
  const isCompleted = readOnly || assessment?.status === 'completed';
  const marksReady = isCompleted || allMarksFilled;

  const parsedMcqScore = isCompleted && assessment?.mcq_score !== undefined && assessment?.mcq_score !== null
    ? Number(assessment.mcq_score)
    : Number(mcqScore || 0);

  const displayChecklistScore = isCompleted && assessment?.evaluation_score !== undefined && assessment?.evaluation_score !== null
    ? Number(assessment.evaluation_score)
    : checklistScore;

  const totalScore = isCompleted && assessment?.total_score !== undefined && assessment?.total_score !== null
    ? Number(assessment.total_score)
    : (parsedMcqScore + displayChecklistScore);

  const percentage = isCompleted && assessment?.percentage !== undefined && assessment?.percentage !== null
    ? Number(assessment.percentage)
    : (parsedMcqScore + displayChecklistScore); // since max is 100

  const activeAlcoholicStatus = alcoholicStatus || assessment?.alcoholic_status || '';
  const activePmeStatus = pmeStatus || assessment?.pme_status || '';
  const isPmeUnfit = (activePmeStatus || '').toLowerCase() === 'unfit';

  const parsedAlertnessScore = isCompleted && assessment?.alertness_score !== undefined && assessment?.alertness_score !== null
    ? Number(assessment.alertness_score)
    : (alertnessScore !== null && alertnessScore !== undefined
        ? Number(alertnessScore)
        : Number(assessment?.alertness_score || 0));

  let categoryCode = 'D';
  let categoryName = 'Category D (High Risk)';
  let categoryClass = 'cat-d';

  if (!marksReady) {
    categoryCode = 'PENDING';
    categoryName = 'Pending Evaluation';
    categoryClass = 'cat-pending';
  } else if (isPmeUnfit) {
    categoryCode = 'PENDING';
    categoryName = 'Pending (PME Unfit)';
    categoryClass = 'cat-pending';
  } else if (activeAlcoholicStatus === 'Alcoholic' || percentage <= 25) {
    categoryCode = 'D';
    categoryName = 'Category D (High Risk)';
    categoryClass = 'cat-d';
  } else if (parsedMcqScore < 15 || parsedAlertnessScore < 15) {
    categoryCode = 'C';
    categoryName = 'Category C (Medium Risk)';
    categoryClass = 'cat-c';
  } else {
    if (percentage >= 80) {
      categoryCode = 'A';
      categoryName = 'Category A (Low Risk)';
      categoryClass = 'cat-a';
    } else if (percentage >= 50) {
      categoryCode = 'B';
      categoryName = 'Category B (Medium Risk)';
      categoryClass = 'cat-b';
    } else if (percentage >= 26) {
      categoryCode = 'C';
      categoryName = 'Category C (Medium Risk)';
      categoryClass = 'cat-c';
    } else {
      categoryCode = 'D';
      categoryName = 'Category D (High Risk)';
      categoryClass = 'cat-d';
    }
  }

  const getCategoryInsight = () => {
    if (!marksReady) {
      return 'Projected safety category and complete metrics will be calculated once all checklist questions and Phase 1 Knowledge marks (0-25) are filled.';
    }
    if (isPmeUnfit) {
      return 'Candidate is designated as PME Unfit. In accordance with railway safety standards, no safety category is assigned and evaluation status remains locked as PENDING until medically cleared as Fit.';
    }
    if (activeAlcoholicStatus === 'Alcoholic') {
      return 'Flagged under Railway Safety Protocols due to Alcoholic status. Mandatory safety counseling and re-evaluation required.';
    }
    if (parsedMcqScore < 15 && parsedAlertnessScore < 15) {
      return 'Both Knowledge test and Alertness scores are below qualifying thresholds (<15/25). Targeted counseling and safety monitoring required.';
    }
    if (parsedMcqScore < 15) {
      return 'Knowledge test score is below qualifying threshold (15/25). Targeted technical rules counseling recommended.';
    }
    if (parsedAlertnessScore < 15) {
      return 'Alertness competency score is below qualifying threshold (15/25). Practical vigilance monitoring recommended.';
    }
    switch (categoryCode) {
      case 'A':
        return 'Demonstrates high operational competency and exemplary safety compliance across all evaluated areas.';
      case 'B':
        return 'Meets standard railway operational safety benchmarks with regular periodic review.';
      case 'C':
        return 'Safety attention required. Overall score requires targeted counseling and performance monitoring.';
      case 'D':
        return 'Critical safety concern. Mandatory corrective safety training and counseling required before sign-off.';
      default:
        return 'Safety category projected based on overall score and individual competency cutoffs.';
    }
  };

  const isApproved = approvalStatus === 'approved';

  if (!isApproved && readOnly) {
    return (
      <div className="score-summary-card" style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontFamily: 'Poppins, Inter, sans-serif', fontSize: '14px' }}>
          This evaluation has been submitted and is currently awaiting approval. Scorecard metrics will be generated once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="score-summary-card">
      {(isApproved || !readOnly) && (
        <div className="score-summary-grid">
          <div className="score-tally-block">
            <div className="score-circle-wrapper">
              <svg className="score-svg" viewBox="0 0 100 100">
                <circle className="score-circle-bg" cx="50" cy="50" r="45" />
                <circle 
                  className={`score-circle-fill ${marksReady ? categoryClass : 'cat-pending'}`} 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  style={{ 
                    strokeDasharray: `${2 * Math.PI * 45}`, 
                    strokeDashoffset: marksReady ? `${2 * Math.PI * 45 * (1 - percentage / 100)}` : `${2 * Math.PI * 45}` 
                  }}
                />
              </svg>
              <div className="score-number-display">
                <span className="num">{marksReady ? totalScore : '--'}</span>
                <span className="lbl">{marksReady ? 'Total Marks' : 'In Progress'}</span>
              </div>
            </div>

            <div className="tally-breakdown">
              <div className="bd-item">
                <span className="bd-label">MCQ Mark (Phase 1)</span>
                <span className="bd-value">
                  {parsedMcqScore !== null && !isNaN(parsedMcqScore) && parsedMcqScore !== '' ? `${parsedMcqScore} / 25` : '-- / 25'}
                </span>
              </div>
              <div className="bd-item">
                <span className="bd-label">Checklist Mark (Phase 2)</span>
                <span className="bd-value">
                  {marksReady ? `${displayChecklistScore} / 75` : `${answeredCount} / ${totalQuestionsCount} Answered`}
                </span>
              </div>
              <div className="bd-item border-t border-slate-200 pt-2 mt-2">
                <span className="bd-label font-bold text-slate-700">Overall Score</span>
                <span className="bd-value font-bold text-slate-900">{marksReady ? `${percentage}%` : '--%'}</span>
              </div>
            </div>
          </div>

          <div className="category-projector-block">
            <h4 className="proj-title">Projected Safety Category</h4>
            {!marksReady ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '0.3px'
                }}
              >
                EVALUATION IN PROGRESS
              </div>
            ) : isPmeUnfit ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '0.3px'
                }}
              >
                <AlertCircle size={18} color="#D97706" />
                PENDING (PME UNFIT)
              </div>
            ) : (
              <div className={`projected-category-badge ${categoryClass}`}>
                Category {categoryCode}
              </div>
            )}
            <p className="proj-description" style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, marginTop: '8px' }}>
              {getCategoryInsight()}
            </p>

            {readOnly && approvalStatus && (
              <div className="approval-remark-block mt-4 border-t border-slate-200 pt-3">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Approval Comments</span>
                <p className="text-sm text-slate-700 italic">
                  "{approvalRemark || 'No approval comments entered.'}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!readOnly && feedback && feedback.type === 'error' && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '10px',
          padding: '12px 16px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#991B1B',
          fontSize: '13.5px',
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
        }}>
          <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <span style={{ display: 'block', fontWeight: 700, color: '#B91C1C' }}>Evaluation Incomplete</span>
            <span style={{ fontWeight: 500, color: '#7F1D1D' }}>{feedback.message}</span>
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="form-action-buttons" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
          {!isFormSubmittable && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              fontSize: '12.5px',
              color: '#92400E',
              fontWeight: 500
            }}>
              <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
              <span>
                <strong>Submit Button Inactive:</strong> {submittableValidationMsg || "Complete all checklist marks, Knowledge MCQ score (0-25), Alcoholic status, and ensure PME status is 'Fit' to submit."}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="form-action-left">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                disabled={savingDraft || submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onReset}
                className="btn-secondary btn-restart"
                disabled={savingDraft || submitting}
              >
                Restart Form
              </button>
            </div>
            
            <div className="form-action-right">
              <button
                type="button"
                onClick={onSaveDraft}
                className="btn-info"
                disabled={savingDraft || submitting}
                title="Save current progress as draft"
              >
                <Save size={16} />
                <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={onSubmitFinal}
                className="btn-primary"
                disabled={!isFormSubmittable || savingDraft || submitting}
                style={{
                  opacity: !isFormSubmittable ? 0.5 : 1,
                  cursor: !isFormSubmittable ? 'not-allowed' : 'pointer',
                  filter: !isFormSubmittable ? 'grayscale(30%)' : 'none'
                }}
                title={!isFormSubmittable ? submittableValidationMsg : "Submit finalized evaluation for approval"}
              >
                <CheckCircle size={16} />
                <span>{submitting ? 'Submitting...' : 'Submit Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
