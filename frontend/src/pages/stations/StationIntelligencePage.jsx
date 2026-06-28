import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ErrorState from '../../components/dashboard/ErrorState';
import { useStationIntelligence } from '../../hooks/useStationIntelligence';
import { StationCommandHeader } from '../../components/stations/StationCommandHeader';
import { StationOverviewCards } from '../../components/stations/StationOverviewCards';
import { CategoryDistributionChart } from '../../components/stations/CategoryDistributionChart';
import { RiskDistributionChart } from '../../components/stations/RiskDistributionChart';
import { PerformanceTrendChart } from '../../components/stations/PerformanceTrendChart';
import { RoleDistributionChart } from '../../components/stations/RoleDistributionChart';
import { OperationalReadinessCards } from '../../components/stations/OperationalReadinessCards';
import { WorkforceFilters } from '../../components/stations/WorkforceFilters';
import { WorkforceTable } from '../../components/stations/WorkforceTable';
import { HighRiskWatchlist } from '../../components/stations/HighRiskWatchlist';
import { RecentActivityFeed } from '../../components/stations/RecentActivityFeed';
import { StationIntelligenceSkeleton } from '../../components/stations/StationIntelligenceSkeleton';
import { EmptyState } from '../../components/stations/EmptyState';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/station-intelligence.css';
import { getCategoryCandidates } from '../../services/stationIntelligence.service';

