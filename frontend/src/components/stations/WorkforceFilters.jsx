// WorkforceFilters.jsx
import React from 'react';

export const WorkforceFilters = ({ filters, onFilterChange, onReset }) => {
  const roles = [
    'All',
    'Pointsman',
    'Station Master',
    'Train Manager',
    'SM Incharge',
  ];

  const categories = ['All', 'A', 'B', 'C', 'D'];

  return (
    <div className="unified-filters-bar">
      {/* Search Input */}
      <div className="filter-input-block" style={{ minWidth: '220px' }}>
        <span className="filter-input-label">Search Staff</span>
        <input
          type="text"
          placeholder="Search Name or HRMS ID..."
          className="filter-text-input"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      {/* Role Filter */}
      <div className="filter-input-block">
        <span className="filter-input-label">Filter Role</span>
        <select
          className="filter-select"
          value={filters.role}
          onChange={(e) => onFilterChange('role', e.target.value)}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
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
