// ShuntingMasterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getShuntingMasterDashboardData } from '../../api/dashboardApi';
import { 
  mapPMPerformanceTrend, 
  mapPMSectionWisePerformance, 
  mapPMCategoryHistory 
} from '../../utils/dashboardMappers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import EmptyState from '../../components/dashboard/EmptyState';
import LineChartCard from '../../components/charts/LineChartCard';
import BarChartCard from '../../components/charts/BarChartCard';
import { 
  Award, 
  ShieldCheck, 
  Activity, 
  ClipboardCheck, 
  Calendar
} from 'lucide-react';

const ShuntingMasterDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getShuntingMasterDashboardData();
      if (res.success) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        logout();
      } else {
        setError(err.message || 'Error occurred while connecting to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState cardsCount={5} />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="dashboard-content">
          <ErrorState message={error} onRetry={fetchDashboardData} />
        </div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary || {};
  const graphs = data?.graphs || {};

  // Formatted data for charts (reusing PM mapping logic since it's identical)
  const performanceTrend = mapPMPerformanceTrend(graphs.assessmentPerformanceTrend);
  const sectionPerformance = mapPMSectionWisePerformance(graphs.sectionWisePerformance);
  const categoryHistory = mapPMCategoryHistory(graphs.categoryHistory);

  // Helper to determine status classes for KPI cards
  const getRiskType = (risk) => {
    if (risk === 'LOW') return 'success';
    if (risk === 'MEDIUM') return 'warning';
    if (risk === 'HIGH') return 'danger';
    return 'normal';
  };

  const getCategoryType = (cat) => {
    if (cat === 'A') return 'success';
    if (cat === 'B' || cat === 'C') return 'warning';
    if (cat === 'D') return 'danger';
    return 'normal';
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <div className="page-header-container">
          <h1 className="page-title">Personal Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.fullName || user?.full_name || 'Shunting Master'}</strong>. Here is your evaluation progress summary.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <StatCard 
            title="Latest Score"
            value={summary.latestScore !== null ? `${summary.latestScore}%` : 'No score'}
            icon={<Award size={20} />}
            type={summary.latestScore >= 80 ? 'success' : summary.latestScore >= 50 ? 'warning' : 'danger'}
            trend="Current assessment result"
          />
          <StatCard 
            title="Current Category"
            value={summary.currentCategory ? `Category ${summary.currentCategory}` : 'Uncategorized'}
            icon={<ShieldCheck size={20} />}
            type={getCategoryType(summary.currentCategory)}
            trend="Based on latest safety scores"
          />
          <StatCard 
            title="Risk Level"
            value={!summary.riskLevel || summary.riskLevel === 'NOT_CATEGORIZED' ? 'N/A' : summary.riskLevel}
            icon={<Activity size={20} />}
            type={getRiskType(summary.riskLevel)}
            trend="Safety operation classification"
          />
          <StatCard 
            title="Total Assessments"
            value={summary.totalAssessments}
            icon={<ClipboardCheck size={20} />}
            type="normal"
            trend="Lifetime evaluation count"
          />
          <StatCard 
            title="Last Evaluation"
            value={summary.lastAssessmentDate || 'Never'}
            icon={<Calendar size={20} />}
            type="normal"
            trend="Assessment execution date"
          />
        </div>

        {/* Charts & Timeline Lists Grid */}
        <div className="charts-grid">
          <LineChartCard 
            title="Assessment Performance Trend"
            subtitle="Historical percentage scoring path across completed cycles"
            data={performanceTrend}
            xKey="date"
            yKey="Score"
            lineColor="#2B5CE6"
          />
          <BarChartCard 
            title="Section-wise Performance"
            subtitle="Latest average score achieved per safety skill section"
            data={sectionPerformance}
            xKey="section"
            yKey="Score"
            barColor="#0B2341"
          />
        </div>

        <div className="charts-grid charts-grid-full">
          <ChartCard 
            title="Category Classification History"
            subtitle="Log of historical safety category shifts"
            style={categoryHistory.length > 0 ? { minHeight: 'auto' } : undefined}
            bodyStyle={categoryHistory.length > 0 ? { display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minHeight: 'auto', width: '100%' } : undefined}
          >
            {categoryHistory.length === 0 ? (
              <EmptyState title="No category history available yet." description="Category history tracking starts after your first safety evaluation is logged." />
            ) : (
              <div className="timeline-list">
                {categoryHistory.map((item, index) => (
                  <div key={index} className={`timeline-item ${getRiskType(item.riskLevel)}`}>
                    <div className="timeline-left">
                      <span className="timeline-category">Category {item.category}</span>
                      <span className="timeline-date">Effective: {item.date}</span>
                    </div>
                    <span className={`risk-badge ${item.riskLevel.toLowerCase()}`}>
                      {item.riskLevel} RISK
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ShuntingMasterDashboard;
