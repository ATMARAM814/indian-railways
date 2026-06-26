import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

const AuditFilterCard = ({ filters, onFilterChange, onReset }) => {
  const [searchVal, setSearchVal] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchVal !== filters.search) {
        onFilterChange({ search: searchVal });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  // Sync state if filters reset externally
  useEffect(() => {
    setSearchVal(filters.search || '');
  }, [filters.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  const handleReset = () => {
    setSearchVal('');
    onReset();
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D7E3EF',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0B2341' }}>
          <Filter size={18} />
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Filter Audit Logs
          </span>
        </div>
        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F1F5F9';
            e.currentTarget.style.color = '#0B2341';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <RotateCcw size={14} />
          Reset Filters
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Search Keywords</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', color: '#94A3B8' }}
            />
            <input
              type="text"
              placeholder="Search performer, action, remarks..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                color: '#0F172A',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2B5CE6'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>
        </div>

        {/* Module */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Module</label>
          <select
            name="moduleName"
            value={filters.moduleName || ''}
            onChange={handleChange}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <option value="">All Modules</option>
            <option value="Auth">Auth</option>
            <option value="Workforce">Workforce</option>
            <option value="Assessment">Assessment</option>
            <option value="Approval">Approval</option>
            <option value="Question Bank">Question Bank</option>
            <option value="Reports">Reports</option>
            <option value="Dashboard">Dashboard</option>
            <option value="System">System</option>
          </select>
        </div>

        {/* Severity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Severity</label>
          <select
            name="severity"
            value={filters.severity || ''}
            onChange={handleChange}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Performed By Role */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Performed By Role</label>
          <select
            name="performedByRole"
            value={filters.performedByRole || ''}
            onChange={handleChange}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="AOM">AOM</option>
            <option value="TI">Traffic Inspector</option>
            <option value="SS">SM Incharge</option>
            <option value="SM">Station Master</option>
            <option value="PM">Pointsman</option>
          </select>
        </div>

        {/* Date From */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Date From</label>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate || ''}
            onChange={handleChange}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              color: '#0F172A',
            }}
          />
        </div>

        {/* Date To */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Date To</label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate || ''}
            onChange={handleChange}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              color: '#0F172A',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditFilterCard;
