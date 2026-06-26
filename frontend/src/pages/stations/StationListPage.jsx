// StationListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { getScopedStations, createStation } from '../../services/stationIntelligence.service';
import { getWorkforceList, getDivisionsList } from '../../services/workforce.service';
import { useAuth } from '../../context/AuthContext';
import { Building, Search, PlusCircle, LayoutGrid, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import '../../styles/station-intelligence.css';

const StationListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search filter states
  const [filters, setFilters] = useState({
    stationName: '',
    stationCode: '',
    assignedTI: '',
  });

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationCode, setNewStationCode] = useState('');
  const [newDivisionId, setNewDivisionId] = useState('');
  const [assignedSMId, setAssignedSMId] = useState('');
  const [assignedTIId, setAssignedTIId] = useState('');
  const [divisions, setDivisions] = useState([]);
  const [stationMasters, setStationMasters] = useState([]);
  const [trafficInspectors, setTrafficInspectors] = useState([]);
  const [modalError, setModalError] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const openCreateModal = async () => {
    setIsModalOpen(true);
    setModalError(null);
    setNewStationName('');
    setNewStationCode('');
    setNewDivisionId('');
    setAssignedSMId('');
    setAssignedTIId('');
    
    try {
      const divRes = await getDivisionsList();
      if (divRes.success) {
        setDivisions(divRes.data);
      }

      const smRes = await getWorkforceList({ role: 'SM', limit: 100 });
      const ssRes = await getWorkforceList({ role: 'SS', limit: 100 });
      let sms = [];
      if (smRes.success && smRes.data.users) {
        sms = [...smRes.data.users];
      }
      if (ssRes.success && ssRes.data.users) {
        sms = [...sms, ...ssRes.data.users];
      }
      setStationMasters(sms);

      if (['AOM', 'SUPER_ADMIN'].includes(user?.role)) {
        const tiRes = await getWorkforceList({ role: 'TI', limit: 100 });
        if (tiRes.success && tiRes.data.users) {
          setTrafficInspectors(tiRes.data.users);
        }
      }
    } catch (err) {
      console.error("Failed to load options for new station:", err);
      setModalError("Failed to load division or employee list.");
    }
  };

  const handleCreateStation = async (e) => {
    e.preventDefault();
    if (!newStationName.trim() || !newStationCode.trim()) {
      setModalError("Station Name and Code are required.");
      return;
    }
    if (user?.role !== 'TI' && !newDivisionId) {
      setModalError("Please select a Division.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        stationName: newStationName.trim(),
        stationCode: newStationCode.trim().toUpperCase(),
        divisionId: newDivisionId || undefined,
        assignedSMId: assignedSMId || undefined,
        assignedTIId: assignedTIId || undefined
      };

      const res = await createStation(payload);
      if (res.success) {
        setIsModalOpen(false);
        loadStations(filters);
      } else {
        setModalError(res.message || "Failed to create station.");
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const loadStations = async (currentFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getScopedStations(currentFilters);
      if (res.success) {
        setStations(res.data);
      } else {
        setError(res.message || 'Failed to load station list.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'An error occurred while loading stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleFilterChange = (name, value) => {
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadStations(filters);
  };

  const handleResetFilters = () => {
    const cleared = { stationName: '', stationCode: '', assignedTI: '' };
    setFilters(cleared);
    setCurrentPage(1);
    loadStations(cleared);
  };

  // Render compliance badge
  const renderComplianceValue = (val) => {
    const num = Number(val || 0);
    let className = 'low-compliance';
    if (num >= 80) className = 'high-compliance';
    else if (num >= 50) className = 'medium-compliance';

    return (
      <span className={`compliance-text ${className}`}>
        {num}%
      </span>
    );
  };

  const totalRecords = stations.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const paginatedStations = stations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="station-intelligence-container">
        
        {/* Hero Header Banner */}
        <div className="station-intelligence-banner">
          <div className="station-intelligence-info">
            <h1 className="station-intelligence-title">Station Intelligence Registry</h1>
            <span className="station-intelligence-subtitle">
              Monitor operational visibility, safety compliance, and workforce readiness across all stations.
            </span>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '12px',
            borderRadius: '12px',
            color: '#FFFFFF'
          }}>
            <Building size={24} />
          </div>
        </div>

        {/* Search Filters form */}
        <form onSubmit={handleSearchSubmit} className="unified-filters-bar">
          <div className="filter-input-block">
            <span className="filter-input-label">Station Name</span>
            <input
              type="text"
              placeholder="Search station name..."
              className="filter-text-input"
              value={filters.stationName}
              onChange={(e) => handleFilterChange('stationName', e.target.value)}
            />
          </div>

          <div className="filter-input-block">
            <span className="filter-input-label">Station Code</span>
            <input
              type="text"
              placeholder="Search station code..."
              className="filter-text-input"
              value={filters.stationCode}
              onChange={(e) => handleFilterChange('stationCode', e.target.value)}
            />
          </div>

          <div className="filter-input-block">
            <span className="filter-input-label">Assigned TI</span>
            <input
              type="text"
              placeholder="Search inspector..."
              className="filter-text-input"
              value={filters.assignedTI}
              onChange={(e) => handleFilterChange('assignedTI', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', height: '40px' }}>
            <button type="submit" className="btn-open-intel" style={{ height: '40px', gap: '4px' }}>
              <Search size={16} /> Search
            </button>
            <button type="button" className="reset-filters-btn" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>

        {/* Stations Table */}
        {loading ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <LoadingState message="Scanning station metrics and safety data..." />
          </div>
        ) : error ? (
          <ErrorState title="Error Loading Stations" message={error} />
        ) : (
          <div className="staff-table-card">
            <div className="staff-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 className="staff-table-title">Operational Stations Roll</h3>
                <span className="staff-table-badge">Active Stations: {stations.length}</span>
              </div>
              <button 
                type="button" 
                className="btn-open-intel" 
                style={{ backgroundColor: '#2B5CE6', color: '#FFFFFF', gap: '6px' }}
                onClick={openCreateModal}
              >
                <PlusCircle size={16} /> Add New Station
              </button>
            </div>

            <div className="staff-table-wrapper">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Station Name</th>
                    <th>Station Code</th>
                    <th>Assigned TI</th>
                    <th>Total Staff</th>
                    <th>Safety Compliance %</th>
                    <th>Pending Assessments</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStations.map((row) => (
                    <tr key={row.stationId} className="hover-row">
                      <td style={{ fontWeight: 700, color: '#0B2341' }}>
                        {row.stationName}
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#475569' }}>
                        {row.stationCode}
                      </td>
                      <td>
                        {row.assignedTI ? (
                           <span style={{ fontWeight: 500, color: '#1E293B' }}>{row.assignedTI}</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>
                        {row.totalStaff || 0}
                      </td>
                      <td>
                        {renderComplianceValue(row.safetyCompliance)}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {row.pendingAssessments > 0 ? (
                          <span style={{ color: '#D97706' }}>{row.pendingAssessments} Pending</span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>0 Pending</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/stations/${row.stationId}`)}
                          className="btn-open-intel"
                        >
                          <LayoutGrid size={14} /> Open Intelligence Center
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedStations.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '48px', fontSize: '14px', fontWeight: 500 }}>
                        No stations match the search filters or are within your authorized scoping.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 12px 12px',
                borderTop: '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Showing <strong style={{ color: '#0F172A' }}>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * itemsPerPage, totalRecords)}</strong> of <strong style={{ color: '#0F172A' }}>{totalRecords}</strong> stations
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: currentPage === 1 ? '#94A3B8' : '#475569',
                      backgroundColor: currentPage === 1 ? '#F8FAFC' : '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: currentPage === totalPages ? '#94A3B8' : '#475569',
                      backgroundColor: currentPage === totalPages ? '#F8FAFC' : '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Station Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="staff-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
              <div className="staff-modal-header">
                <h3 className="staff-modal-title">Add New Operational Station</h3>
                <button className="staff-modal-close-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateStation}>
                <div className="staff-modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                  {modalError && (
                    <div style={{ 
                      padding: '12px 16px', 
                      backgroundColor: '#FEE2E2', 
                      color: '#991B1B', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      fontWeight: 500, 
                      marginBottom: '16px',
                      border: '1px solid #FCA5A5'
                    }}>
                      {modalError}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>STATION NAME</label>
                    <input
                      type="text"
                      className="filter-text-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="e.g. Bhopal Junction"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>STATION CODE</label>
                    <input
                      type="text"
                      className="filter-text-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="e.g. BPL"
                      value={newStationCode}
                      onChange={(e) => setNewStationCode(e.target.value)}
                      required
                    />
                  </div>

                  {user?.role !== 'TI' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>DIVISION</label>
                      <select
                        className="filter-text-input"
                        style={{ width: '100%', height: '40px', boxSizing: 'border-box' }}
                        value={newDivisionId}
                        onChange={(e) => setNewDivisionId(e.target.value)}
                        required
                      >
                        <option value="">Select Division</option>
                        {divisions.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                      ASSIGN STATION MASTER {user?.role === 'TI' ? '(REQUIRED)' : '(OPTIONAL)'}
                    </label>
                    <select
                      className="filter-text-input"
                      style={{ width: '100%', height: '40px', boxSizing: 'border-box' }}
                      value={assignedSMId}
                      onChange={(e) => setAssignedSMId(e.target.value)}
                      required={user?.role === 'TI'}
                    >
                      <option value="">Select Station Master</option>
                      {stationMasters.map(sm => (
                        <option key={sm.id} value={sm.id}>{sm.full_name} ({sm.hrms_id || sm.employee_id})</option>
                      ))}
                    </select>
                  </div>

                  {['AOM', 'SUPER_ADMIN'].includes(user?.role) && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>ASSIGN TRAFFIC INSPECTOR (OPTIONAL)</label>
                      <select
                        className="filter-text-input"
                        style={{ width: '100%', height: '40px', boxSizing: 'border-box' }}
                        value={assignedTIId}
                        onChange={(e) => setAssignedTIId(e.target.value)}
                      >
                        <option value="">Select Traffic Inspector</option>
                        {trafficInspectors.map(ti => (
                          <option key={ti.id} value={ti.id}>{ti.full_name} ({ti.hrms_id})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="staff-modal-footer">
                  <button type="button" className="staff-modal-close-btn" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-open-intel" style={{ backgroundColor: '#2B5CE6', color: '#FFFFFF' }} disabled={modalSubmitting}>
                    {modalSubmitting ? "Creating..." : "Create Station"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StationListPage;
