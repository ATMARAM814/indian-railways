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
                <div style={{
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

            {/* SECTION 8 — HIGH RISK WATCHLIST */}
            <HighRiskWatchlist 
              list={data.highRiskWatchlist} 
            />

            {/* SECTION 9 — RECENT STATION ACTIVITY */}
            <RecentActivityFeed 
              activities={data.recentActivities} 
            />
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StationIntelligencePage;
