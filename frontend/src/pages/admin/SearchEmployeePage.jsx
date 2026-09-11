import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Users, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { searchEmployees } from '../../services/workforce.service';
import { cleanDesignationText } from '../../utils/dashboardMappers';

const SearchEmployeePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimeoutRef = useRef(null);

  const executeSearch = async (term) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await searchEmployees(trimmed);
      if (res.success) {
        setResults(res.data || []);
      } else {
        setError(res.message || 'Failed to search employees');
        setResults([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error occurred while searching');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      executeSearch(value);
    }, 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      executeSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Search Employee
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '6px 0 0 0' }}>
            Look up registered employee records across the system by HRMS ID, Phone Number, or Name.
          </p>
        </div>

        {/* Search Bar Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D7E3EF',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
            marginBottom: '24px'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '16px',
                color: '#64748B',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter HRMS ID, Phone Number, or Name..."
              autoFocus
              style={{
                width: '100%',
                padding: '12px 42px 12px 44px',
                fontSize: '14px',
                color: '#0F172A',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.borderColor = '#1B365D';
                e.target.style.boxShadow = '0 0 0 3px rgba(27, 54, 93, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#F8FAFC';
                e.target.style.borderColor = '#CBD5E1';
                e.target.style.boxShadow = 'none';
              }}
            />
            {loading ? (
              <Loader2
                size={18}
                className="animate-spin"
                style={{
                  position: 'absolute',
                  right: '16px',
                  color: '#1B365D'
                }}
              />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={handleClear}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#0F172A')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Search across all registered employees in the database
            </span>
            {hasSearched && !loading && (
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B365D' }}>
                {results.length} {results.length === 1 ? 'employee found' : 'employees found'}
              </span>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '13.5px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Results / Initial / Empty States */}
        {!hasSearched && !loading ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D7E3EF',
              borderRadius: '12px',
              padding: '56px 24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#EEF2F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#1B365D'
              }}
            >
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 6px 0' }}>
              Search Registered Employees
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
              Enter an HRMS ID, Phone Number, or Name in the search box above to view registered details.
            </p>
          </div>
        ) : hasSearched && results.length === 0 && !loading ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D7E3EF',
              borderRadius: '12px',
              padding: '56px 24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#94A3B8'
              }}
            >
              <Search size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 6px 0' }}>
              No Employees Found
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 16px 0' }}>
              No registered user matched "<span style={{ fontWeight: 600, color: '#0F172A' }}>{searchTerm}</span>".
            </p>
            <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>
              Please check the HRMS ID, phone number, or spelling and try again.
            </span>
          </div>
        ) : (
          /* Table of Results - Strictly 4 columns: hrms_id, name, designation, phone number */
          <div
            className="staff-table-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D7E3EF',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
              overflow: 'hidden'
            }}
          >
            <div className="staff-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
              <table
                className="staff-table"
                style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #D7E3EF', backgroundColor: '#F8FAFC' }}>
                    <th
                      style={{
                        padding: '16px 24px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      HRMS ID
                    </th>
                    <th
                      style={{
                        padding: '16px 24px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: '16px 24px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Designation
                    </th>
                    <th
                      style={{
                        padding: '16px 24px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Phone Number
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, idx) => (
                    <tr
                      key={item.hrms_id || idx}
                      style={{
                        borderBottom: '1px solid #EEF2F6',
                        transition: 'background-color 0.2s'
                      }}
                      className="table-row-hover"
                    >
                      {/* HRMS ID */}
                      <td
                        className="notranslate"
                        style={{
                          padding: '16px 24px',
                          fontSize: '13.5px',
                          color: '#1B365D',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}
                      >
                        {item.hrms_id || '—'}
                      </td>

                      {/* Name */}
                      <td style={{ padding: '16px 24px' }}>
                        <strong style={{ color: '#0F172A', fontSize: '14px' }}>
                          {item.name || '—'}
                        </strong>
                      </td>

                      {/* Designation */}
                      <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#475569' }}>
                        <span className="notranslate">
                          {cleanDesignationText(item.designation) || '—'}
                        </span>
                      </td>

                      {/* Phone Number */}
                      <td
                        className="notranslate"
                        style={{
                          padding: '16px 24px',
                          fontSize: '13.5px',
                          color: '#475569',
                          fontFamily: 'monospace'
                        }}
                      >
                        {item.phone_number || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SearchEmployeePage;
