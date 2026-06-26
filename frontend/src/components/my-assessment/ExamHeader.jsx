import React from 'react';
import { User, Shield, Compass, BookOpen } from 'lucide-react';

const ExamHeader = ({ assessment, totalQuestions, answeredCount, reviewCount }) => {
  if (!assessment) return null;

  const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary-orange)' }}>
      <div className="card-body">
        {/* Candidate & Assessment Details */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge-role" style={{ fontSize: '12px', fontWeight: 700 }}>
                {assessment.assessed_role_code}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--primary-navy)' }}>
                {assessment.assessed_name || 'Staff Assessment'}
              </h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} className="text-secondary" />
                <span><strong>HRMS ID:</strong> {assessment.assessed_hrms_id || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} className="text-secondary" />
                <span><strong>Designation:</strong> {assessment.assessed_designation || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} className="text-secondary" />
                <span><strong>Assessor:</strong> {assessment.assessor_name || `Supervisor (${assessment.assessor_role_code})`}</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '11px', color: '#4338CA', textTransform: 'uppercase', fontWeight: 600 }}>Answered</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#312E81' }}>{answeredCount} / {totalQuestions}</div>
            </div>
            <div style={{
              background: '#F3E8FF',
              border: '1px solid #E9D5FF',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '11px', color: '#6B21A8', textTransform: 'uppercase', fontWeight: 600 }}>Reviewed</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#581C87' }}>{reviewCount}</div>
            </div>
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '11px', color: '#C2410C', textTransform: 'uppercase', fontWeight: 600 }}>Remaining</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#7C2D12' }}>{totalQuestions - answeredCount}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={14} style={{ color: 'var(--primary-orange)' }} />
              <span>Assessment Progress</span>
            </span>
            <span>{pct}% Completed</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: 'var(--primary-orange)',
              borderRadius: '4px',
              transition: 'width 0.4s ease-out'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamHeader;
