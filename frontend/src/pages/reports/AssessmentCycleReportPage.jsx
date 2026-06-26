import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BarChartCard from '../../components/charts/BarChartCard';
import AssessmentCycleTable from '../../components/reports/AssessmentCycleTable';
import { ChartsSkeleton, TableSkeleton } from '../../components/reports/ReportSkeletons';
import { ArrowLeft, CalendarDays } from 'lucide-react';

const AssessmentCycleReportPage = () => {
  const navigate = useNavigate();
  const { cycles, loading, error, fetchCycles } = useReports();

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  if (loading && cycles.length === 0) {
    return (
      <DashboardLayout>
        <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ChartsSkeleton />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // Map cycles data to chart formats
  const scoreChartData = cycles.map(c => ({
    stationName: c.cycleName,
    Score: Number(c.averageScore || 0)
  }));

  const volumeChartData = cycles.map(c => ({
    stationName: c.cycleName,
    Completed: c.completedCount || 0,
    Pending: c.pendingCount || 0
  }));

  const volumeBars = [
    { key: 'Completed', color: '#16A34A', name: 'Completed' },
    { key: 'Pending', color: '#D97706', name: 'Pending' }
  ];

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
            <CalendarDays size={24} style={{ color: '#0B2341' }} />
            <div>
              <h1 className="reports-title">
                Assessment Cycle Analytics
              </h1>
              <p className="reports-subtitle">
                Track and compare outcomes across different evaluation terms (Q1, Q2, Annual, Special Safety Reviews).
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Cycle volume comparisons */}
        <div className="charts-grid">
          {/* 1. Cycle Avg Scores */}
          <BarChartCard
            title="Average Score by Cycle"
            subtitle="Comparing grading quality across periodic safety courses"
            data={scoreChartData}
            xKey="stationName"
            yKey="Score"
            barColor="#2B5CE6"
            hideLegend={true}
          />

          {/* 2. Volume per Cycle */}
          <BarChartCard
            title="Assessment Distribution by Cycle"
            subtitle="Ratio of completed and pending reviews"
            data={volumeChartData}
            xKey="stationName"
            bars={volumeBars}
          />
        </div>

        {/* Cycle Summary Table */}
        <AssessmentCycleTable cyclesData={cycles} />
      </div>
    </DashboardLayout>
  );
};

export default AssessmentCycleReportPage;
