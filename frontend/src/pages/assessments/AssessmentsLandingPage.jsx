import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessments } from '../../hooks/useAssessments';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AssessmentSummaryStrip } from '../../components/assessments/AssessmentSummaryStrip';
import { AssessmentRoleCard } from '../../components/assessments/AssessmentRoleCard';
import { CardSkeleton } from '../../components/assessments/AssessmentSkeletons';
import { TableSkeleton } from '../../components/reports/ReportSkeletons';
import { AssessmentStatusBadge } from '../../components/assessments/AssessmentStatusBadge';
import apiClient from '../../api/apiClient';
import { ClipboardList, Calendar, Award, ChevronRight, Eye, Info, Clock } from 'lucide-react';
import '../../styles/assessments.css';

const AssessmentsLandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, statsLoading, statsError, fetchStats } = useAssessments();
  const [myResults, setMyResults] = useState([]);
  const [myResultsLoading, setMyResultsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');

  useEffect(() => {
    if (user && user.role !== 'PM' && user.role !== 'Shunting Master') {
      fetchStats();
    }
  }, [user, fetchStats]);

  useEffect(() => {
    if (!statsLoading && stats && stats.length > 0) {
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }
  }, [statsLoading, stats]);

  useEffect(() => {
    const fetchMyResults = async () => {
      if (user && user.role === 'PM') {
        setMyResultsLoading(true);
        try {
          const res = await apiClient.get('/assessments/my-results');
          if (res.data && res.data.success) {
            setMyResults(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load personal assessment results', err);
        } finally {
          setMyResultsLoading(false);
        }
      }
    };
    fetchMyResults();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        
        {/* Page Header for PM */}
        {user.role === 'PM' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
                My Assessment History
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Review safety performance scores, periodic evaluations, and safety classifications.
              </p>
            </div>
          </div>
        )}

        {/* PM Personal View */}
        {user.role === 'PM' && (
          <div className="table-responsive" style={{ padding: '16px' }}>
            {myResultsLoading ? (
              <TableSkeleton />
            ) : myResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No completed assessments recorded in the system.</div>
            ) : (
              <table className="workforce-table">
                <thead>
                  <tr>
                    <th>Evaluation Date</th>
                    <th>Assessment Type</th>
                    <th>Safety Score</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myResults.map((row) => (
                    <tr key={row.id} className="hover-row">
                      <td>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar size={16} className="text-slate-500" />
                          <span>{formatDate(row.evaluated_at || row.created_at)}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-slate-800">
                        {row.assessed_role_code === 'PM' ? 'Pointsman Safety Evaluation' : `${row.assessed_role_code} Evaluation`}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-amber-600" />
                          <span className="font-bold text-slate-900">{parseFloat(row.percentage).toFixed(1)}%</span>
                          <span className="text-xs text-slate-500">({row.total_score} Marks)</span>
                        </div>
                      </td>
                      <td>
                        <AssessmentStatusBadge status={row.status} approvalStatus="approved" />
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/assessments/${row.assessed_role_code}/${row.id}/view`)}
                          className="btn-icon btn-view"
                          title="View Evaluation Form"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Manager/Admin Card View */}
        {user.role !== 'PM' && (
          <>
            {statsLoading ? (
              <>
                <div style={{ height: '110px', background: '#e2e8f0', borderRadius: '16px' }} className="animate-pulse mb-4"></div>
                <CardSkeleton />
              </>
            ) : statsError ? (
              <div className="p-6 text-center text-rose-400 border border-rose-900 bg-rose-950/20 rounded-xl">
                {statsError}
              </div>
            ) : (
              <>
                {/* Console Hero Banner */}
                <div className="assessments-hero-banner">
                  <div className="hero-left">
                    <div className="hero-icon-wrapper">
                      <ClipboardList size={26} className="hero-icon" />
                    </div>
                    <div className="hero-text">
                      <h2 className="hero-title">Staff Assessments Console</h2>
                      <p className="hero-subtitle">
                        Conduct, review, and evaluate safety performance checklists for division workforce.
                      </p>
                    </div>
                  </div>
                  <div className="hero-right">
                    <div className="sync-badge">
                      <div className="sync-icon-wrapper">
                        <Clock size={15} className="sync-icon" />
                      </div>
                      <div className="sync-details">
                        <span className="sync-label">Last Sync</span>
                        <span className="sync-time">{lastSyncTime || '10:45 AM'}</span>
                        <span className="sync-day">Today</span>
                      </div>
                    </div>
                  </div>
                </div>

                <AssessmentSummaryStrip stats={stats} />
                
                <div className="scoped-title-row">
                  <div className="title-desc">
                    <h2 className="scoped-title">Scoped Staff Categories</h2>
                    <p className="scoped-subtitle">Overview of staff categories and their assessment status</p>
                  </div>
                  <div className="scoped-info-badge">
                    <div className="info-icon-wrapper">
                      <Info size={16} />
                    </div>
                    <span className="info-text">
                      Select a category card to view detailed assessments, pending evaluations and insights.
                    </span>
                  </div>
                </div>

                <div className="assessment-grid">
                  {stats.map((roleStats) => (
                    <AssessmentRoleCard key={roleStats.roleCode} stats={roleStats} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AssessmentsLandingPage;
