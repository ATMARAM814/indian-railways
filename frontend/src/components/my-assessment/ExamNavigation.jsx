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
    <div className="exam-navigation-container">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className="exam-nav-prev-btn"
      >
        <ArrowLeft size={16} />
        <span className="exam-nav-text-desktop">Previous Question</span>
        <span className="exam-nav-text-mobile">Prev</span>
      </button>

      {/* Center Warning */}
      {remaining > 0 ? (
        <div className="exam-nav-center-status pending">
          <AlertTriangle size={16} className="exam-nav-alert-icon" style={{ fill: '#FEF3C7', stroke: '#EA580C' }} />
          <span className="exam-nav-text-desktop">{remaining} questions remaining</span>
          <span className="exam-nav-text-mobile">{remaining} left</span>
        </div>
      ) : (
        <div className="exam-nav-center-status completed">
          <span className="exam-nav-text-desktop">✓ All questions answered</span>
          <span className="exam-nav-text-mobile">✓ All answered</span>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className="exam-nav-next-btn"
      >
        <span className="exam-nav-text-desktop">Next Question</span>
        <span className="exam-nav-text-mobile">Next</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default ExamNavigation;
