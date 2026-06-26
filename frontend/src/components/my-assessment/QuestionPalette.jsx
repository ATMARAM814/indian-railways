import React from 'react';
import { useAuth } from '../../context/AuthContext';

const QuestionPalette = ({
  questions,
  currentIndex,
  answers,
  markedForReview,
  onQuestionSelect,
  activeAssessment,
  onSubmit,
  answeredCount,
  totalQuestions
}) => {
  const { user } = useAuth();
  const name = activeAssessment?.assessed_name || user?.full_name || 'Candidate';
  const hrmsId = activeAssessment?.assessed_hrms_id || user?.hrms_id || '';
  const initial = name.charAt(0).toUpperCase();

  const isComplete = answeredCount === totalQuestions;
  const remaining = totalQuestions - answeredCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Candidate Profile Details Card */}
      <div className="exam-candidate-card">
        <div className="exam-avatar-circle">
          {initial}
        </div>
        <h3 className="exam-candidate-name">{name}</h3>
        <p className="exam-candidate-id">HRMS ID: {hrmsId}</p>
      </div>

      {/* Question Palette Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
        <h4 style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 16px 0'
        }}>
          QUESTION PALETTE
        </h4>

        <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', margin: '8px 0 16px 0' }}>
          <div className="palette-grid" style={{ marginTop: 0 }}>
            {questions.map((q, idx) => {
              const qId = q.question_id;
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[qId] !== undefined && answers[qId] !== null;
              const isReview = !!markedForReview?.[qId];

              let btnClass = 'palette-btn';
              if (isCurrent) {
                btnClass += ' current';
              } else if (isReview) {
                btnClass += ' review';
                if (isAnswered) {
                  btnClass += ' answered';
                }
              } else if (isAnswered) {
                btnClass += ' answered';
              } else {
                btnClass += ' unanswered';
              }

              return (
                <button
                  key={qId}
                  className={btnClass}
                  onClick={() => onQuestionSelect(idx)}
                  title={`Go to Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Palette Legend */}
        <div className="legend-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="legend-item">
            <div className="legend-color answered" style={{ backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }} />
            <span style={{ fontWeight: 500 }}>Attempted</span>
          </div>
          <div className="legend-item">
            <div className="legend-color unanswered" style={{ backgroundColor: '#FEF9C3', borderColor: '#FDE047' }} />
            <span style={{ fontWeight: 500 }}>Unattempted</span>
          </div>
          <div className="legend-item">
            <div className="legend-color review" style={{ backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }} />
            <span style={{ fontWeight: 500 }}>Review Only</span>
          </div>
          <div className="legend-item">
            <div className="legend-color review answered" style={{ backgroundColor: '#FAE8FF', borderColor: '#F5D0FE', borderStyle: 'dashed' }} />
            <span style={{ fontWeight: 500 }}>Review & Ans.</span>
          </div>
          <div className="legend-item" style={{ gridColumn: 'span 2' }}>
            <div className="legend-color current" style={{ border: '1.5px solid #EA580C', backgroundColor: '#FFFFFF' }} />
            <span style={{ fontWeight: 500 }}>Current Focus</span>
          </div>
        </div>

        {/* Submit Examination Container */}
        <div className="exam-submit-btn-container">
          <button
            className={`btn-exam-submit ${isComplete ? 'active' : ''}`}
            onClick={onSubmit}
            disabled={!isComplete}
          >
            Submit Examination
          </button>
          
          <p style={{
            fontSize: '11px',
            color: isComplete ? '#16A34A' : '#EA580C',
            fontWeight: '600',
            textAlign: 'center',
            margin: '8px 0 0 0',
            lineHeight: 1.4
          }}>
            {isComplete 
              ? '✓ All questions answered. Ready to submit!'
              : `* All ${totalQuestions} questions must be answered before submission (${remaining} remaining)`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
