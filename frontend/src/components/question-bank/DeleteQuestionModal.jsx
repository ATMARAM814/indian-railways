import React, { useState } from 'react';
import { X, AlertTriangle, Loader } from 'lucide-react';

const DeleteQuestionModal = ({
  isOpen,
  onClose,
  onSubmit,
  question = null
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !question) return null;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    const result = await onSubmit(question.id);
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Failed to delete question');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid #D7E3EF',
        boxShadow: '0 20px 25px -5px rgba(11, 35, 65, 0.1), 0 10px 10px -5px rgba(11, 35, 65, 0.04)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #EEF2F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#DC2626" />
            Delete Question
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#B91C1C',
              fontSize: '13.5px',
              fontWeight: 500,
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
            Are you sure you want to delete this question?
          </p>

          <div style={{
            margin: '16px 0',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13.5px',
            color: '#334155',
            fontStyle: 'italic',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            "{question.questionText}"
          </div>

          <p style={{
            margin: '16px 0 0 0',
            fontSize: '13px',
            color: '#B91C1C',
            backgroundColor: '#FEE2E2',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 500
          }}>
            Warning: This action is permanent. Deleting this question will remove it from the active evaluation pool and history records.
          </p>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            borderTop: '1px solid #EEF2F6',
            paddingTop: '20px'
          }}>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#DC2626',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Question'
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DeleteQuestionModal;
