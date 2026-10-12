// WorkforceFilters.jsx
import React from 'react';
import { Search, X } from 'lucide-react';
import { normalizeRoleKey } from './StationOverviewCards';

export const WorkforceFilters = ({ filters, onFilterChange, onReset }) => {
  const roleOptions = [
    { value: 'All', label: 'All Roles' },
    { value: 'PM', label: 'Pointsmen' },
    { value: 'SM', label: 'Station Masters' },
    { value: 'SS', label: 'SM Incharges' },
    { value: 'TM', label: 'Train Managers' },
    { value: 'SMS', label: 'SM Supervisors' },
    { value: 'SHM', label: 'Shunting Masters' },
    { value: 'CM', label: 'Cabin Masters' },
    { value: 'TI', label: 'Traffic Inspectors' },
    { value: 'AOM', label: 'AOM' },
  ];

  const categories = ['All', 'A', 'B', 'C', 'D'];
  const selectedRoleKey = normalizeRoleKey(filters.role);

  return (
    <div className="unified-filters-bar">
      {/* Search Input */}
      <div className="filter-input-block" style={{ minWidth: '260px' }}>
        <span className="filter-input-label">Search Staff</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search Name or HRMS ID..."
            className="filter-text-input"
            style={{ paddingLeft: '32px', paddingRight: filters.search ? '28px' : '10px' }}
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Role Filter */}
      <div className="filter-input-block">
        <span className="filter-input-label">Filter Role</span>
        <select
          className="filter-select"
          value={selectedRoleKey}
          onChange={(e) => onFilterChange('role', e.target.value)}
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className="filter-input-block">
        <span className="filter-input-label">Filter Category</span>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : `Category ${c}`}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <button type="button" className="reset-filters-btn" onClick={onReset}>
        Reset Filters
      </button>
    </div>
  );
};
export default WorkforceFilters;
