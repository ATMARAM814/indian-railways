import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BarChartCard from '../../components/charts/BarChartCard';
import StationPerformanceTable from '../../components/reports/StationPerformanceTable';
import { ChartsSkeleton, TableSkeleton } from '../../components/reports/ReportSkeletons';
import { ArrowLeft, Building2 } from 'lucide-react';

const StationReportPage = () => {
  const navigate = useNavigate();
  const { stations, loading, error, fetchStations } = useReports();

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  if (loading && stations.length === 0) {
    return (
      <DashboardLayout>
        <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ChartsSkeleton />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // Map station codes and values for charts
  const averageScoreChartData = stations.map(st => ({
    stationName: st.stationCode, // Use code in chart labels
    Score: Number(st.averageScore || 0)
  }));

  const highRiskChartData = stations.map(st => ({
    stationName: st.stationCode, // Use code in chart labels
    Count: Number(st.highRiskCount || 0)
  }));

  return (
    <DashboardLayout>
      <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/reports')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
          >
            <ArrowLeft size={14} />
            Back to Reports Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} style={{ color: '#0B2341' }} />
            <div>
              <h1 className="reports-title">
                Station Performance Analytics
              </h1>
              <p className="reports-subtitle">
                Compare average scores, risk levels, and assessment cycles across stations in Nagpur division.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Analytics charts comparing stations */}
        <div className="charts-grid">
          {/* 1. Station Score Comparison */}
          <BarChartCard
            title="Station Comparison"
            subtitle="Average assessment score by station code"
            data={averageScoreChartData}
            xKey="stationName"
            yKey="Score"
            barColor="#2B5CE6"
            hideLegend={true}
          />

          {/* 2. High Risk Distribution */}
          <BarChartCard
            title="High Risk Distribution"
            subtitle="Count of Category D staff by station code"
            data={highRiskChartData}
            xKey="stationName"
            yKey="Count"
            barColor="#DC2626"
            hideLegend={true}
          />
        </div>

        {/* Station Summary Metrics Table */}
        <StationPerformanceTable stationsData={stations} />
      </div>
    </DashboardLayout>
  );
};

export default StationReportPage;
