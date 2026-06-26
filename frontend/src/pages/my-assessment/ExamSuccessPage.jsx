import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import '../../styles/my-assessment.css';

const ExamSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px' }}>
        <div style={{
          maxWidth: '600px',
          margin: '60px auto 0 auto',
          textAlign: 'center',
          padding: '40px 24px',
          boxShadow: 'var(--shadow-lg)'
        }} className="card">
          {/* Success Icon */}
          <div style={{
            backgroundColor: '#ECFDF5',
            color: '#10B981',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={40} />
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '12px' }}>
            MCQ Examination Submitted
          </h2>

          {/* Subtitle / Description */}
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 auto 24px auto', maxWidth: '440px' }}>
            Thank you for completing the online safety assessment. Your answers have been successfully synchronized and processed. 
            The subjective evaluation checklist sections (Phase 2 & Phase 3) are now unlocked for your assigned assessor to complete.
          </p>

          {/* Info Banner */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-light)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            textAlign: 'left',
            marginBottom: '32px',
            lineHeight: 1.5
          }}>
            <span style={{ fontWeight: 700, color: 'var(--primary-navy)', display: 'block', marginBottom: '4px' }}>
              Next Steps in the Evaluation Lifecycle:
            </span>
            1. Your assessor will perform the practical field checklists.<br />
            2. The assessment will go to higher authorities for final sign-off.<br />
            3. Once approved, you can view your detailed scorecard analysis report here.
          </div>

          <button
            className="btn-premium-primary"
            onClick={() => navigate('/my-assessment')}
          >
            <span>Go to My Assessments</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExamSuccessPage;
