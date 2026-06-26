import React from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

const ExamNavigation = ({
  currentIndex,
  totalQuestions,
  answeredCount,
  onPrevious,
  onNext
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const remaining = totalQuestions - answeredCount;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      gap: '12px',
      flexWrap: 'wrap',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '16px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={isFirst}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: '700',
          color: isFirst ? '#94A3B8' : '#475569',
          backgroundColor: isFirst ? '#F1F5F9' : '#EDF2F7',
          border: 'none',
          borderRadius: '8px',
          cursor: isFirst ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isFirst) e.currentTarget.style.backgroundColor = '#E2E8F0';
        }}
        onMouseLeave={(e) => {
          if (!isFirst) e.currentTarget.style.backgroundColor = '#EDF2F7';
        }}
      >
        <ArrowLeft size={16} />
        <span>Previous Question</span>
      </button>

      {/* Center Warning */}
      {remaining > 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13.5px',
          fontWeight: '700',
          color: '#EA580C'
        }}>
          <AlertTriangle size={16} style={{ fill: '#FEF3C7', stroke: '#EA580C' }} />
          <span>{remaining} questions remaining</span>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13.5px',
          fontWeight: '700',
          color: '#16A34A'
        }}>
          <span>✓ All questions answered</span>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={isLast}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: '700',
          color: isLast ? '#94A3B8' : '#475569',
          backgroundColor: '#FFFFFF',
          border: isLast ? '1.5px solid #E2E8F0' : '1.5px solid #CBD5E1',
          borderRadius: '8px',
          cursor: isLast ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isLast) {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#94A3B8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLast) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }
        }}
      >
        <span>Next Question</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default ExamNavigation;
