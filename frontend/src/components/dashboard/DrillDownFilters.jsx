// DrillDownFilters.jsx
import React, { useEffect, useState } from 'react';

const DrillDownFilters = ({ filters, onFilterChange, onReset, graphType }) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localStationName, setLocalStationName] = useState(filters.stationName || '');
  const [localStationCode, setLocalStationCode] = useState(filters.stationCode || '');

  // Debounce search/name/code inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange('search', localSearch);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localStationName !== filters.stationName) {
        onFilterChange('stationName', localStationName);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localStationName]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localStationCode !== filters.stationCode) {
        onFilterChange('stationCode', localStationCode);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localStationCode]);

  // Sync state if filters reset externally
  useEffect(() => {
    setLocalSearch(filters.search || '');
    setLocalStationName(filters.stationName || '');
    setLocalStationCode(filters.stationCode || '');
  }, [filters.search, filters.stationName, filters.stationCode]);

  const showStationFilters = graphType !== 'workforceActivity' && graphType !== 'highRiskStaff';
  const showWorkforceFilters = graphType === 'workforceActivity';
  const showHighRiskFilters = graphType === 'highRiskStaff';

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {graphType === 'workforceActivity' ? 'WORKFORCE MOVEMENT FILTER CONSOLE' : graphType === 'highRiskStaff' ? 'HIGH-RISK CONCENTRATION FILTER CONSOLE' : 'OPERATIONAL SEARCH & DIAGNOSTICS FILTERS'}
        </span>
        <button 
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#2B5CE6',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Reset Filters
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '16px',
        alignItems: 'end'
      }}>
        {/* Search Employee / Quick Search */}
        {graphType !== 'highRiskStaff' && graphType !== 'workforceActivity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              Quick Search
            </label>
            <input 
              type="text"
              placeholder="Search station..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>
        )}

        {/* Station name or Station Code for Workforce / HighRisk */}
        {(showStationFilters || showWorkforceFilters || showHighRiskFilters) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Station</label>
            <input 
              type="text"
              placeholder="Station name/code..."
              value={localStationName}
              onChange={(e) => setLocalStationName(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>
        )}

        {/* Station Code for defaults */}
        {showStationFilters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Station Code</label>
            <input 
              type="text"
              placeholder="Filter by code..."
              value={localStationCode}
              onChange={(e) => setLocalStationCode(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>
        )}

        {/* Role Filter for Workforce and HighRisk */}
        {(showWorkforceFilters || showHighRiskFilters) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Role</label>
            <select 
              value={filters.role || ''}
              onChange={(e) => onFilterChange('role', e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                width: '100%'
              }}
            >
              <option value="">All Roles</option>
              <option value="PM">Pointsmen</option>
              <option value="SM">Station Masters</option>
              <option value="TM">Train Managers</option>
              <option value="Station Master Supervisor">SM Supervisors</option>
              <option value="Cabin Master">Cabin Masters</option>
              <option value="Shunting Master">Shunting Masters</option>
              <option value="SS">SM Incharges</option>
              <option value="TI">Traffic Inspectors</option>
              {showWorkforceFilters && <option value="AOM">Operations Managers</option>}
            </select>
          </div>
        )}

        {/* Activity Type Filter for Workforce */}
        {showWorkforceFilters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Activity Type</label>
            <select 
              value={filters.activityType || ''}
              onChange={(e) => onFilterChange('activityType', e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                width: '100%'
              }}
            >
              <option value="">All Activities</option>
              <option value="Created">Created</option>
              <option value="Transferred">Transferred</option>
              <option value="Deactivated">Deactivated</option>
              <option value="Reactivated">Reactivated</option>
            </select>
          </div>
        )}

        {/* Category */}
        {graphType !== 'highRiskStaff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Category</label>
            <select 
              value={filters.category || ''}
              onChange={(e) => onFilterChange('category', e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                width: '100%'
              }}
            >
              <option value="">All Categories</option>
              <option value="A">Category A</option>
              <option value="B">Category B</option>
              <option value="C">Category C</option>
              <option value="D">Category D</option>
            </select>
          </div>
        )}

        {/* Risk Level Filter (For default and HighRisk) */}
        {showStationFilters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Risk Level</label>
            <select 
              value={filters.riskLevel || ''}
              onChange={(e) => onFilterChange('riskLevel', e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                width: '100%'
              }}
            >
              <option value="">All Risks</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        )}

        {/* Start Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Start Date</label>
          <input 
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            style={{
              padding: '7px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#0F172A',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* End Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>End Date</label>
          <input 
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            style={{
              padding: '7px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#0F172A',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DrillDownFilters;
