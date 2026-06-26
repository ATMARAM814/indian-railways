import React from 'react';
import { HelpCircle, Award } from 'lucide-react';

export const AssessmentMcqSection = ({ mcqScore = 0 }) => {
  const totalQuestions = 25;
  const percentage = ((mcqScore / totalQuestions) * 100).toFixed(1);

  return (
    <div className="mcq-score-section">
      <div className="section-header">
        <HelpCircle size={18} className="text-slate-400" />
        <h3 className="section-title">Phase 1: MCQ Exam Results</h3>
      </div>
      
      <div className="mcq-card-layout">
        <div className="score-block">
          <Award className="award-icon" size={36} />
          <div>
            <div className="score-display">
              <span className="current-score">{mcqScore}</span>
              <span className="max-score">/ {totalQuestions}</span>
            </div>
            <div className="score-label">MCQ Mark Total</div>
          </div>
        </div>

        <div className="progress-block">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Score Percentage</span>
            <span className="font-semibold text-slate-800">{percentage}%</span>
          </div>
          <div className="progress-bar-bg h-3 rounded-full overflow-hidden">
            <div 
              className="progress-bar-fill h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Candidates must finish the MCQ exam before safety checklists are evaluated.
          </p>
        </div>
      </div>
    </div>
  );
};
