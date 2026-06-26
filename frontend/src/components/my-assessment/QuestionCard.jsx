import React from 'react';
import { Bookmark } from 'lucide-react';

const QuestionCard = ({
  question,
  index,
  selectedAnswer,
  onAnswerSelect,
  totalQuestions = 25,
  isMarkedForReview,
  onToggleReview
}) => {
  if (!question) return null;

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d }
  ];

  return (
    <div className="card" style={{ padding: '28px', border: '1px solid #E2E8F0', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.03)' }}>
      
      {/* Header Badge & Mark for Review Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{
          backgroundColor: '#FFF7ED',
          padding: '6px 16px',
          borderRadius: '50px',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '850',
            color: '#EA580C',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            COMPULSORY QUESTION {index + 1} OF {totalQuestions}
          </span>
        </div>

        {onToggleReview && (
          <button
            onClick={onToggleReview}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
              border: isMarkedForReview ? '1px solid #6B21A8' : '1px solid #D8B4FE',
              backgroundColor: isMarkedForReview ? '#6B21A8' : '#F3E8FF',
              color: isMarkedForReview ? '#FFFFFF' : '#6B21A8'
            }}
            onMouseEnter={(e) => {
              if (!isMarkedForReview) e.currentTarget.style.backgroundColor = '#E9D5FF';
              else e.currentTarget.style.backgroundColor = '#581C87';
            }}
            onMouseLeave={(e) => {
              if (!isMarkedForReview) e.currentTarget.style.backgroundColor = '#F3E8FF';
              else e.currentTarget.style.backgroundColor = '#6B21A8';
            }}
          >
            <Bookmark size={14} fill={isMarkedForReview ? '#FFFFFF' : 'none'} style={{ border: 'none' }} />
            <span>{isMarkedForReview ? 'Marked' : 'Mark for Review'}</span>
          </button>
        )}
      </div>

      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#0F172A',
        margin: '0 0 24px 0',
        lineHeight: 1.5,
        letterSpacing: '-0.3px'
      }}>
        {question.question_text}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt.key;
          return (
            <button
              key={opt.key}
              className={`exam-option-row ${isSelected ? 'selected' : ''}`}
              onClick={() => onAnswerSelect(opt.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {/* Custom Radio Button */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: isSelected ? '2px solid #EA580C' : '2px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: '#FFFFFF',
                marginRight: '12px'
              }}>
                {isSelected && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#EA580C'
                  }} />
                )}
              </div>

              {/* Option Letter */}
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: isSelected ? '#EA580C' : '#64748B',
                marginRight: '16px',
                display: 'inline-block',
                width: '12px',
                flexShrink: 0
              }}>
                {opt.key}
              </span>

              {/* Option Text */}
              <div style={{
                fontSize: '15px',
                fontWeight: '500',
                color: isSelected ? '#0F172A' : '#334155',
                lineHeight: 1.5
              }}>
                {opt.text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
