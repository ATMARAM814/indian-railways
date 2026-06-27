import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessments } from '../../hooks/useAssessments';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AssessmentKpiCards } from '../../components/assessments/AssessmentKpiCards';
import { AssessmentFilterCard } from '../../components/assessments/AssessmentFilterCard';
import { AssessmentStaffTable } from '../../components/assessments/AssessmentStaffTable';
import { TableSkeleton } from '../../components/assessments/AssessmentSkeletons';
import DrillDownPagination from '../../components/dashboard/DrillDownPagination';
import { ArrowLeft, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cleanDesignationText } from '../../utils/dashboardMappers';
import '../../styles/assessments.css';

const roleNameMap = {
  PM: 'Pointsmen',
  SM: 'Station Masters',
  TM: 'Train Managers',
  SS: 'SM Incharges',
  TI: 'Traffic Inspectors',
  AOM: 'AOM',
  'Shunting Master': 'Shunting Masters',
  SMS: 'Station Master Supervisors'
};

const getDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

const AssessmentRoleListPage = () => {
  const { roleCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    stats,
    statsLoading,
    eligibleStaff,
    staffLoading,
    staffError,
    totalStaff,
    stations,
    stationsLoading,
    fetchStats,
    fetchEligibleStaff,
    handleActivateExam,
    handleDeactivateExam,
    handleGetBulkEligibleStaff,
    handleCreateBulkAssessments,
  } = useAssessments(roleCode);

  const [filters, setFilters] = useState({
    search: '',
    stationId: '',
    status: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState(null);

  // Bulk Scheduling states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEligibleStaff, setBulkEligibleStaff] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkCycle, setBulkCycle] = useState('Monthly Assessment');
  const [bulkType, setBulkType] = useState('Periodic Assessment');
  const [bulkScheduledDate, setBulkScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bulkDueDate, setBulkDueDate] = useState(() => getDefaultDueDate());
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const handleOpenBulkModal = async () => {
    setShowBulkModal(true);
    setBulkLoading(true);
    setBulkError('');
    setBulkRemarks('');
    setBulkCycle('Monthly Assessment');
    setBulkType('Periodic Assessment');
    setBulkScheduledDate(() => new Date().toISOString().split('T')[0]);
    setBulkDueDate(() => getDefaultDueDate());
    
    const res = await handleGetBulkEligibleStaff();
    if (res.success) {
      setBulkEligibleStaff(res.data);
    } else {
      setBulkError(res.message || 'Failed to load eligible employees for bulk scheduling.');
    }
    setBulkLoading(false);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkError('');

    if (new Date(bulkDueDate) < new Date(bulkScheduledDate)) {
      setBulkError('Due Date must be on or after Scheduled Date.');
      return;
    }

    setBulkSubmitting(true);
    const res = await handleCreateBulkAssessments({
      assessmentCycle: bulkCycle,
      assessmentType: bulkType,
      scheduledDate: bulkScheduledDate,
      dueDate: bulkDueDate,
      instructionsRemarks: bulkRemarks
    });

    setBulkSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Successfully scheduled safety assessments for ${res.data.count} employees at once.`
      });
      setShowBulkModal(false);
      fetchEligibleStaff(filters, page, 10);
      fetchStats();
    } else {
      setBulkError(res.message || 'Failed to schedule bulk assessments.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats, roleCode]);

  useEffect(() => {
    if (user && roleCode) {
      fetchEligibleStaff(filters, page, 10);
    }
  }, [user, roleCode, filters, page, fetchEligibleStaff]);

  const handleExportExcel = () => {
    try {
      if (!eligibleStaff || eligibleStaff.length === 0) {
        alert("No staff records available to export.");
        return;
      }

      const dataToExport = eligibleStaff.map(row => {
        let statusText = 'Not Scheduled';
        if (row.assessment_status === 'mcq_access_sent' || row.assessment_status === 'mcq_pending') {
          statusText = 'MCQ Exam Active';
        } else if (row.assessment_status === 'mcq_submitted') {
          statusText = 'MCQ Submitted';
        } else if (row.assessment_status === 'completed' || row.assessment_status === 'approved') {
          statusText = 'Completed';
        } else if (row.assessment_status === 'cancelled') {
          statusText = 'Cancelled';
        } else if (row.assessment_status) {
          statusText = row.assessment_status;
        }

        let approvalText = 'N/A';
        if (row.approval_status === 'pending_approval') {
          approvalText = 'Awaiting Approval (Remaining Approval)';
        } else if (row.approval_status === 'approved') {
          approvalText = 'Approved';
        } else if (row.approval_status === 'rejected') {
          approvalText = 'Rejected';
        }

        return {
          'Employee Name': row.full_name,
          'HRMS ID': row.hrms_id,
          'Designation': cleanDesignationText(row.designation),
          'Station': `${row.station_name || ''} (${row.station_code || ''})`,
          'Safety Category': row.category_code ? `Category ${row.category_code}` : 'Not Categorized',
          'Latest Score': row.percentage !== null ? `${parseFloat(row.percentage).toFixed(1)}%` : '-',
          'Assessment Status': statusText,
          'Approval Status': approvalText
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Assessments");

      const maxLens = {};
      dataToExport.forEach(row => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || key.length, valStr.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

      XLSX.writeFile(workbook, `${friendlyName}_Assessments_Report.xlsx`);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Error exporting Excel: " + err.message);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
      stationId: '',
      status: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    });
    setPage(1);
  };

  const onActivateExam = async (employeeId) => {
    setFeedback(null);
    const res = await handleActivateExam(employeeId);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `MCQ Exam session has been successfully activated and is now accessible for the employee.`
      });
      fetchEligibleStaff(filters, page, 10);
      fetchStats();
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Failed to activate exam. Please ensure question bank contains active questions.'
      });
    }
  };

  const onDeactivateExam = async (assessmentId) => {
    setFeedback(null);
    const res = await handleDeactivateExam(assessmentId);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `MCQ Exam session has been successfully deactivated and is no longer accessible.`
      });
      fetchEligibleStaff(filters, page, 10);
      fetchStats();
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Failed to deactivate MCQ Exam.'
      });
    }
  };

  const roleStats = stats.find((s) => s.roleCode === roleCode) || {
    roleCode,
    totalStaff: 0,
    activeExams: 0,
    pendingEvaluations: 0,
    completedAssessments: 0,
    averageScore: 0
  };

  const friendlyName = roleNameMap[roleCode] || roleCode;
  const isAomOrSuperAdmin = ['AOM', 'SUPER_ADMIN'].includes(user.role);

  const paginationObj = {
    total: totalStaff,
    page,
    limit: 10,
    totalPages: Math.ceil(totalStaff / 10) || 1
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/assessments')}
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
              title="Back to Assessments Console"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
                {friendlyName} Assessments
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Conduct safety checklists, view safety grading logs, and audit scores for {friendlyName}.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportExcel}
              style={{
                padding: '0 20px',
                height: '42px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0B2341',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(11, 35, 65, 0.05)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EEF6FC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              <Download size={16} />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={handleOpenBulkModal}
              style={{
                padding: '0 20px',
                height: '42px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2B5CE6',
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(43, 92, 230, 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E40AF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2B5CE6'}
            >
              Schedule for All {friendlyName}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback && (
          <div className={`p-4 rounded-lg flex items-start justify-between border ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-rose-600" />}
              <span className="text-sm font-medium">{feedback.message}</span>
            </div>
            <button 
              onClick={() => setFeedback(null)} 
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#334155'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200/50 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <AssessmentKpiCards stats={roleStats} />
        )}

        {/* Filters Card */}
        <AssessmentFilterCard
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          stations={user?.role === 'TI' ? stations.filter(st => !st.hasSupervisor) : stations}
          stationsLoading={stationsLoading}
        />

        {/* Staff Table */}
        {staffLoading ? (
          <TableSkeleton />
        ) : staffError ? (
          <div className="p-6 text-center text-rose-400 border border-rose-900 bg-rose-950/20 rounded-xl">
            {staffError}
          </div>
        ) : (
          <>
            <div className="table-responsive" style={{ padding: '16px' }}>
              <AssessmentStaffTable
                staff={eligibleStaff}
                roleCode={roleCode}
                fetchEligibleStaff={() => fetchEligibleStaff(filters, page, 10)}
                fetchStats={fetchStats}
                isAomOrSuperAdmin={isAomOrSuperAdmin}
              />
            </div>

            {/* Pagination Controls */}
            {totalStaff > 0 && (
              <DrillDownPagination
                pagination={paginationObj}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </>
        )}

      </div>

      {/* BULK SCHEDULE ASSESSMENT MODAL */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 35, 65, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            width: '90%',
            maxWidth: '650px',
            overflow: 'hidden',
            fontFamily: 'var(--font-family)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0B2341',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Bulk Schedule Assessments — {friendlyName}</h2>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBulkSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {bulkLoading ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '15px' }}>
                    Loading eligible employees list...
                  </div>
                ) : bulkEligibleStaff.length === 0 ? (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#991B1B',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={20} />
                    <span>All {friendlyName} under your jurisdiction already have active assessment cycles. No new assessments can be scheduled at this time.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Assessing {bulkEligibleStaff.length} Eligible {friendlyName}:
                    </label>
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '12px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {bulkEligibleStaff.map((emp) => (
                        <span
                          key={emp.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: '#EFF6FF',
                            color: '#1E40AF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12.5px',
                            fontWeight: '600'
                          }}
                        >
                          {emp.full_name} ({emp.station_code})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {bulkError && (
                  <div style={{ padding: '12px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', borderRadius: '6px' }}>
                    {bulkError}
                  </div>
                )}

                {/* Editable Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="modal-inputs-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Assessment Cycle *</label>
                      <select
                        value={bulkCycle}
                        onChange={(e) => setBulkCycle(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      >
                        <option value="Monthly Assessment">Monthly Assessment</option>
                        <option value="Quarterly Assessment">Quarterly Assessment</option>
                        <option value="Annual Assessment">Annual Assessment</option>
                        <option value="Special Safety Review">Special Safety Review</option>
                        <option value="Post Transfer Assessment">Post Transfer Assessment</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Assessment Type *</label>
                      <select
                        value={bulkType}
                        onChange={(e) => setBulkType(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      >
                        <option value="Periodic Assessment">Periodic Assessment</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-inputs-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Scheduled Date *</label>
                      <input
                        type="date"
                        value={bulkScheduledDate}
                        onChange={(e) => setBulkScheduledDate(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Due Date *</label>
                      <input
                        type="date"
                        value={bulkDueDate}
                        onChange={(e) => setBulkDueDate(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Instructions / Remarks</label>
                    <textarea
                      rows="3"
                      value={bulkRemarks}
                      onChange={(e) => setBulkRemarks(e.target.value)}
                      placeholder="Add instructions for all employees..."
                      style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                    ></textarea>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid #E2E8F0'
              }}>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  style={{
                    padding: '0 16px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkEligibleStaff.length === 0 || bulkSubmitting || bulkLoading}
                  style={{
                    padding: '0 20px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (bulkEligibleStaff.length === 0 || bulkSubmitting || bulkLoading) ? '#94A3B8' : '#2B5CE6',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: (bulkEligibleStaff.length === 0 || bulkSubmitting || bulkLoading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {bulkSubmitting ? 'Scheduling...' : `Schedule for ${bulkEligibleStaff.length} Employees`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AssessmentRoleListPage;
