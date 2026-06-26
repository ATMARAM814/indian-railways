import React from 'react';
import { Search } from 'lucide-react';

const WorkforceFilters = ({
  filters,
  onChange,
  onReset,
  stations = [],
  showStation = true
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="drilldown-filters-card" style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #D7E3EF', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
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
              value={filters.search || ''}
              onChange={handleChange}
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

        {/* Station Filter (Conditional) */}
        {showStation && (
          <div>
            <label htmlFor="stationId" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Station</label>
            <select
              id="stationId"
              name="stationId"
              value={filters.stationId || ''}
              onChange={handleChange}
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

        {/* Category Filter */}
        <div>
          <label htmlFor="category" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Safety Category</label>
          <select
            id="category"
            name="category"
            value={filters.category || ''}
            onChange={handleChange}
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
            <option value="">All Categories</option>
            <option value="A">Category A</option>
            <option value="B">Category B</option>
            <option value="C">Category C</option>
            <option value="D">Category D</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <label htmlFor="riskLevel" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Risk Level</label>
          <select
            id="riskLevel"
            name="riskLevel"
            value={filters.riskLevel || ''}
            onChange={handleChange}
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
            <option value="">All Risks</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="NOT_CATEGORIZED">Uncategorized</option>
          </select>
        </div>

        {/* Reset Button */}
        <div>
          <button
            type="button"
            onClick={onReset}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13.5px',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              height: '41px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
          >
            Clear Filters
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkforceFilters;
