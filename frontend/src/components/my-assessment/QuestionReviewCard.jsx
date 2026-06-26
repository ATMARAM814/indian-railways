import React from 'react';
import { HelpCircle, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';

const QuestionReviewCard = ({ question, index }) => {
  if (!question) return null;

  const isCorrect = !!question.is_correct;
  const hasAnswered = question.selected_answer !== null && question.selected_answer !== undefined;

  let statusBadge = 'Skipped (0 Marks)';
  let badgeStyle = { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB' };
  let cardBorderLeft = '4px solid #94A3B8'; // default skipped color

  if (hasAnswered) {
    if (isCorrect) {
      statusBadge = 'Correct (+4 Marks)';
      badgeStyle = { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' };
      cardBorderLeft = '4px solid #10B981';
    } else {
      statusBadge = 'Incorrect (0 Marks)';
      badgeStyle = { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' };
      cardBorderLeft = '4px solid #EF4444';
    }
  }

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d }
  ];

  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      borderLeft: cardBorderLeft,
      backgroundColor: '#FFFFFF',
      marginBottom: '20px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FAFBFD'
      }}>
        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          QUESTION {index + 1}
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '4px 12px',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          ...badgeStyle
        }}>
          {statusBadge}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          {question.question_text}
        </h4>

        {/* Options grid (2-column layout matching screenshot 5) */}
        <div className="review-options-grid">
          {options.map((opt) => {
            const isCorrectKey = opt.key === question.correct_answer;
            const isSelected = opt.key === question.selected_answer;

            let optStyle = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              transition: 'all 0.15s ease'
            };

            // Option Circle styles
            let circleStyle = {
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              flexShrink: 0
            };

            let rightBadgeText = null;

            if (isCorrectKey) {
              optStyle = {
                ...optStyle,
                border: '1px solid #10B981',
                backgroundColor: '#ECFDF5',
                color: '#15803D',
                fontWeight: 600
              };
              circleStyle = {
                ...circleStyle,
                backgroundColor: '#10B981',
                color: '#FFFFFF'
              };
              rightBadgeText = isSelected ? '✓ SELECTED' : '✓ CORRECT KEY';
            } else if (isSelected) {
              optStyle = {
                ...optStyle,
                border: '1px solid #EF4444',
                backgroundColor: '#FEF2F2',
                color: '#B91C1C',
                fontWeight: 600
              };
              circleStyle = {
                ...circleStyle,
                backgroundColor: '#EF4444',
                color: '#FFFFFF'
              };
              rightBadgeText = '✗ SELECTED';
            } else {
              optStyle = {
                ...optStyle,
                border: '1px solid #E2E8F0',
                backgroundColor: '#FAFCFF',
                color: '#475569',
                fontWeight: 500
              };
              circleStyle = {
                ...circleStyle,
                backgroundColor: '#E2E8F0',
                color: '#64748B'
              };
            }

            return (
              <div key={opt.key} style={optStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={circleStyle}>
                    {opt.key}
                  </div>
                  <span>{opt.text}</span>
                </div>
                {rightBadgeText && (
                  <span style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {rightBadgeText}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Operational Safety Explanation Banner */}
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          backgroundColor: '#FFFBEB',
          borderLeft: '4px solid #F59E0B',
          borderRadius: '4px 8px 8px 4px',
          fontSize: '13px',
          lineHeight: '1.55',
          color: '#78350F'
        }}>
          <div style={{ fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            <span>💡 Operational Safety Explanation:</span>
          </div>
          <p style={{ margin: 0, color: '#451A03' }}>
            {question.explanation || 'Safety-critical knowledge: Operating personnel must align shunting routes correctly to prevent collisions and comply with Station Working Rules (SWR).'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionReviewCard;