const StationIntelligencePage = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    filters,
    filteredWorkforce,
    handleFilterChange,
    handleResetFilters,
  } = useStationIntelligence(stationId);

  const [activePage, setActivePage] = useState(1);

  // Scoped candidates modal state
  const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);
  const [candidatesModalCategory, setCandidatesModalCategory] = useState(null);
  const [candidatesModalLoading, setCandidatesModalLoading] = useState(false);
  const [candidatesModalList, setCandidatesModalList] = useState([]);
  const [candidatesError, setCandidatesError] = useState(null);

  const fetchCandidates = async (category) => {
    setCandidatesModalCategory(category);
    setCandidatesModalOpen(true);
    setCandidatesModalLoading(true);
    setCandidatesError(null);
    try {
      const res = await getCategoryCandidates(stationId, category);
      if (res.success) {
        setCandidatesModalList(res.data);
      } else {
        setCandidatesError(res.message || 'Failed to load candidates.');
      }
    } catch (err) {
      console.error(err);
      setCandidatesError(err.response?.data?.message || err.message || 'Error fetching candidates.');
    } finally {
      setCandidatesModalLoading(false);
    }
  };

  // Pagination parameters
  const limit = 10;
  const totalRecords = filteredWorkforce ? filteredWorkforce.length : 0;
  const totalPages = Math.ceil(totalRecords / limit);
  const paginatedWorkforce = filteredWorkforce ? filteredWorkforce.slice((activePage - 1) * limit, activePage * limit) : [];

  // Compute role distribution from data.workforce
  const computeRoleDistribution = (workforce) => {
    const rolesOrder = ["PM", "SM", "TM", "SMS", "Cabin Master", "SHM", "SS", "TI", "AOM"];
    const counts = { PM: 0, SM: 0, TM: 0, SMS: 0, "Cabin Master": 0, SHM: 0, SS: 0, TI: 0, AOM: 0 };
    if (Array.isArray(workforce)) {
      workforce.forEach((item) => {
        const r = (item.role || '').toUpperCase().trim();
        if (r === 'PM') counts.PM++;
        else if (r === 'SM') counts.SM++;
        else if (r === 'TM') counts.TM++;
        else if (r === 'STATION MASTER SUPERVISOR' || r === 'SMS') counts.SMS++;
        else if (r === 'CABIN MASTER' || r === 'CM' || r === 'TNC') counts["Cabin Master"]++;
        else if (r === 'SHUNTING MASTER' || r === 'SHM') counts.SHM++;
        else if (r === 'SS') counts.SS++;
        else if (r === 'TI') counts.TI++;
        else if (r === 'AOM') counts.AOM++;
      });
    }
    return rolesOrder
      .map((role) => ({
        role,
        Count: counts[role],
      }))
      .filter((item) => item.Count > 0);
  };

  const roleDistributionData = data?.workforce ? computeRoleDistribution(data.workforce) : [];

  return (
    <DashboardLayout>
      <div className="station-intelligence-container">
        
        {/* Back Button Strip */}
        <div className="back-btn-strip">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={16} /> Back to Registry
          </button>
        </div>

        {loading ? (
          <StationIntelligenceSkeleton />
        ) : error || !data ? (
          <div style={{ marginTop: '24px' }}>
            <ErrorState title="Failed to Load Station Intelligence" message={error || 'Station records not found.'} />
          </div>
        ) : (
          <>
            {/* SECTION 1 — STATION COMMAND HEADER */}
            <StationCommandHeader 
              summary={data.stationSummary} 
              assignedTI={data.assignedTI} 
            />

            {/* SECTION 2 — STATION OVERVIEW */}
            <StationOverviewCards 
              overview={data.overview} 
            />

            {/* DISTRIBUTION CHARTS (SECTION 3 & SECTION 4 Side-By-Side) */}
            <div className="distribution-grid">
              {/* SECTION 3 — CATEGORY DISTRIBUTION */}
              <CategoryDistributionChart 
                data={data.categoryDistribution} 
              />
              {/* SECTION 4 — RISK DISTRIBUTION */}
              <RiskDistributionChart 
                data={data.riskDistribution} 
              />
            </div>

            {/* WATCHLISTS (SECTION 8 - CATEGORY C & CATEGORY D Stacked Vertically) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '24px 0' }}>
              <HighRiskWatchlist 
                list={data.categoryCWatchlist || []}
                category="C"
                title="Category C Watchlist & Safety Concerns"
                badgeText="Requires Counseling & Monitoring"
                themeColor="#B45309"
                themeBg="#FEF3C7"
                themeBorder="#FDE68A"
                themeLightBg="#FFFDF9"
                themeTableRowBorder="#FFFBEB"
                onViewMore={() => fetchCandidates('C')}
              />
              <HighRiskWatchlist 
                list={data.highRiskWatchlist || []}
                category="D"
                title="High Risk Watchlist & Safety Concerns"
                badgeText="Requires Supervision"
                themeColor="#991B1B"
                themeBg="#FEE2E2"
                themeBorder="#FCA5A5"
                themeLightBg="#FFFDFD"
                themeTableRowBorder="#FFF1F1"
                onViewMore={() => fetchCandidates('D')}
              />
            </div>

            {/* SECTION 5 — PERFORMANCE TREND */}
            <PerformanceTrendChart 
              data={data.performanceTrend} 
            />

            {/* ROLE-WISE STAFF DISTRIBUTION */}
            <RoleDistributionChart 
              data={roleDistributionData} 
            />

            {/* SECTION 6 — OPERATIONAL READINESS */}
            <OperationalReadinessCards 
              data={data.operationalReadiness} 
            />

            {/* SECTION 7 — STATION WORKFORCE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <WorkforceFilters 
                filters={filters} 
                onFilterChange={(name, value) => {
                  handleFilterChange(name, value);
                  setActivePage(1);
                }} 
                onReset={() => {
                  handleResetFilters();
                  setActivePage(1);
                }} 
              />
              <WorkforceTable 
                workforce={paginatedWorkforce} 
              />
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px',
                  padding: '12px 24px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #D7E3EF'
                }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    Showing <strong style={{ color: '#0F172A' }}>{((activePage - 1) * limit) + 1}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(activePage * limit, totalRecords)}</strong> of <strong style={{ color: '#0F172A' }}>{totalRecords}</strong> records
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setActivePage(activePage - 1)}
                      disabled={activePage === 1}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: activePage === 1 ? '#94A3B8' : '#475569',
                        backgroundColor: activePage === 1 ? '#F8FAFC' : '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button
                      onClick={() => setActivePage(activePage + 1)}
                      disabled={activePage === totalPages}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: activePage === totalPages ? '#94A3B8' : '#475569',
                        backgroundColor: activePage === totalPages ? '#F8FAFC' : '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
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

            {/* SECTION 9 — RECENT STATION ACTIVITY */}
            <RecentActivityFeed 
              activities={data.recentActivities} 
            />
          </>
        )}

        {/* Category Candidates Modal Dialog */}
        {candidatesModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #D7E3EF',
              fontFamily: "'Poppins', 'Inter', sans-serif"
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid #D7E3EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0B2341', margin: 0 }}>
                  Category {candidatesModalCategory} Staff Candidates list
                </h3>
                <button
                  onClick={() => setCandidatesModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {candidatesModalLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Loading candidates...</span>
                  </div>
                ) : candidatesError ? (
                  <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '14px' }}>
                    {candidatesError}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Employee Name</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Role</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Latest Score</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Category</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Last Evaluated</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidatesModalList.map((row) => (
                          <tr key={row.userId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                              {row.fullName}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#334155' }}>
                              {row.role}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: candidatesModalCategory === 'D' ? '#DC2626' : '#D97706' }}>
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
                                Cat {row.category}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>
                              {row.lastAssessmentDate ? (() => {
                                const d = new Date(row.lastAssessmentDate);
                                if (isNaN(d.getTime())) return row.lastAssessmentDate;
                                const day = String(d.getDate()).padStart(2, '0');
                                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
                              })() : '—'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setCandidatesModalOpen(false);
                                  navigate('/counseling');
                                }}
                                style={{
                                  padding: '6px 16px',
                                  backgroundColor: '#DC2626',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
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
                        {candidatesModalList.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px', fontSize: '13px', fontWeight: 500 }}>
                              No candidates found in this category.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid #D7E3EF',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#F8FAFC'
              }}>
                <button
                  onClick={() => setCandidatesModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #D7E3EF',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StationIntelligencePage;
