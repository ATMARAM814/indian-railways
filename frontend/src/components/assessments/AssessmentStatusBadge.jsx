import React from 'react';

export const AssessmentStatusBadge = ({ status, approvalStatus }) => {
  let text = 'Not Assessed';
  let className = 'badge-neutral';

  if (['created', 'scheduled', 'mcq_access_sent', 'mcq_pending'].includes(status)) {
    text = 'MCQ Exam Pending';
    className = 'badge-warning';
  } else if (status === 'mcq_submitted') {
    text = 'Evaluation Pending';
    className = 'badge-secondary';
  } else if (status === 'completed') {
    if (approvalStatus === 'pending_approval') {
      text = 'Pending Approval';
      className = 'badge-info';
    } else if (approvalStatus === 'approved') {
      text = 'Approved';
      className = 'badge-success';
    } else if (approvalStatus === 'rejected') {
      text = 'Rejected';
      className = 'badge-danger';
    } else {
      text = 'Evaluation Completed';
      className = 'badge-info';
    }
  }

  return (
    <span className={`assessment-badge ${className}`}>
      {text}
    </span>
  );
};
