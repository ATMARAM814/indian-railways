import React from 'react';
import { ClipboardCheck, AlertCircle } from 'lucide-react';

const sectionNames = {
  ALERTNESS: 'Alertness & Vigilance',
  SAFETY_RECORD: 'Safety Record & Rules Compliance',
  LEADERSHIP: 'Leadership & Initiative',
  DISCIPLINE: 'Discipline & Attendance',
  APPEARANCE: 'Appearance & Turnout'
};

export const AssessmentYesNoSection = ({
  questions = [],
  answers = {},
  onAnswerChange,
  readOnly = false,
  unansweredIds = []
}) => {
  // Group questions by section
  const groupedQuestions = questions.reduce((acc, q) => {
    const sec = q.section_code;
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(q);
    return acc;
  }, {});

  // Calculate scores per section
  const getSectionScoreInfo = (sectionCode) => {
    const sectionQuestions = groupedQuestions[sectionCode] || [];
    let scored = 0;
    let total = 0;
    
    sectionQuestions.forEach((q) => {
      const marks = q.marks_per_question || 0;
      total += marks;
      const val = answers[q.question_id];
      if (val !== undefined && val !== null && val !== '') {
        scored += Math.min(marks, Math.max(0, Number(val) || 0));
      }
    });

    return { scored, total };
  };

  return (
    <div className="yes-no-evaluation-section">
      <div className="section-header mb-6">
        <ClipboardCheck size={18} className="text-slate-400" />
        <h3 className="section-title">Phase 2: Performance Evaluation Marks (75 Marks)</h3>
      </div>

      {Object.keys(sectionNames).map((sectionCode) => {
        const sectionQuestions = groupedQuestions[sectionCode] || [];
        if (sectionQuestions.length === 0) return null;

        const { scored, total } = getSectionScoreInfo(sectionCode);

        return (
          <div key={sectionCode} className="checklist-section-card">
            <div className="section-subheader">
              <h4>{sectionNames[sectionCode]}</h4>
              <span className="section-score-tally">
                Score: <strong>{scored}</strong> / {total} Marks
              </span>
            </div>

            <div className="questions-list">
              {sectionQuestions.map((q) => {
                const maxMarks = q.marks_per_question || 0;
                const currentValue = answers[q.question_id];
                const isMissing = unansweredIds.includes(q.question_id) && (currentValue === undefined || currentValue === null || currentValue === '');
                
                return (
                  <div 
                    key={q.question_id} 
                    id={`question-row-${q.question_id}`} 
                    className={`question-row ${isMissing ? 'question-row-error' : ''}`}
                  >
                    <div className="question-text-wrapper">
                      <p className="question-text">{q.question_text}</p>
                      {isMissing && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#DC2626', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                          <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                          Marks required: Please enter score (0 - {maxMarks})
                        </span>
                      )}
                    </div>

                    <div className="question-options-group" style={{ flexShrink: 0 }}>
                      {readOnly ? (
                        <div className="marks-display-pill">
                          <span className="marks-val">{currentValue !== undefined && currentValue !== null && currentValue !== '' ? currentValue : '—'}</span>
                          <span className="marks-denom">/ {maxMarks} Marks</span>
                        </div>
                      ) : (
                        <div className="marks-entry-cell">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={currentValue !== undefined && currentValue !== null ? currentValue : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              if (raw === '') {
                                onAnswerChange(q.question_id, q.section_code, '');
                                return;
                              }
                              const parsed = parseInt(raw, 10);
                              const clamped = Math.min(maxMarks, Math.max(0, parsed));
                              onAnswerChange(q.question_id, q.section_code, clamped);
                            }}
                            placeholder="—"
                            className={`marks-box-input ${isMissing ? 'marks-box-error' : ''}`}
                            aria-label={`Marks for ${q.question_text}`}
                          />
                          <span className="marks-out-of-label">/ {maxMarks} Marks</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
