import React from 'react';
import { CheckSquare, AlertTriangle } from 'lucide-react';

const SubmitExamModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  submitting
}) => {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;
  const isComplete = unansweredCount === 0;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-container" style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '480px',
        width: '90%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          color: isComplete ? '#16A34A' : '#EA580C'
        }}>
          {isComplete ? <CheckSquare size={28} /> : <AlertTriangle size={28} />}
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            {isComplete ? 'Submit Assessment?' : 'Submit with Unanswered Questions?'}
          </h3>
        </div>

        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          <p style={{ marginBottom: '12px' }}>
            You are about to submit your MCQ examination. Once submitted, your answers will be locked and you cannot change them.
          </p>

          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-light)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Total Questions:</span>
              <strong style={{ color: 'var(--primary-navy)' }}>{totalQuestions}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Answered:</span>
              <strong style={{ color: '#16A34A' }}>{answeredCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Unanswered:</span>
              <strong style={{ color: unansweredCount > 0 ? '#EF4444' : '#16A34A' }}>{unansweredCount}</strong>
            </div>
          </div>

          {!isComplete && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-sm)',
              color: '#991B1B',
              fontSize: '13px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Warning:</strong> You have {unansweredCount} unanswered question(s). These will receive 0 marks.
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-premium-secondary" onClick={onClose} disabled={submitting}>
            Go Back
          </button>
          <button
            className="btn-premium-primary"
            onClick={onConfirm}
            disabled={submitting}
            style={{
              backgroundColor: '#16A34A',
              borderColor: '#16A34A'
            }}
          >
            {submitting ? 'Submitting...' : 'Confirm Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitExamModal;
