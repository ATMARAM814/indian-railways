import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Calendar, User, Clock, CheckCircle2, Hourglass, FileCheck } from 'lucide-react';

const AssessmentHistoryTable = ({ history, resolveCategory }) => {
  const navigate = useNavigate();

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'A': return 'badge-success';
      case 'B': return 'badge-blue';
      case 'C': return 'badge-warning';
      case 'D': return 'badge-danger';
      default:  return 'badge-secondary';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'A': return 'Cat A — Outstanding';
      case 'B': return 'Cat B — Good';
      case 'C': return 'Cat C — Needs Training';
      case 'D': return 'Cat D — Critical';
      default:  return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!history || history.length === 0) {
    return (
      <div className="card-body" style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-secondary)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F0F9FF, #DBEAFE)',
          border: '1px solid #BFDBFE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', color: '#3B82F6'
        }}>
          <FileText size={32} strokeWidth={1.5} />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-navy)', margin: '0 0 6px' }}>
          No Scorecards Yet
        </p>
        <p style={{ fontSize: '13px', opacity: 0.75, margin: 0, maxWidth: 360, marginInline: 'auto', lineHeight: 1.6 }}>
          Your historical evaluation records and scorecards will appear here after your assessor completes the evaluation and it gets approved by authorities.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>Date</th>
            <th style={{ textAlign: 'center' }}>Role</th>
            <th style={{ textAlign: 'center' }}>Assessor</th>
            <th style={{ textAlign: 'center' }}>MCQ Score</th>
            <th style={{ textAlign: 'center' }}>Checklist Score</th>
            <th style={{ textAlign: 'center' }}>Total Score</th>
            <th style={{ textAlign: 'center' }}>Category</th>
            <th style={{ textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => {
            const showScores = item.status === 'completed' || item.status === 'approved' || item.approval_status === 'approved';
            const category = showScores ? resolveCategory(item.percentage, item.alcoholic_status) : null;
            const isApproved = item.approval_status === 'approved' || item.status === 'approved';
            
            return (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <Calendar size={15} className="text-secondary" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>{formatDate(item.evaluated_at || item.submitted_at || item.created_at)}</span>
                  </div>
                </td>
                <td>
                  <span className="badge-role">
                    {item.assessed_role_code}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <User size={15} className="text-secondary" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>
                      {item.assessor_name || `Supervisor (${item.assessor_role_code})`}
                    </span>
                  </div>
                </td>
                <td>
                  {item.mcq_score !== null && item.mcq_score !== undefined ? (
                    <>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-navy)' }}>
                        {item.mcq_score}
                      </span>
                      <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {' '}/ 25
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>—</span>
                  )}
                </td>
                <td>
                  {showScores && item.evaluation_score !== null && item.evaluation_score !== undefined ? (
                    <>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-navy)' }}>
                        {item.evaluation_score}
                      </span>
                      <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {' '}/ 75
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>—</span>
                  )}
                </td>
                <td>
                  {showScores ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '16.5px', color: 'var(--primary-navy)', lineHeight: 1.2 }}>
                        {item.total_score ?? 0}
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}> / 100</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {parseFloat(item.percentage || 0).toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>—</span>
                  )}
                </td>
                <td>
                  {showScores && category ? (
                    <span className={`badge ${getCategoryBadgeClass(category)}`}>
                      {getCategoryName(category)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>—</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <button
                      className="btn-premium-secondary"
                      title="View Detailed Scorecard"
                      onClick={() => navigate(`/my-assessment/${item.id}/scorecard`)}
                      style={{ fontSize: '14px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
                    >
                      <Eye size={16} />
                      <span>View Scorecard</span>
                    </button>
                    {!isApproved && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: item.status === 'mcq_submitted' ? '#1D4ED8' : '#7E22CE',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}>
                        {item.status === 'mcq_submitted' ? 'Pending Evaluation' : 'Pending Approval'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AssessmentHistoryTable;
