import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmployeeScoreTrend from '../../components/reports/EmployeeScoreTrend';
import CategoryHistoryTimeline from '../../components/reports/CategoryHistoryTimeline';
import { TableSkeleton } from '../../components/reports/ReportSkeletons';
import { ArrowLeft, User, FileText, Calendar, Shield, Award, CheckCircle2, AlertCircle, XCircle, Briefcase } from 'lucide-react';

const EmployeeReportPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { employeeReport, loading, error, fetchEmployee } = useReports();

  useEffect(() => {
    if (employeeId) {
      fetchEmployee(employeeId);
    }
  }, [employeeId, fetchEmployee]);

  if (loading && !employeeReport) {
    return (
      <DashboardLayout>
        <div style={{ padding: '32px' }}>
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: '32px' }}>
          <button onClick={() => navigate('/reports')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#2B5CE6', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '16px' }}>
            <ArrowLeft size={16} /> Back to Reports
          </button>
          <div style={{ padding: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeReport) {
    return (
      <DashboardLayout>
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
          Employee report not found.
        </div>
      </DashboardLayout>
    );
  }

  const { summary, history, scoreTrend, categoryHistory, recentAssessment } = employeeReport;

  const renderApprovalBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><CheckCircle2 size={12} /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]"><AlertCircle size={12} /> Pending Approval</span>;
    }
  };

  const renderCategoryBadge = (cat) => {
    if (!cat || cat === '—' || cat === 'N/A') return <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: '13px' }}>N/A</span>;
    let styles = { padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 };

    switch (cat.toUpperCase()) {
      case 'A':
        styles = { ...styles, backgroundColor: '#DCFCE7', color: '#15803D' };
        break;
      case 'B':
        styles = { ...styles, backgroundColor: '#E0F2FE', color: '#0369A1' };
        break;
      case 'C':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#B45309' };
        break;
      case 'D':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }
    return <span style={styles}>Cat {cat}</span>;
  };

  const renderRiskBadge = (cat) => {
    if (!cat) return <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: '12px' }}>N/A</span>;
    let styles = { padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' };

    switch (cat.toUpperCase()) {
      case 'A':
        styles = { ...styles, backgroundColor: '#DCFCE7', color: '#15803D' };
        return <span style={styles}>LOW RISK</span>;
      case 'B':
      case 'C':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#D97706' };
        return <span style={styles}>MEDIUM RISK</span>;
      case 'D':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        return <span style={styles}>HIGH RISK</span>;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
        return <span style={styles}>NOT CATEGORIZED</span>;
    }
  };

  const initials = summary?.fullName
    ? summary.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EE';

  return (
    <DashboardLayout>
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Back Button */}
        <div>
          <button 
            onClick={() => navigate('/reports')} 
            style={{ 
              marginBottom: '16px', 
              padding: '8px 14px', 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#475569', 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #D7E3EF', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(11, 35, 65, 0.05)'
            }}
          >
            <ArrowLeft size={16} /> Back to Reports Dashboard
          </button>
        </div>

        {/* Profile Header Block ( नागपुर Junction Command Navy Design ) */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #D7E3EF', 
          borderRadius: '16px', 
          padding: '28px', 
          boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          {/* Avatar and Main Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              backgroundColor: '#EEF6FC',
              color: '#1B365D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
              border: '1px solid rgba(27, 54, 93, 0.1)'
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>{summary?.fullName}</h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A'
                }}>
                  Completed
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} />
                <span>{summary?.roleDisplayName || summary?.role}</span>
                <span style={{ color: '#D7E3EF' }}>|</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{summary?.hrmsId}</span>
              </p>
            </div>
          </div>

          {/* Core Badges Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '4px 16px', borderRight: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Category</span>
              <div style={{ marginTop: '6px' }}>{renderCategoryBadge(summary?.category)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '4px 16px', borderRight: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Risk Level</span>
              <div style={{ marginTop: '6px' }}>{renderRiskBadge(summary?.category)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '4px 16px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Latest Score</span>
              <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 700, color: '#1B365D' }}>
                {recentAssessment?.percentage ? `${parseFloat(recentAssessment.percentage).toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="reports-detail-grid" style={{ alignItems: 'start' }}>
          {/* Left Column (Bio, Recent evaluation details, & Timeline) */}
          <div className="reports-col-5" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Reporting & Administration Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>
                Reporting & Administration
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Station Posting</span>
                  <span style={{ color: '#1B365D', fontWeight: 700 }}>{summary?.stationCode} - {summary?.stationName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Division</span>
                  <span style={{ color: '#334155', fontWeight: 700 }}>{summary?.divisionName} ({summary?.divisionCode})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Reporting Officer</span>
                  <span style={{ color: '#334155', fontWeight: 700 }}>{summary?.reportingAuthority}</span>
                </div>
              </div>
            </div>

            {/* Recent Evaluation Scorecard Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>
                Recent Evaluation Scorecard
              </h3>
              {!recentAssessment ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
                  No safety assessments completed yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                      Percentage Grade
                    </span>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', display: 'block' }}>
                      {recentAssessment.percentage ? `${Number(recentAssessment.percentage).toFixed(1)}%` : '0.0%'}
                    </span>
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700 }}>
                      Status: {renderApprovalBadge(recentAssessment.approvalStatus)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>MCQ Exam Score</span>
                      <span style={{ color: '#334155', fontWeight: 700 }}>{recentAssessment.mcqScore} Marks</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Observational Score</span>
                      <span style={{ color: '#334155', fontWeight: 700 }}>{recentAssessment.evaluationScore} Marks</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Aggregate Score</span>
                      <span style={{ color: '#0F172A', fontWeight: 700 }}>{recentAssessment.finalScore} / {recentAssessment.maxMarks}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Safety Category</span>
                      {renderCategoryBadge(recentAssessment.category)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category History Timeline */}
            <CategoryHistoryTimeline categoryHistory={categoryHistory} />
          </div>

          {/* Right Column (Trend Chart, History Table) */}
          <div className="reports-col-7" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Trend Chart */}
            <EmployeeScoreTrend scoreTrend={scoreTrend} />

            {/* Assessment History Table */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>
                Assessment Records & Cycles
              </h3>
              <div style={{ overflowX: 'auto' }}>
                {history.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    No cycles recorded yet.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
                        <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Cycle Name</th>
                        <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Evaluation Date</th>
                        <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Percentage</th>
                        <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Score</th>
                        <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Assessor</th>
                        <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Workflow Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #EEF2F6' }}>
                          <td style={{ padding: '12px', fontSize: '12.5px', fontWeight: 750, color: '#1B365D' }}>{item.cycle || 'Monthly Assessment'}</td>
                          <td style={{ padding: '12px', fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                            {item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '12.5px', textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>
                            {item.percentage ? `${Number(item.percentage).toFixed(1)}%` : '-'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '12.5px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                            {item.score || '-'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>{item.assessorName}</td>
                          <td style={{ padding: '12px', fontSize: '12.5px', textAlign: 'right' }}>{renderApprovalBadge(item.approvalStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeReportPage;
