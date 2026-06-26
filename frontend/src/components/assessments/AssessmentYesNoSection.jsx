import React from 'react';
import { ClipboardCheck } from 'lucide-react';

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
  readOnly = false
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
      const isYes = answers[q.question_id] === true;
      const marks = q.marks_per_question || 0;
      total += marks;
      if (isYes) scored += marks;
    });

    return { scored, total };
  };

  return (
    <div className="yes-no-evaluation-section">
      <div className="section-header mb-6">
        <ClipboardCheck size={18} className="text-slate-400" />
        <h3 className="section-title">Phase 2: Yes/No Evaluation Checklist (75 Marks)</h3>
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
                const currentValue = answers[q.question_id];
                
                return (
                  <div key={q.question_id} className="question-row">
                    <div className="question-text-wrapper">
                      <p className="question-text">{q.question_text}</p>
                    </div>

                    <div className="question-options-group">
                      {readOnly ? (
                        <span className={`read-only-toggle ${currentValue === true ? 'val-yes' : currentValue === false ? 'val-no' : 'val-none'}`}>
                          {currentValue === true ? 'YES' : currentValue === false ? 'NO' : 'Unanswered'}
                        </span>
                      ) : (
                        <div className="toggle-btn-group">
                          <button
                            type="button"
                            onClick={() => onAnswerChange(q.question_id, q.section_code, true)}
                            className={`toggle-btn btn-yes ${currentValue === true ? 'selected' : ''}`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => onAnswerChange(q.question_id, q.section_code, false)}
                            className={`toggle-btn btn-no ${currentValue === false ? 'selected' : ''}`}
                          >
                            NO
                          </button>
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
