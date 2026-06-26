import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportKpiCards from '../../components/reports/ReportKpiCards';
import PerformanceCharts from '../../components/reports/PerformanceCharts';
import HighRiskTable from '../../components/reports/HighRiskTable';
import WorkforcePerformanceTable from '../../components/reports/WorkforcePerformanceTable';
import StationPerformanceTable from '../../components/reports/StationPerformanceTable';
import AssessmentCycleTable from '../../components/reports/AssessmentCycleTable';
import { KpiCardsSkeleton, ChartsSkeleton, TableSkeleton } from '../../components/reports/ReportSkeletons';
import { FileSpreadsheet, Download } from 'lucide-react';

const ReportsDashboardPage = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    summary,
    performance,
    highRisk,
    stations,
    cycles,
    workforceList,
    pagination,
    fetchSummary,
    fetchPerformance,
    fetchHighRisk,
    fetchStations,
    fetchCycles,
    fetchWorkforcePerformance
  } = useReports();

  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('workforce');

  // Trigger loads on mount & filter change
  useEffect(() => {
    if (user) {
      fetchSummary(filters);
      fetchPerformance(filters);
      
      // Load active tab's specific data
      if (activeTab === 'workforce') {
        fetchWorkforcePerformance(filters, 1);
      } else if (activeTab === 'high-risk') {
        fetchHighRisk(filters);
      } else if (activeTab === 'stations') {
        fetchStations(filters);
      } else if (activeTab === 'cycles') {
        fetchCycles(filters);
      }
    }
  }, [user, filters, activeTab, fetchSummary, fetchPerformance, fetchWorkforcePerformance, fetchHighRisk, fetchStations, fetchCycles]);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters((prevFilters) => {
      const keys1 = Object.keys(prevFilters);
      const keys2 = Object.keys(newFilters);
      if (keys1.length !== keys2.length) {
        return newFilters;
      }
      for (const key of keys1) {
        if (prevFilters[key] !== newFilters[key]) {
          return newFilters;
        }
      }
      return prevFilters;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handlePageChange = (page) => {
    fetchWorkforcePerformance(filters, page);
  };

  const tabs = [
    { id: 'workforce', name: 'Workforce Performance' },
    { id: 'high-risk', name: 'High-Risk Monitoring' },
    { id: 'stations', name: 'Station Analytics' },
    { id: 'cycles', name: 'Assessment Cycles' }
  ];

  return (
    <DashboardLayout>
      <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="reports-header-container">
          <div className="reports-header-info">
            <h1 className="reports-title">
              Performance & Assessment Reports
            </h1>
            <p className="reports-subtitle">
              Analyze workforce performance, safety compliance, assessment outcomes, and operational trends.
            </p>
          </div>
          
          {/* Export Buttons */}
          <div className="reports-actions-row">
            <button 
              disabled 
              title="Export formats will be available in next release"
              className="reports-export-btn"
            >
              <Download size={14} />
              Export PDF
            </button>
            <button 
              disabled 
              title="Export formats will be available in next release"
              className="reports-export-btn"
            >
              <Download size={14} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Error alerts */}
        {error && (
          <div style={{ padding: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* KPI Stats Cards */}
        {loading && !summary ? (
          <KpiCardsSkeleton />
        ) : (
          <ReportKpiCards summary={summary} userRole={user?.role} />
        )}

        {/* Performance Trends Charts */}
        {loading && !performance ? (
          <ChartsSkeleton />
        ) : (
          <PerformanceCharts performance={performance} />
        )}

        {/* Reports Directory Tabs */}
        <div className="reports-tabs-bar">
          <div className="reports-tabs-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`reports-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          
          {activeTab === 'stations' && (
            <Link to="/reports/stations" className="reports-tab-link">
              Open Standalone Station Analytics &rarr;
            </Link>
          )}
          {activeTab === 'cycles' && (
            <Link to="/reports/cycles" className="reports-tab-link">
              Open Standalone Cycle Analytics &rarr;
            </Link>
          )}
        </div>

        {/* Report Filters Card */}
        <ReportFilters 
          onApplyFilters={handleApplyFilters} 
          onResetFilters={handleResetFilters} 
          userRole={user?.role} 
        />

        {/* Detailed Datatables depending on active tab */}
        <div style={{ minHeight: '300px' }}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <>
              {activeTab === 'workforce' && (
                <WorkforcePerformanceTable 
                  workforceList={workforceList} 
                  pagination={pagination} 
                  onPageChange={handlePageChange} 
                />
              )}
              {activeTab === 'high-risk' && (
                <HighRiskTable highRiskStaff={highRisk} />
              )}
              {activeTab === 'stations' && (
                <StationPerformanceTable stationsData={stations} />
              )}
              {activeTab === 'cycles' && (
                <AssessmentCycleTable cyclesData={cycles} />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboardPage;
