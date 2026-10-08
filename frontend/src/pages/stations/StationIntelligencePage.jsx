import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ErrorState from '../../components/dashboard/ErrorState';
import { useStationIntelligence } from '../../hooks/useStationIntelligence';
import { StationCommandHeader } from '../../components/stations/StationCommandHeader';
import { StationOverviewCards } from '../../components/stations/StationOverviewCards';
import { CategoryDistributionChart } from '../../components/stations/CategoryDistributionChart';
import { PerformanceTrendChart } from '../../components/stations/PerformanceTrendChart';
import { OperationalReadinessCards } from '../../components/stations/OperationalReadinessCards';
import { WorkforceFilters } from '../../components/stations/WorkforceFilters';
import { WorkforceTable } from '../../components/stations/WorkforceTable';
import { HighRiskWatchlist } from '../../components/stations/HighRiskWatchlist';
import { StationIntelligenceSkeleton } from '../../components/stations/StationIntelligenceSkeleton';
import { EmptyState } from '../../components/stations/EmptyState';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/station-intelligence.css';

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

  // Pagination parameters
  const limit = 10;
  const totalRecords = filteredWorkforce ? filteredWorkforce.length : 0;
  const totalPages = Math.ceil(totalRecords / limit);
  const paginatedWorkforce = filteredWorkforce ? filteredWorkforce.slice((activePage - 1) * limit, activePage * limit) : [];

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

            {/* SECTION 2 — STATION OVERVIEW: Role Headcount Cards (Available roles + Total count) */}
            <StationOverviewCards 
              workforce={data.workforce}
              onRoleClick={(roleKey) => {
                handleFilterChange('role', roleKey);
                setActivePage(1);
              }}
              selectedRole={filters.role}
            />

            {/* SECTION 3 — CATEGORY DISTRIBUTION */}
            <div style={{ width: '100%', marginBottom: '24px' }}>
              <CategoryDistributionChart 
                data={data.categoryDistribution} 
              />
            </div>

            {/* SECTION 4 — PERFORMANCE TREND */}
            <PerformanceTrendChart 
              data={data.performanceTrend} 
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
                <div className="pagination-responsive-bar" style={{
                  marginTop: '8px',
                  borderRadius: '8px',
                  border: '1px solid #D7E3EF'
                }}>
                  <span className="pagination-info-text">
                    Showing <strong style={{ color: '#0F172A' }}>{((activePage - 1) * limit) + 1}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(activePage * limit, totalRecords)}</strong> of <strong style={{ color: '#0F172A' }}>{totalRecords}</strong> records
                  </span>
                  <div className="pagination-controls-group">
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

            {/* SECTION 7 — HIGH RISK WATCHLIST */}
            <HighRiskWatchlist 
              list={data.highRiskWatchlist || []} 
            />
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StationIntelligencePage;
