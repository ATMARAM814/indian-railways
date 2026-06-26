import React, { useState, useEffect } from 'react';
import { getStationsList } from '../../services/workforce.service';
import { Search, Calendar, Filter, RotateCcw } from 'lucide-react';

const ReportFilters = ({ onApplyFilters, onResetFilters, userRole }) => {
  const [role, setRole] = useState('');
  const [stationId, setStationId] = useState('');
  const [category, setCategory] = useState('');
  const [assessmentStatus, setAssessmentStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [assessmentCycle, setAssessmentCycle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [stations, setStations] = useState([]);

  useEffect(() => {
    // Only load stations dropdown for roles that see multiple stations
    if (['AOM', 'SUPER_ADMIN', 'TI'].includes(userRole)) {
      getStationsList()
        .then(res => {
          if (res.success) setStations(res.data);
        })
        .catch(err => console.error('Failed to load stations for filters', err));
    }
  }, [userRole]);

  const handleApply = (e) => {
    e.preventDefault();
    onApplyFilters({
      role,
      stationId,
      category,
      assessmentStatus,
      approvalStatus,
      assessmentCycle,
      fromDate,
      toDate,
      search
    });
  };

  const handleReset = () => {
    setRole('');
    setStationId('');
    setCategory('');
    setAssessmentStatus('');
    setApprovalStatus('');
    setAssessmentCycle('');
    setFromDate('');
    setToDate('');
    setSearch('');
    onResetFilters();
  };

  // Auto-apply filters when any state changes (with debounce for search keystrokes)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onApplyFilters({
        role,
        stationId,
        category,
        assessmentStatus,
        approvalStatus,
        assessmentCycle,
        fromDate,
        toDate,
        search
      });
    }, search ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [role, stationId, category, assessmentStatus, approvalStatus, assessmentCycle, fromDate, toDate, search, onApplyFilters]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="filter-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
        <Filter size={16} style={{ color: '#0B2341' }} />
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#0B2341' }}>Filters & Search Control</span>
      </div>

      <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {/* Search */}
        <div className="filter-item">
          <label className="filter-label">Search Staff</label>
          <div className="search-input-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="filter-input search-input"
              placeholder="Name, HRMS ID, Station Code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Role Filter */}
        {['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SM', 'SS', 'Cabin Master', 'CABIN MASTER'].includes(userRole) && (
          <div className="filter-item">
            <label className="filter-label">Role</label>
            <select
              className="filter-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="">All Roles</option>
              <option value="PM">Pointsman (PM)</option>
              <option value="SM">Station Master (SM)</option>
              <option value="TM">Train Manager (TM)</option>
              <option value="Station Master Supervisor">Station Master Supervisor (SMS)</option>
              <option value="Cabin Master">Cabin Master (CM)</option>
              <option value="Shunting Master">Shunting Master (SHM)</option>
              {['AOM', 'SUPER_ADMIN'].includes(userRole) && (
                <>
                  <option value="SS">SM Incharge</option>
                  <option value="TI">Traffic Inspector (TI)</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* Station Filter */}
        {['TI', 'AOM', 'SUPER_ADMIN'].includes(userRole) && (
          <div className="filter-item">
            <label className="filter-label">Station</label>
            <select
              className="filter-input"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="">All Stations</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.station_code} - {st.station_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        <div className="filter-item">
          <label className="filter-label">Category</label>
          <select
            className="filter-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Categories</option>
            <option value="A">Category A</option>
            <option value="B">Category B</option>
            <option value="C">Category C</option>
            <option value="D">Category D (High Risk)</option>
          </select>
        </div>

        {/* Cycle */}
        <div className="filter-item">
          <label className="filter-label">Assessment Cycle</label>
          <select
            className="filter-input"
            value={assessmentCycle}
            onChange={(e) => setAssessmentCycle(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Cycles</option>
            <option value="Monthly Assessment">Monthly Assessment</option>
            <option value="Quarterly Assessment">Quarterly Assessment</option>
          </select>
        </div>

        {/* Status */}
        <div className="filter-item">
          <label className="filter-label">Assessment Status</label>
          <select
            className="filter-input"
            value={assessmentStatus}
            onChange={(e) => setAssessmentStatus(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="mcq_submitted">MCQ Submitted</option>
            <option value="evaluation_pending">Evaluation Pending</option>
          </select>
        </div>

        {/* Date From */}
        <div className="filter-item">
          <label className="filter-label">Date From</label>
          <input
            type="date"
            className="filter-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="filter-item">
          <label className="filter-label">Date To</label>
          <input
            type="date"
            className="filter-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {/* Reset Action Button */}
        <div className="filter-item" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
            style={{ 
              width: '100%', 
              height: '41px', 
              padding: '10px 14px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              fontSize: '13px', 
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>
        </div>
      </div>
    </form>
  );
};

export default ReportFilters;
