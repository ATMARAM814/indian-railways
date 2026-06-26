import React from 'react';
import QuestionReviewCard from './QuestionReviewCard';
import { ClipboardList } from 'lucide-react';

const QuestionReviewList = ({ questions }) => {
  if (!questions || questions.length === 0) return null;

  const correct   = questions.filter(q => q.is_correct).length;
  const incorrect = questions.filter(q => !q.is_correct && q.selected_answer != null).length;
  const skipped   = questions.filter(q => q.selected_answer == null).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Section header directly on the page background matching screenshot 1 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #D7E3EF',
        paddingBottom: '16px',
        flexWrap: 'wrap',
        gap: '16px',
        width: '100%'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0B2341', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} style={{ color: '#1B365D' }} />
            Complete Assessment Question Review
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Below is the detailed response evaluation for all {questions.length} compulsory questions. Correct responses are highlighted in green; incorrect choices are highlighted in red.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {correct} Correct
          </span>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {incorrect} Incorrect
          </span>
          {skipped > 0 && (
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {skipped} Skipped
            </span>
          )}
        </div>
      </div>

      {/* Standalone Question Cards listed directly on the page background */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {questions.map((q, idx) => (
          <QuestionReviewCard key={q.question_id} question={q} index={idx} />
        ))}
      </div>
    </div>
  );
};

export default QuestionReviewList;
