import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessments } from '../../hooks/useAssessments';
import { getWorkforceDetails } from '../../services/workforce.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { cleanDesignationText } from '../../utils/dashboardMappers';
import { 
  ArrowLeft, 
  Eye, 
  Award,
  IdCard,
  Briefcase,
  MapPin,
  Users,
  ShieldCheck,
  ClipboardList,
  Calendar,
  Clock,
  XCircle,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import '../../styles/assessments.css';
import { TableSkeleton } from '../../components/reports/ReportSkeletons';

export const AssessmentHistoryPage = () => {
  const { roleCode, employeeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { handleGetEmployeeHistory } = useAssessments(roleCode);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [employeeInfo, setEmployeeInfo] = useState(location.state?.employee || null);
  const [infoLoading, setInfoLoading] = useState(!employeeInfo);

  useEffect(() => {
    const loadData = async () => {
      setHistoryLoading(true);
      const res = await handleGetEmployeeHistory(employeeId);
      if (res.success) {
        setHistory(res.data);
      } else {
        setHistoryError(res.message || 'Failed to fetch assessment history.');
      }
      setHistoryLoading(false);
    };

    const loadProfile = async () => {
      if (!employeeInfo) {
        setInfoLoading(true);
        try {
          const res = await getWorkforceDetails(employeeId);
          if (res.success) {
            setEmployeeInfo(res.data);
          }
        } catch (err) {
          console.error('Failed to load employee details', err);
        } finally {
          setInfoLoading(false);
        }
      }
    };

    if (user && employeeId) {
      loadData();
      loadProfile();
    }
  }, [user, employeeId, handleGetEmployeeHistory, employeeInfo]);

  if (!user) return <Navigate to="/login" replace />;

  const getInitials = (name) => {
    if (!name) return '?';
    const cleanName = name.replace(/\./g, ' ').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusElement = (status, approvalStatus, approvedDate, completedDate) => {
    if (status === 'cancelled') {
      return (
        <div className="history-status-badge cancelled">
          <XCircle size={14} style={{ marginRight: '4px' }} />
          <span>Cancelled</span>
        </div>
      );
    }
    if (approvalStatus === 'approved') {
      return (
        <div>
          <div className="history-status-badge approved">
            <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
            <span>Approved</span>
          </div>
          <span className="approval-date-subtext">
            {formatDate(approvedDate || completedDate)}
          </span>
        </div>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <div className="history-status-badge rejected">
          <AlertCircle size={14} style={{ marginRight: '4px' }} />
          <span>Rejected</span>
        </div>
      );
    }
    if (approvalStatus === 'pending_approval') {
      return (
        <div className="history-status-badge pending">
          <Clock size={14} style={{ marginRight: '4px' }} />
          <span>Awaiting Approval</span>
        </div>
      );
    }
    if (status === 'mcq_submitted') {
      return (
        <div className="history-status-badge pending">
          <Clock size={14} style={{ marginRight: '4px' }} />
          <span>MCQ Submitted</span>
        </div>
      );
    }
    if (status === 'mcq_access_sent') {
      return (
        <div className="history-status-badge pending">
          <Clock size={14} style={{ marginRight: '4px' }} />
          <span>MCQ Active</span>
        </div>
      );
    }
    return (
      <div className="history-status-badge pending">
        <Clock size={14} style={{ marginRight: '4px' }} />
        <span>{status}</span>
      </div>
    );
  };

  // Dynamically calculate KPI summary values from history array
  const totalAssessments = history.length;
  const completedCount = history.filter(h => h.status === 'completed' && h.approval_status === 'approved').length;
  const inProgressCount = history.filter(h => h.status !== 'cancelled' && (h.status !== 'completed' || h.approval_status !== 'approved')).length;
  const cancelledCount = history.filter(h => h.status === 'cancelled').length;

  const completedPct = totalAssessments > 0 ? Math.round((completedCount / totalAssessments) * 100) : 0;
  const inProgressPct = totalAssessments > 0 ? Math.round((inProgressCount / totalAssessments) * 100) : 0;
  const cancelledPct = totalAssessments > 0 ? Math.round((cancelledCount / totalAssessments) * 100) : 0;

  const approvedAssessments = history.filter(h => h.approval_status === 'approved' && h.percentage);
  const avgScore = approvedAssessments.length > 0
    ? (approvedAssessments.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / approvedAssessments.length).toFixed(1)
    : '0.0';

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Title Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(`/assessments/${roleCode}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EFF6FF';
              e.currentTarget.style.borderColor = '#BFDBFE';
              e.currentTarget.style.color = '#2B5CE6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#475569';
            }}
            title="Back to Staff List"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
              Assessment History
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              Historical overview of periodic evaluations and safety cycles.
            </p>
          </div>
        </div>

        {/* Candidate Profile Details Banner Card */}
        {infoLoading ? (
          <div className="animate-pulse bg-white p-6 rounded-xl border border-slate-100 h-28"></div>
        ) : employeeInfo ? (
          <div className="candidate-profile-banner">
            
            {/* Circle Initials Avatar with Category Overlap Pill */}
            <div className="candidate-avatar-wrapper">
              <div className="candidate-avatar-circle">
                {getInitials(employeeInfo.full_name)}
              </div>
              {employeeInfo.category_code && (
                <div className="candidate-avatar-badge">
                  <span>Cat {employeeInfo.category_code}</span>
                </div>
              )}
            </div>

            {/* Profile Information details row */}
            <div className="candidate-details-block">
              <h2 className="candidate-name">{employeeInfo.full_name}</h2>
              <div className="candidate-info-grid">
                
                {/* HRMS ID */}
                <div className="candidate-info-item">
                  <div className="info-item-icon-wrapper">
                    <IdCard size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-item-label">HRMS ID</span>
                    <span className="info-item-value">{employeeInfo.hrms_id}</span>
                  </div>
                </div>

                {/* Designation */}
                <div className="candidate-info-item">
                  <div className="info-item-icon-wrapper">
                    <Briefcase size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-item-label">Designation</span>
                    <span className="info-item-value">{cleanDesignationText(employeeInfo.designation)}</span>
                  </div>
                </div>

                {/* Station */}
                <div className="candidate-info-item">
                  <div className="info-item-icon-wrapper">
                    <MapPin size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-item-label">Station</span>
                    <span className="info-item-value">{employeeInfo.station_code || employeeInfo.station || '-'}</span>
                  </div>
                </div>

                {/* Reporting Authority */}
                <div className="candidate-info-item">
                  <div className="info-item-icon-wrapper">
                    <Users size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-item-label">Reporting Authority</span>
                    <span className="info-item-value">
                      {employeeInfo.reporting_authority_name || employeeInfo.reporting_authority || 'Station Master'}
                    </span>
                  </div>
                </div>

                {/* Category badge */}
                <div className="candidate-info-item" style={{ borderRight: 'none' }}>
                  <div className="info-item-icon-wrapper">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-item-label">Category</span>
                    <div>
                      {employeeInfo.category_code ? (
                        <span className="info-item-badge">
                          Category {employeeInfo.category_code}
                        </span>
                      ) : (
                        <span className="info-item-badge no-category">Not Graded</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : null}

        {/* History Summary Strip Grid (5 cards) */}
        <div className="history-kpi-grid">
          
          {/* Card 1: Total Assessments */}
          <div className="history-kpi-card h-kpi-blue">
            <div className="h-kpi-icon-wrapper">
              <ClipboardList size={18} />
            </div>
            <div className="h-kpi-content">
              <span className="h-kpi-label">Total Assessments</span>
              <span className="h-kpi-value">{totalAssessments}</span>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="history-kpi-card h-kpi-green">
            <div className="h-kpi-icon-wrapper">
              <Calendar size={18} />
            </div>
            <div className="h-kpi-content">
              <span className="h-kpi-label">Completed</span>
              <span className="h-kpi-value">{completedCount}</span>
              <span className="h-kpi-subtext" style={{ color: '#10B981' }}>({completedPct}%)</span>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="history-kpi-card h-kpi-orange">
            <div className="h-kpi-icon-wrapper">
              <Clock size={18} />
            </div>
            <div className="h-kpi-content">
              <span className="h-kpi-label">In Progress</span>
              <span className="h-kpi-value">{inProgressCount}</span>
              <span className="h-kpi-subtext" style={{ color: '#F59E0B' }}>({inProgressPct}%)</span>
            </div>
          </div>

          {/* Card 4: Cancelled */}
          <div className="history-kpi-card h-kpi-purple">
            <div className="h-kpi-icon-wrapper">
              <XCircle size={18} />
            </div>
            <div className="h-kpi-content">
              <span className="h-kpi-label">Cancelled</span>
              <span className="h-kpi-value">{cancelledCount}</span>
              <span className="h-kpi-subtext" style={{ color: '#7C3AED' }}>({cancelledPct}%)</span>
            </div>
          </div>

          {/* Card 5: Average Score */}
          <div className="history-kpi-card h-kpi-blue">
            <div className="h-kpi-icon-wrapper">
              <TrendingUp size={18} />
            </div>
            <div className="h-kpi-content">
              <span className="h-kpi-label">Average Score</span>
              <span className="h-kpi-value">{avgScore}%</span>
            </div>
          </div>

        </div>

        {/* History Log Table Card */}
        <div className="table-responsive" style={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #EEF2F6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Periodic Assessment Log</h3>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Records: {history.length}</span>
          </div>

          {historyLoading ? (
            <TableSkeleton />
          ) : historyError ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#EF4444', fontWeight: 500 }}>{historyError}</div>
          ) : history.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontWeight: 500 }}>No previous assessments recorded for this candidate.</div>
          ) : (
            <>
              <table className="workforce-table">
                <thead>
                  <tr>
                    <th>Assessment Cycle</th>
                    <th>Assessment Type</th>
                    <th>Scheduled Date</th>
                    <th>Completed Date</th>
                    <th>Final Score</th>
                    <th>Category</th>
                    <th>Assessed By</th>
                    <th>Approval Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const isApproved = row.approval_status === 'approved';
                    const scoreVal = parseFloat(row.percentage || 0);
                    const getRowCategory = (r) => {
                      const pctVal = parseFloat(r.percentage || 0);
                      const mcq = parseFloat(r.mcq_score || 0);
                      const alertness = parseFloat(r.alertness_score || 0);

                      if (r.alcoholic_status === 'Alcoholic' || pctVal <= 25) return 'D';
                      if (mcq < 15 || alertness < 15) return 'C';
                      if (pctVal >= 80) return 'A';
                      if (pctVal >= 50) return 'B';
                      if (pctVal >= 26) return 'C';
                      return 'D';
                    };
                    const rowCategory = getRowCategory(row);
                    return (
                      <tr key={row.id} className="hover-row">
                        <td style={{ fontWeight: '700', color: '#0B2341' }}>
                          {row.assessment_cycle || 'Periodic Cycle'}
                        </td>
                        <td>
                          {row.assessment_type || 'Periodic Assessment'}
                        </td>
                        <td>
                          {formatDate(row.scheduled_date)}
                        </td>
                        <td>
                          {formatDate(row.completed_date)}
                        </td>
                        <td style={{ fontWeight: '800', color: '#0F172A' }}>
                          {isApproved && row.percentage ? `${scoreVal.toFixed(1)}%` : '—'}
                        </td>
                        <td>
                          {isApproved && row.percentage ? (
                            <span className={`category-tag cat-${rowCategory}`}>
                              Category {rowCategory}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>
                          )}
                        </td>
                        <td>
                          {row.assessor_name || 'Assessor'}
                        </td>
                        <td>
                          {getStatusElement(row.status, row.approval_status, row.approved_at, row.completed_date)}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/assessments/${roleCode}/${row.id}/view`)}
                            className="btn-icon btn-view"
                            style={{ height: '32px', width: '32px', padding: 0 }}
                            title="View Scorecard"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Pagination Info Wrapper */}
              <div className="table-info-footer">
                <Info size={14} className="info-icon-wrapper" />
                <span>Showing 1 to {history.length} of {history.length} records</span>
              </div>
            </>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};
