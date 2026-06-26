import React from 'react';
import { Save, CheckCircle } from 'lucide-react';

export const AssessmentScoreSummary = ({
  mcqScore = 0,
  checklistScore = 0,
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
  alcoholicStatus = ''
}) => {
  const isCompleted = readOnly || assessment?.status === 'completed';

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

  let categoryCode = 'D';
  let categoryName = 'Category D (High Risk)';
  let categoryClass = 'cat-d';

  if (activeAlcoholicStatus === 'Alcoholic') {
    categoryCode = 'D';
    categoryName = 'Category D (High Risk)';
    categoryClass = 'cat-d';
  } else {
    if (percentage >= 80) {
      categoryCode = 'A';
      categoryName = 'Category A (Low Risk)';
      categoryClass = 'cat-a';
    } else if (percentage >= 70) {
      categoryCode = 'B';
      categoryName = 'Category B (Medium Risk)';
      categoryClass = 'cat-b';
    } else if (percentage >= 60) {
      categoryCode = 'C';
      categoryName = 'Category C (Medium Risk)';
      categoryClass = 'cat-c';
    }
  }

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
      {isApproved && (
        <div className="score-summary-grid">
          <div className="score-tally-block">
            <div className="score-circle-wrapper">
              <svg className="score-svg" viewBox="0 0 100 100">
                <circle className="score-circle-bg" cx="50" cy="50" r="45" />
                <circle 
                  className={`score-circle-fill ${categoryClass}`} 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  style={{ strokeDasharray: `${2 * Math.PI * 45}`, strokeDashoffset: `${2 * Math.PI * 45 * (1 - percentage / 100)}` }}
                />
              </svg>
              <div className="score-number-display">
                <span className="num">{totalScore}</span>
                <span className="lbl">Total Marks</span>
              </div>
            </div>

            <div className="tally-breakdown">
              <div className="bd-item">
                <span className="bd-label">MCQ Mark (Phase 1)</span>
                <span className="bd-value">{parsedMcqScore} / 25</span>
              </div>
              <div className="bd-item">
                <span className="bd-label">Checklist Mark (Phase 2)</span>
                <span className="bd-value">{displayChecklistScore} / 75</span>
              </div>
              <div className="bd-item border-t border-slate-200 pt-2 mt-2">
                <span className="bd-label font-bold text-slate-700">Overall Score</span>
                <span className="bd-value font-bold text-slate-900">{percentage}%</span>
              </div>
            </div>
          </div>

          <div className="category-projector-block">
            <h4 className="proj-title">Projected Safety Category</h4>
            <div className={`projected-category-badge ${categoryClass}`}>
              Category {categoryCode}
            </div>
            <p className="proj-description">
              Grading thresholds: Category A (≥80%), Category B (70-79%), Category C (60-69%), Category D (&lt;60%).
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

      {!readOnly && (
        <div className="form-action-buttons">
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
            >
              <Save size={16} />
              <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={onSubmitFinal}
              className="btn-primary"
              disabled={savingDraft || submitting}
            >
              <CheckCircle size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Evaluation'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
