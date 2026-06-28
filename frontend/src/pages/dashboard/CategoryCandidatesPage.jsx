

// CategoryCandidatesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDashboardCategoryCandidates } from '../../api/dashboardApi';
import { ArrowLeft, Search, Building2, AlertTriangle, ShieldAlert } from 'lucide-react';

const CategoryCandidatesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'D';

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stationSearch, setStationSearch] = useState('');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardCategoryCandidates({
        category,
        search,
        stationSearch
      });
      if (data.success) {
        setCandidates(data.data || []);
      } else {
        setError(data.message || 'Failed to retrieve candidates.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  }, [category, search, stationSearch]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Format Date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const isCatD = category === 'D';
  const pageTitle = isCatD ? 'Category D / High Risk Candidates' : 'Category C / Medium Risk Candidates';
  const themeColor = isCatD ? '#991B1B' : '#B45309';
  const themeBg = isCatD ? '#FEE2E2' : '#FEF3C7';
  const themeBorder = isCatD ? '#FCA5A5' : '#FDE68A';

  return (
    <DashboardLayout>
      <div style={{
        padding: '24px',
        fontFamily: "'Poppins', 'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Back Button and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D7E3EF',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: '#475569',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0B2341', margin: 0 }}>
              {pageTitle}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              Scoped candidate safety listing for Category {category} staff.
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Name / HRMS ID Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Search Candidate
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Employee Name or HRMS ID..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  fontSize: '14px',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          {/* Station Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Search Station
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
              <input
                type="text"
                value={stationSearch}
                onChange={(e) => setStationSearch(e.target.value)}
                placeholder="Search by Station Name or Station Code..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  fontSize: '14px',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>
        </div>

        {/* Results Table Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${themeBorder}`,
          padding: '24px',
          boxShadow: `0 4px 12px ${isCatD ? 'rgba(239, 68, 68, 0.02)' : 'rgba(217, 119, 6, 0.02)'}`
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Fetching candidate details...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '14px' }}>
              {error}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeBorder}`, backgroundColor: isCatD ? '#FFF5F5' : '#FFFDF5' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Employee Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Station (Code)</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Latest Score</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase' }}>Last Evaluated</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: themeColor, textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((row) => (
                    <tr key={row.userId} style={{ borderBottom: `1px solid ${isCatD ? '#FFF1F1' : '#FFFBEB'}` }}>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: 600, color: isCatD ? '#7F1D1D' : '#78350F' }}>
                        {row.fullName}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                        {row.stationName} ({row.stationCode})
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 500, color: '#1B365D' }}>
                        {row.role}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: themeColor }}>
                        {row.latestScore !== null ? `${parseFloat(row.latestScore).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: row.category === 'D' ? '#FEE2E2' : '#FEF3C7',
                          color: row.category === 'D' ? '#B91C1C' : '#D97706'
                        }}>
                          Cat {row.category || category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>
                        {formatDate(row.lastAssessmentDate)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => navigate('/counseling')}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                        >
                          Counsel
                        </button>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '48px', fontSize: '13px', fontWeight: 500 }}>
                        Excellent! No candidates match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CategoryCandidatesPage;
