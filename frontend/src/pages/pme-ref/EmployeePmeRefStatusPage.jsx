// EmployeePmeRefStatusPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, AlertTriangle, CheckCircle2, Clock, ChevronLeft, ChevronRight, RefreshCw, Activity } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getEmployeePmeRefStatus } from '../../services/pmeRef.service';
import { getStationsList } from '../../services/workforce.service';
import { useAuth } from '../../context/AuthContext';
import { cleanDesignationText } from '../../utils/dashboardMappers';

const EmployeePmeRefStatusPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const [filters, setFilters] = useState({
    search: '',
    stationId: '',
    pmeStatus: '',
    refStatus: ''
  });

  const [activePage, setActivePage] = useState(1);

  // Load stations
  useEffect(() => {
    getStationsList()
      .then(res => {
        if (res.success) {
          setStations(res.data || []);
        }
      })
      .catch(err => console.error('Failed to load stations list', err));
  }, []);

  // Fetch employee PME/Ref status data
  const fetchStatusList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        ...filters,
        page: activePage,
        limit: 10
      };
      
      const res = await getEmployeePmeRefStatus(queryParams);
      if (res.success && res.data) {
        setUsers(res.data.users || []);
        setPagination(res.data.pagination || {
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          limit: 10
        });
      } else {
        setError(res.message || 'Failed to fetch status list.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching PME/REF status.');
    } finally {
      setLoading(false);
    }
  }, [filters, activePage]);

  useEffect(() => {
    fetchStatusList();
  }, [fetchStatusList]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setActivePage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      stationId: '',
      pmeStatus: '',
      refStatus: ''
    });
    setActivePage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const renderStatusBadge = (status, type) => {
    if (!status || status === '—') return <span style={{ color: '#94A3B8' }}>—</span>;
    const upper = status.toUpperCase();
    
    let styles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase'
    };

    if (upper === 'FIT' || upper === 'COMPLETED') {
      return (
        <span style={{ ...styles, backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
          <CheckCircle2 size={12} /> {upper}
        </span>
      );
    } else if (upper === 'OVERDUE' || upper === 'EXPIRED') {
      return (
        <span style={{ ...styles, backgroundColor: '#FFEBEE', color: '#C62828' }}>
          <AlertTriangle size={12} /> {upper}
        </span>
      );
    } else if (upper === 'DUE') {
      return (
        <span style={{ ...styles, backgroundColor: '#FFF3E0', color: '#EF6C00' }}>
          <Clock size={12} /> {upper}
        </span>
      );
    }

    return <span style={{ ...styles, backgroundColor: '#F1F5F9', color: '#475569' }}>{upper}</span>;
  };

  const showStationFilter = !['SM', 'SS', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Station Master Supervisor'].includes(user?.role);

  return (
    <DashboardLayout>
      <div style={{ padding: '32px', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Employee PME & REF Status</h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
              Monitor and track the Periodical Medical Examination (PME) and Refresher Course (REF) compliance of lower authority staff.
            </p>
          </div>
          <button 
            onClick={fetchStatusList}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#0B2341',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(11, 35, 65, 0.1)',
              transition: 'background-color 0.2s'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters Card */}
        <div style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #D7E3EF', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            
            {/* Search Input */}
            <div>
              <label htmlFor="search" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Search Name / HRMS ID</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  id="search"
                  type="text"
                  name="search"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    fontSize: '13.5px',
                    borderRadius: '8px',
                    border: '1px solid #D7E3EF',
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Station Filter */}
            {showStationFilter && (
              <div>
                <label htmlFor="stationId" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Station</label>
                <select
                  id="stationId"
                  name="stationId"
                  value={filters.stationId}
                  onChange={handleFilterChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13.5px',
                    borderRadius: '8px',
                    border: '1px solid #D7E3EF',
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Stations</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.station_name} ({st.station_code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* PME Status Filter */}
            <div>
              <label htmlFor="pmeStatus" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>PME Status</label>
              <select
                id="pmeStatus"
                name="pmeStatus"
                value={filters.pmeStatus}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13.5px',
                  borderRadius: '8px',
                  border: '1px solid #D7E3EF',
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All PME Statuses</option>
                <option value="FIT">Fit / Completed</option>
                <option value="DUE">Due</option>
                <option value="OVERDUE">Overdue / Expired</option>
              </select>
            </div>

            {/* REF Status Filter */}
            <div>
              <label htmlFor="refStatus" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>REF Status</label>
              <select
                id="refStatus"
                name="refStatus"
                value={filters.refStatus}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13.5px',
                  borderRadius: '8px',
                  border: '1px solid #D7E3EF',
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All REF Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="DUE">Due</option>
                <option value="OVERDUE">Overdue / Expired</option>
              </select>
            </div>

            {/* Reset Button */}
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#EEF2F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Reset Filters
              </button>
            </div>

          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #D7E3EF', textAlign: 'center', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
            <Activity size={32} className="spin-animation" style={{ color: '#0B2341', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>Loading Employee Status...</h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>Please wait while we fetch the records.</p>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #D7E3EF', textAlign: 'center', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
            <AlertTriangle size={32} style={{ color: '#DC2626', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>Failed to Load Data</h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px', marginBottom: '16px' }}>{error}</p>
            <button 
              onClick={fetchStatusList}
              style={{
                padding: '8px 16px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #D7E3EF', textAlign: 'center', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
            <Activity size={32} style={{ color: '#94A3B8', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>No Employees Found</h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>No staff members match the selected filters or hierarchy.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #D7E3EF', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HRMS ID</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Station</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PME Last Done</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PME Due</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PME Status</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REF Last Done</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REF Due</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REF Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #EEF2F6', transition: 'background-color 0.2s' }} className="table-row-hover">
                        
                        {/* Name & Designation */}
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#0F172A', fontSize: '14px' }}>{item.full_name}</strong>
                            <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{cleanDesignationText(item.designation || item.role)}</span>
                          </div>
                        </td>

                        {/* HRMS ID */}
                        <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#475569', fontFamily: 'monospace', fontWeight: 500 }}>
                          {item.hrms_id}
                        </td>

                        {/* Station */}
                        <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155' }}>
                          {item.station_name ? (
                            <div>
                              <span style={{ fontWeight: 600 }}>{item.station_code}</span>
                              <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '1px' }}>{item.station_name}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>—</span>
                          )}
                        </td>

                        {/* PME Last Done */}
                        <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155' }}>
                          {formatDate(item.pme_done)}
                        </td>

                        {/* PME Due */}
                        <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155' }}>
                          {formatDate(item.pme_due)}
                        </td>

                        {/* PME Status Badge */}
                        <td style={{ padding: '16px 24px' }}>
                          {renderStatusBadge(item.computed_pme_status)}
                        </td>

                        {/* REF Last Done */}
                        <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155' }}>
                          {formatDate(item.ref_done)}
                        </td>

                        {/* REF Due */}
                        <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155' }}>
                          {formatDate(item.ref_due)}
                        </td>

                        {/* REF Status Badge */}
                        <td style={{ padding: '16px 24px' }}>
                          {renderStatusBadge(item.computed_ref_status)}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #D7E3EF', backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: '13.5px', color: '#64748B' }}>
                    Showing <strong style={{ color: '#0F172A' }}>{users.length}</strong> of <strong style={{ color: '#0F172A' }}>{pagination.totalItems}</strong> employees
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setActivePage(prev => Math.max(prev - 1, 1))}
                      disabled={activePage === 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid #D7E3EF',
                        backgroundColor: '#FFFFFF',
                        color: activePage === 1 ? '#94A3B8' : '#475569',
                        cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 600, color: '#0F172A', padding: '0 8px' }}>
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <button
                      onClick={() => setActivePage(prev => Math.min(prev + 1, pagination.totalPages))}
                      disabled={activePage === pagination.totalPages}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid #D7E3EF',
                        backgroundColor: '#FFFFFF',
                        color: activePage === pagination.totalPages ? '#94A3B8' : '#475569',
                        cursor: activePage === pagination.totalPages ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default EmployeePmeRefStatusPage;
