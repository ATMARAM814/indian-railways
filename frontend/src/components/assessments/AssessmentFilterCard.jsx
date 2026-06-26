import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export const AssessmentFilterCard = ({
  filters,
  onChange,
  onReset,
  stations = [],
  stationsLoading = false
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="filter-card">
      <div className="filter-grid">
        <div className="filter-item search-bar-container">
          <label className="filter-label">Search Staff</label>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              name="search"
              placeholder="Search by name, HRMS ID..."
              value={filters.search || ''}
              onChange={handleInputChange}
              className="filter-input search-input"
            />
          </div>
        </div>

        <div className="filter-item">
          <label className="filter-label">Station</label>
          <select
            name="stationId"
            value={filters.stationId || ''}
            onChange={handleInputChange}
            className="filter-input"
            disabled={stationsLoading}
          >
            <option value="">All Stations</option>
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.station_name} ({st.station_code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">Assessment Status</label>
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleInputChange}
            className="filter-input"
          >
            <option value="">All Statuses</option>
            <option value="not_assessed">Not Assessed</option>
            <option value="created">MCQ Exam Pending</option>
            <option value="mcq_submitted">Evaluation Pending</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">Safety Category</label>
          <select
            name="category"
            value={filters.category || ''}
            onChange={handleInputChange}
            className="filter-input"
          >
            <option value="">All Categories</option>
            <option value="A">Category A (Low Risk)</option>
            <option value="B">Category B (Medium Risk)</option>
            <option value="C">Category C (Medium Risk)</option>
            <option value="D">Category D (High Risk)</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">From Date</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ''}
            onChange={handleInputChange}
            className="filter-input"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">To Date</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ''}
            onChange={handleInputChange}
            className="filter-input"
          />
        </div>

        <div className="filter-item reset-button-container">
          <button type="button" onClick={onReset} className="btn-secondary reset-btn">
            <RotateCcw size={16} className="reset-icon" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
