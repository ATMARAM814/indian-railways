import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DrillDownPagination from '../../components/dashboard/DrillDownPagination';
import { getStationsList } from '../../services/workforce.service';
import { getPendingApprovals, getApprovalHistory } from '../../services/approval.service';
import ApprovalDetailModal from './ApprovalDetailModal';
import { TableSkeleton } from '../../components/assessments/AssessmentSkeletons';
import { 
  CheckSquare, History, Search, Filter, RotateCcw, 
  ChevronRight, Calendar, AlertCircle, Eye, EyeOff, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cleanDesignationText } from '../../utils/dashboardMappers';
import '../../styles/assessments.css';

const roleNameMap = {
  PM: 'Pointsman',
  SM: 'Station Master',
  TM: 'Train Manager',
  SS: 'SM Incharge',
  TI: 'Traffic Inspector',
  'Shunting Master': 'Shunting Master',
  SMS: 'Station Master Supervisor'
};

const ApprovalsPage = () => {
  const { user } = useAuth();
  const isApprover = user && ['SM', 'SS', 'TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'STATION MASTER SUPERVISOR', 'Station Master Supervisor', 'Station Master Supervisior', 'Station Master Supervisio', 'Cabin Master', 'CABIN MASTER'].includes(user.role);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  
  // Data lists
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [stations, setStations] = useState([]);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    stationId: '',
    role: '',
    approvalStatus: '', // History only
    fromDate: '',
    toDate: ''
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Selected assessment for detail view
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      if (!user || !isApprover) return;
      setStationsLoading(true);
      try {
        const res = await getStationsList();
        if (res.success) {
          setStations(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load stations', err);
      } finally {
        setStationsLoading(false);
      }
    };
    fetchStations();
  }, [user, isApprover]);

  // Fetch Pending Queue or History list
  const loadData = useCallback(async () => {
    if (!user || !isApprover) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'pending') {
        const res = await getPendingApprovals();
        if (res.success) {
          setPendingList(res.data || []);
          setTotalItems(res.data?.length || 0);
          setTotalPages(1);
        } else {
          throw new Error(res.message || 'Failed to fetch pending approvals');
        }
      } else {
        // Prepare API filters
        const apiParams = {
          page,
          limit,
          search: filters.search || undefined,
          stationId: filters.stationId || undefined,
          role: filters.role || undefined,
          approvalStatus: filters.approvalStatus || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        };
        
        const res = await getApprovalHistory(apiParams);
        if (res.success) {
          setHistoryList(res.data?.records || []);
          const pag = res.data?.pagination || {};
          setTotalItems(pag.total || 0);
          setTotalPages(pag.totalPages || 1);
        } else {
          throw new Error(res.message || 'Failed to fetch approval history');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load approvals list.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      stationId: '',
      role: '',
      approvalStatus: '',
      fromDate: '',
      toDate: ''
    });
    setPage(1);
  };

  const getFilteredPendingList = () => {
    return pendingList.filter(item => {
      // Search matches name or HRMS ID
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const nameMatch = item.assessed_name?.toLowerCase().includes(term);
        const hrmsMatch = item.assessed_hrms_id?.toLowerCase().includes(term);
        if (!nameMatch && !hrmsMatch) return false;
      }
      // Station filter
      if (filters.stationId) {
        // Verify station matching (item might have station_name or station_code, wait, getPendingApprovalsForUser joins station code)
        // Since getStationsList returns ids, let's match station_id or we can do checking.
        // Let's verify: does item have s.id or station_name? Wait, in the repository we selected s.station_name, s.station_code.
        // So filters.stationId matches s.id. We can find the selected station object code or match it.
        const stationObj = stations.find(s => s.id === filters.stationId);
        if (stationObj && item.station_code !== stationObj.station_code) return false;
      }
      // Role filter
      if (filters.role && item.assessed_role_code !== filters.role) {
        return false;
      }
      // Date range filter
      if (filters.fromDate && item.evaluated_at) {
        const evalDate = new Date(item.evaluated_at);
        const fromDate = new Date(filters.fromDate);
        if (evalDate < fromDate) return false;
      }
      if (filters.toDate && item.evaluated_at) {
        const evalDate = new Date(item.evaluated_at);
        const toDate = new Date(filters.toDate);
        // Extend toDate to end of the day
        toDate.setHours(23, 59, 59, 999);
        if (evalDate > toDate) return false;
      }
      return true;
    });
  };

  const visiblePending = getFilteredPendingList();

  // Role selections based on current authority
  const getRoleOptions = () => {
    if (user.role === 'SM' || user.role === 'SS') {
      return [
        { code: 'TM', name: 'Train Manager' }
      ];
    } else if (user.role === 'TI' || ['SMS', 'STATION MASTER SUPERVISOR', 'Station Master Supervisor', 'Station Master Supervisior', 'Station Master Supervisio'].includes(user.role)) {
      return [
        { code: 'PM', name: 'Pointsman' },
        { code: 'Shunting Master', name: 'Shunting Master' }
      ];
    } else if (user.role === 'AOM') {
      return [
        { code: 'SM', name: 'Station Master' },
        { code: 'TM', name: 'Train Manager' },
        { code: 'SS', name: 'SM Incharge' },
        { code: 'TI', name: 'Traffic Inspector' }
      ];
    } else {
      // SUPER_ADMIN
      return [
        { code: 'PM', name: 'Pointsman' },
        { code: 'SM', name: 'Station Master' },
        { code: 'TM', name: 'Train Manager' },
        { code: 'SS', name: 'SM Incharge' },
        { code: 'TI', name: 'Traffic Inspector' },
        { code: 'Shunting Master', name: 'Shunting Master' }
      ];
    }
  };

  const roleOptions = getRoleOptions();

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleReviewClick = (assessmentId, assessedRole) => {
    setSelectedAssessmentId(assessmentId);
    setSelectedRoleCode(assessedRole);
  };

  const handleActionSuccess = () => {
    setFeedback({
      type: 'success',
      message: 'Approval action successfully synchronized with employee logs.'
    });
    setTimeout(() => setFeedback(null), 4000);
    loadData();
  };

  const handleExportExcel = () => {
    try {
      let dataToExport = [];
      let filename = '';

      if (activeTab === 'pending') {
        filename = 'Pending_Assessments_Report.xlsx';
        // Filter pendingList using current filters
        const filteredPending = pendingList.filter(row => {
          const matchesSearch = !filters.search || 
            row.assessed_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            row.assessed_hrms_id.toLowerCase().includes(filters.search.toLowerCase());
          const matchesStation = !filters.stationId || String(row.station_id) === String(filters.stationId);
          const matchesRole = !filters.role || row.assessed_role_code === filters.role;
          
          let matchesDate = true;
          if (filters.fromDate || filters.toDate) {
            const evalDate = new Date(row.evaluated_at);
            if (filters.fromDate && evalDate < new Date(filters.fromDate)) matchesDate = false;
            if (filters.toDate && evalDate > new Date(filters.toDate + 'T23:59:59')) matchesDate = false;
          }

          return matchesSearch && matchesStation && matchesRole && matchesDate;
        });

        dataToExport = filteredPending.map(row => ({
          'Assessment ID': row.id,
          'Employee Name': row.assessed_name,
          'HRMS ID': row.assessed_hrms_id,
          'Role': roleNameMap[row.assessed_role_code] || row.assessed_role_code,
          'Station': row.station_name ? `${row.station_name} (${row.station_code})` : row.station_code || '-',
          'Assessor': row.assessor_name,
          'Assessor Role': roleNameMap[row.assessor_role_code] || row.assessor_role_code,
          'Assessment Type': row.assessment_type || 'Periodic Assessment',
          'Total Score': `${row.total_score} (${parseFloat(row.percentage || 0).toFixed(1)}%)`,
          'Pass/Fail': parseFloat(row.percentage) >= 60 ? 'PASS' : 'FAIL',
          'Submitted Date': formatDate(row.evaluated_at)
        }));
      } else {
        filename = 'Completed_Assessments_Report.xlsx';
        dataToExport = historyList.map(row => ({
          'Assessment ID': row.assessmentId,
          'Employee Name': row.assessedUserName,
          'HRMS ID': row.hrmsId,
          'Role': roleNameMap[row.role] || row.role,
          'Station': row.stationName || '-',
          'Total Score': `${row.totalScore} (${parseFloat(row.percentage || 0).toFixed(1)}%)`,
          'Sign-off Status': row.approvalStatus === 'approved' ? 'Approved' : 'Rejected',
          'Processed By': row.approvalStatus === 'approved' ? row.approvedBy : row.rejectedBy || '-',
          'Action Date': formatDate(row.approvalStatus === 'approved' ? row.approvedAt : row.rejectedAt),
          'Remarks / Reasons': row.approvalStatus === 'approved' ? row.approvalRemark : row.rejectionReason || '-'
        }));
      }

      if (dataToExport.length === 0) {
        alert("No data available to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      const maxLens = {};
      dataToExport.forEach(row => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || key.length, valStr.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Error exporting Excel: " + err.message);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (!isApprover) return <Navigate to="/unauthorized" replace />;

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
              Safety Sign-offs & Approvals
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              Review, modify evaluation parameters, and issue category certification sign-offs for railway crew.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0B2341',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(11, 35, 65, 0.15)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1B365D'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2341'}
          >
            <Download size={15} />
            <span>Export to Excel</span>
          </button>
        </div>

        {/* Feedback Alert banner */}
        {feedback && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckSquare className="text-emerald-600" size={20} />
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          gap: '24px',
          marginTop: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none', // Firefox
        }}>
          <button
            onClick={() => { setActiveTab('pending'); setPage(1); }}
            style={{
              padding: '12px 8px',
              fontSize: '15px',
              fontWeight: 700,
              color: activeTab === 'pending' ? 'var(--primary-navy)' : '#64748B',
              borderBottom: activeTab === 'pending' ? '3px solid var(--primary-navy)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <CheckSquare size={16} />
            <span>Pending Approvals</span>
            <span style={{
              backgroundColor: activeTab === 'pending' ? 'var(--primary-navy)' : '#E2E8F0',
              color: activeTab === 'pending' ? '#FFFFFF' : '#475569',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              marginLeft: '4px'
            }}>
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setPage(1); }}
            style={{
              padding: '12px 8px',
              fontSize: '15px',
              fontWeight: 700,
              color: activeTab === 'history' ? 'var(--primary-navy)' : '#64748B',
              borderBottom: activeTab === 'history' ? '3px solid var(--primary-navy)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <History size={16} />
            <span>Approval History Log</span>
          </button>
        </div>

        {/* Filters Card */}
        <div className="filter-card shadow-sm" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0B2341', fontWeight: 700, fontSize: '14px' }}>
            <Filter size={16} />
            <span>Filter List</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'end'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Search Employee</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search Employee / HRMS ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Station Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Station</label>
              <select
                value={filters.stationId}
                disabled={stationsLoading}
                onChange={(e) => handleFilterChange('stationId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="">All Stations</option>
                {(user?.role === 'TI' ? stations.filter(st => !st.hasSupervisor) : stations).map(st => (
                  <option key={st.id} value={st.id}>{st.station_name} ({st.station_code})</option>
                ))}
              </select>
            </div>

            {/* Role Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="">All Roles</option>
                {roleOptions.map(r => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown (History Only) */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Sign-off Status</label>
                <select
                  value={filters.approvalStatus}
                  onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}

            {/* From Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none'
                }}
                title="From Date"
              />
            </div>

            {/* To Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none'
                }}
                title="To Date"
              />
            </div>

            {/* Reset Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'transparent', userSelect: 'none' }}>Actions</label>
              <button
                onClick={handleResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: '42px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '24px' }}>
              <TableSkeleton />
            </div>
          ) : error ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--error)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600 }}>{error}</p>
              <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={loadData}>Retry Connection</button>
            </div>
          ) : activeTab === 'pending' ? (
            /* PENDING QUEUE TABLE */
            visiblePending.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No pending approvals found matching the filters.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="workforce-table" style={{ fontSize: '14px' }}>
                  <thead>
                    <tr style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Assessment ID</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Employee Name</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>HRMS ID</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Role</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Station</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Assessor</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Assessor Role</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Assessment Type</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Total Score</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Submitted Date</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePending.map((row) => (
                      <tr key={row.id} className="hover-row">
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600', color: '#0B2341' }}>
                          {row.id.substring(0, 8)}...
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600' }}>
                          {row.assessed_name}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', color: '#475569' }}>
                          {row.assessed_hrms_id}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <span className="sidebar-role-badge" style={{ marginTop: 0 }}>{cleanDesignationText(row.assessed_role_code)}</span>
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '500' }}>
                          {row.station_name ? `${row.station_name} (${row.station_code})` : row.station_code || '-'}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {row.assessor_name}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', color: '#64748B' }}>
                          {cleanDesignationText(row.assessor_role_code)}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {row.assessment_type || 'Periodic Assessment'}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '700' }}>
                          {row.total_score} ({parseFloat(row.percentage || 0).toFixed(1)}%)
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {formatDate(row.evaluated_at)}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            onClick={() => handleReviewClick(row.id, row.assessed_role_code)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--primary-navy)',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-navy-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-navy)'}
                          >
                            <span>Review</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* APPROVAL HISTORY TABLE */
            historyList.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No approval history records found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="workforce-table" style={{ fontSize: '14px' }}>
                  <thead>
                    <tr style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Assessment ID</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Employee Name</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>HRMS ID</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Role</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Station</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Total Score</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Sign-off Status</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Processed By</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Action Date</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Remarks / Reasons</th>
                      <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((row) => (
                      <tr key={row.assessmentId} className="hover-row">
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600', color: '#0B2341' }}>
                          {row.assessmentId.substring(0, 8)}...
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600' }}>
                          {row.assessedUserName}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', color: '#475569' }}>
                          {row.hrmsId}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <span className="sidebar-role-badge" style={{ marginTop: 0 }}>{cleanDesignationText(row.role)}</span>
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {row.stationName || '-'}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '700' }}>
                          {row.totalScore} ({parseFloat(row.percentage || 0).toFixed(1)}%)
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {row.approvalStatus === 'approved' ? (
                            <span className="status-badge status-approved">Approved</span>
                          ) : (
                            <span className="status-badge status-rejected">Rejected</span>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '500' }}>
                          {row.approvalStatus === 'approved' ? row.approvedBy : row.rejectedBy || '-'}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {formatDate(row.approvalStatus === 'approved' ? row.approvedAt : row.rejectedAt)}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'left', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span title={row.approvalStatus === 'approved' ? row.approvalRemark : row.rejectionReason}>
                            {row.approvalStatus === 'approved' ? row.approvalRemark : row.rejectionReason || '-'}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            className="btn-icon btn-view"
                            onClick={() => handleReviewClick(row.assessmentId, row.role)}
                            style={{ height: '36px', width: '36px', padding: 0, borderRadius: '8px' }}
                            title="View Scorecard"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* History Pagination */}
        {activeTab === 'history' && totalItems > 0 && (
          <DrillDownPagination
            pagination={{
              total: totalItems,
              page,
              limit,
              totalPages
            }}
            onPageChange={(p) => setPage(p)}
          />
        )}

      </div>

      {/* Review Detail Modal popup */}
      {selectedAssessmentId && (
        <ApprovalDetailModal
          assessmentId={selectedAssessmentId}
          roleCode={selectedRoleCode}
          userRole={user.role}
          onClose={() => { setSelectedAssessmentId(null); setSelectedRoleCode(null); }}
          onActionSuccess={handleActionSuccess}
        />
      )}
    </DashboardLayout>
  );
};

export default ApprovalsPage;
