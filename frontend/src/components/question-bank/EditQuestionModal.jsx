import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

const EditQuestionModal = ({
  isOpen,
  onClose,
  onSubmit,
  question = null
}) => {
  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.questionText || '',
        optionA: question.optionA || '',
        optionB: question.optionB || '',
        optionC: question.optionC || '',
        optionD: question.optionD || '',
        correctAnswer: question.correctAnswer || 'A',
        explanation: question.explanation || ''
      });
    }
  }, [question, isOpen]);

  if (!isOpen || !question) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Simple validation
    if (!formData.questionText.trim()) return setError('Question text is required');
    if (!formData.optionA.trim()) return setError('Option A is required');
    if (!formData.optionB.trim()) return setError('Option B is required');
    if (!formData.optionC.trim()) return setError('Option C is required');
    if (!formData.optionD.trim()) return setError('Option D is required');

    setSubmitting(true);
    const res = await onSubmit(question.id, {
      ...formData,
      roleCode: question.roleCode // Keep role code unchanged
    });
    setSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Failed to update question');
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
        maxWidth: '600px',
        border: '1px solid #D7E3EF',
        boxShadow: '0 20px 25px -5px rgba(11, 35, 65, 0.1), 0 10px 10px -5px rgba(11, 35, 65, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #EEF2F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            Edit Question Details
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#B91C1C',
                fontSize: '13.5px',
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {/* Question Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Question Text</label>
              <textarea
                name="questionText"
                value={formData.questionText}
                onChange={handleChange}
                rows={3}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D2D6DC',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Options A and B Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Option A</label>
                <input
                  type="text"
                  name="optionA"
                  value={formData.optionA}
                  onChange={handleChange}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D2D6DC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Option B</label>
                <input
                  type="text"
                  name="optionB"
                  value={formData.optionB}
                  onChange={handleChange}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D2D6DC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Options C and D Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Option C</label>
                <input
                  type="text"
                  name="optionC"
                  value={formData.optionC}
                  onChange={handleChange}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D2D6DC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Option D</label>
                <input
                  type="text"
                  name="optionD"
                  value={formData.optionD}
                  onChange={handleChange}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D2D6DC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Correct Answer Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Correct Answer Option</label>
              <select
                name="correctAnswer"
                value={formData.correctAnswer}
                onChange={handleChange}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D2D6DC',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>

            {/* Explanation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Explanation (Optional)</label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows={2}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D2D6DC',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

          </div>

          {/* Footer Buttons */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #EEF2F6',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#F8FAFC',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px'
          }}>
            <button
              type="button"
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
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#1B365D',
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
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditQuestionModal;
