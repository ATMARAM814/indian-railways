import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessments } from '../../hooks/useAssessments';
import { getAssessmentList } from '../../services/assessment.service';
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

const AssessmentRoleListPage = () => {
  const { roleCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPdRaut = user?.hrmsId === 'QASJDT' || user?.hrms_id === 'QASJDT' || user?.id === '75524970-3891-4321-9e96-2c0002d601a3';
  if (isPdRaut && (roleCode === 'TM' || roleCode === 'Train Manager')) {
    return <Navigate to="/assessments" replace />;
  }

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
  } = useAssessments(roleCode);

  const [filters, setFilters] = useState({
    search: '',
    stationSearch: '',
    stationId: '',
    status: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const hasTextChanged =
      filters.search !== debouncedFilters.search ||
      filters.stationSearch !== debouncedFilters.stationSearch;

    if (!hasTextChanged) {
      setDebouncedFilters(filters);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters, debouncedFilters.search, debouncedFilters.stationSearch]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats, roleCode]);

  useEffect(() => {
    if (user && roleCode) {
      fetchEligibleStaff(debouncedFilters, page, 10);
    }
  }, [user, roleCode, debouncedFilters, page, fetchEligibleStaff]);

  const handleExportExcel = async () => {
    try {
      if (!eligibleStaff || eligibleStaff.length === 0) {
        alert("No staff records available to export.");
        return;
      }

      // Fetch all matching records from the server using current filter parameters (bypassing page limits)
      const res = await getAssessmentList(roleCode, { ...filters, limit: 10000, page: 1 });
      const allStaff = res.success && Array.isArray(res.data) ? res.data : eligibleStaff;

      const dataToExport = allStaff.map(row => {
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

  // Station In-Charge must not assess Station Masters
  if (roleCode === 'SM' && ['SS', 'Cabin Master', 'CABIN MASTER', 'SM'].includes(user?.role)) {
    return <Navigate to="/assessments" replace />;
  }

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
      stationSearch: '',
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
        {/* Page Header */}
        <div className="role-list-header-row">
          <div className="role-list-title-group">
            <button
              onClick={() => navigate('/assessments')}
              className="header-back-btn circular"
              title="Back to Assessments Console"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="role-list-title-text">
              <h1>
                {friendlyName} Assessments
              </h1>
              <p>
                Conduct safety checklists, view safety grading logs, and audit scores for {friendlyName}.
              </p>
            </div>
          </div>

          <div className="role-list-actions-group">
            <button
              onClick={handleExportExcel}
              className="role-action-btn export-btn"
            >
              <Download size={16} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback && (
          <div className={`p-4 rounded-lg flex items-start justify-between border ${feedback.type === 'success'
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
    </DashboardLayout>
  );
};

export default AssessmentRoleListPage;
