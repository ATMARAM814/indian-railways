// OverdueStaffPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getOverdueStaff } from '../../api/dashboardApi';
import { getCandidateCounselingHistory } from '../../api/counselingApi';
import { 
  ArrowLeft, 
  Search, 
  Building2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Users, 
  ShieldAlert, 
  FileText,
  Loader2 
} from 'lucide-react';

const OverdueStaffPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = (user?.role || '').toUpperCase();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'C' | 'D'

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchOverdueStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOverdueStaff();
      if (res && res.success) {
        setStaffList(res.data || []);
      } else {
        setError(res?.message || 'Failed to retrieve overdue staff records.');
      }
    } catch (err) {
      console.error('Error fetching overdue staff:', err);
      setError(err.response?.data?.message || err.message || 'Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdueStaff();
  }, [fetchOverdueStaff]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'None';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const handleOpenHistory = async (staff) => {
    setSelectedStaff(staff);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await getCandidateCounselingHistory(staff.userId);
      if (res && res.success) {
        setHistoryList(res.data || []);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setHistoryModalOpen(false);
    setSelectedStaff(null);
    setHistoryList([]);
  };

  // Filtered staff records
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        (item.fullName && item.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.hrmsId && item.hrmsId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.role && item.role.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStation =
        !stationFilter ||
        (item.stationName && item.stationName.toLowerCase().includes(stationFilter.toLowerCase())) ||
        (item.stationCode && item.stationCode.toLowerCase().includes(stationFilter.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' || (item.category && item.category.toUpperCase() === categoryFilter);

      return matchesSearch && matchesStation && matchesCategory;
    });
  }, [staffList, searchTerm, stationFilter, categoryFilter]);

  // Summary counts
  const totalCount = staffList.length;
  const catCCount = staffList.filter((s) => (s.category || '').toUpperCase() === 'C').length;
  const catDCount = staffList.filter((s) => (s.category || '').toUpperCase() === 'D').length;

  const pageTitle = userRole.includes('TI')
    ? 'TI Overdue Staff Assessments'
    : userRole.includes('AOM')
    ? 'Division Overdue Staff Assessments'
    : 'System-Wide Overdue Staff Assessments';

  const pageSubtitle = userRole.includes('TI')
    ? 'Showing overdue staff assessments strictly within your assigned jurisdiction and stations.'
    : userRole.includes('AOM')
    ? 'Showing overdue staff assessments strictly within your authorized division.'
    : 'Showing all overdue staff assessments across the railway system.';

  return (
    <DashboardLayout>
      <div
        style={{
          padding: '24px',
          fontFamily: "'Poppins', 'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Header with Back Button and Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              title="Back"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D7E3EF',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                color: '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0B2341', margin: 0 }}>
                  {pageTitle}
                </h1>
                <span
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '12px'
                  }}
                >
                  {totalCount} OVERDUE
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                {pageSubtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchOverdueStaff}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Metric summary badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Overdue Staff
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0B2341' }}>{totalCount}</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Category D (High Risk)
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>{catDCount}</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Category C (Medium Risk)
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>{catCCount}</div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            alignItems: 'center'
          }}
        >
          {/* Search by Name or HRMS ID */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Employee Name or HRMS ID..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                fontSize: '13.5px',
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Search by Station */}
          <div style={{ position: 'relative' }}>
            <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
            <input
              type="text"
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              placeholder="Search Station Name or Code..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                fontSize: '13.5px',
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="C">Category C</option>
              <option value="D">Category D</option>
            </select>
          </div>
        </div>

        {/* Results Table Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: '#0B2341' }} />
              <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                Loading overdue assessment records from database...
              </span>
            </div>
          ) : error ? (
            <div style={{ padding: '24px', backgroundColor: '#FEF2F2', borderBottom: '1px solid #FCA5A5', color: '#991B1B', fontSize: '14px' }}>
              {error}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Staff Details
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Station
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Risk Category
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Previous Date
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Next Due Date
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Status
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => {
                    const isCatD = (staff.category || '').toUpperCase() === 'D';
                    const catBg = isCatD ? '#FEE2E2' : '#FEF3C7';
                    const catColor = isCatD ? '#DC2626' : '#D97706';

                    return (
                      <tr
                        key={staff.userId}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Staff Details */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0B2341' }}>
                            {staff.fullName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            HRMS ID: {staff.hrmsId} | {staff.role}
                          </div>
                        </td>

                        {/* Station */}
                        <td style={{ padding: '16px 20px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                          {staff.stationName} ({staff.stationCode})
                        </td>

                        {/* Risk Category */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              backgroundColor: catBg,
                              color: catColor,
                              display: 'inline-block'
                            }}
                          >
                            Category {staff.category}
                          </span>
                        </td>

                        {/* Previous Date */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                          {formatDate(staff.prevCounselingDate)}
                        </td>

                        {/* Next Due Date */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#1E293B', fontWeight: 600 }}>
                          {staff.nextDueDate ? formatDate(staff.nextDueDate) : 'Immediate'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              letterSpacing: '0.5px',
                              display: 'inline-block'
                            }}
                          >
                            OVERDUE
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenHistory(staff)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                            >
                              History ({staff.historyCount || 0})
                            </button>
                            <button
                              onClick={() => navigate(`/counseling?candidateId=${staff.userId}`)}
                              style={{
                                padding: '6px 14px',
                                backgroundColor: '#EF4444',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(239, 68, 68, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EF4444')}
                            >
                              Counsel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '48px 24px', fontSize: '13.5px', fontWeight: 500 }}>
                        {staffList.length === 0
                          ? 'No overdue staff assessments found. All personnel are up to date!'
                          : 'No staff match the specified search or filter criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History Modal */}
        {historyModalOpen && selectedStaff && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80vh',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #D7E3EF'
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0B2341' }}>
                    Counseling & Retest History Log
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                    {selectedStaff.fullName} ({selectedStaff.hrmsId}) • {selectedStaff.stationName}
                  </p>
                </div>
                <button
                  onClick={handleCloseHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#64748B',
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {historyLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: '#0B2341' }} />
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Loading history records...</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                    No prior counseling history found for this employee.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {historyList.map((log, index) => (
                      <div
                        key={log.id || index}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: '#F8FAFC'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>
                            Cycle Completed #{historyList.length - index}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                            Completed: {formatDate(log.completedAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span>
                            <strong>Counseled By:</strong> {log.completedByName || 'N/A'}
                          </span>
                          <span>
                            <strong>Post-Retest Score:</strong>{' '}
                            {log.retestScore !== null && log.retestScore !== undefined ? (
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: Number(log.retestScore) >= 50 ? '#10B981' : '#EF4444'
                                }}
                              >
                                {parseFloat(log.retestScore).toFixed(1)}%
                              </span>
                            ) : (
                              <span style={{ color: '#F59E0B', fontWeight: 600 }}>Retest Pending</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  backgroundColor: '#F8FAFC',
                  borderBottomLeftRadius: '16px',
                  borderBottomRightRadius: '16px'
                }}
              >
                <button
                  onClick={handleCloseHistory}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OverdueStaffPage;
