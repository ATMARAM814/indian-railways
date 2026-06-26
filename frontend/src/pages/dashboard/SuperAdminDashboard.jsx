// SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSuperAdminDashboardData, getSuperAdminWorkforceActivity, getSuperAdminHighRiskStaff } from '../../api/dashboardApi';
import { 
  mapRoleDistribution, 
  mapCategoryDistribution, 
  mapStationCategoryDistribution, 
  mapMonthlyCompletionTrend,
  mapSafetyCompliance,
  mapStationProgress,
  mapStationAvgScore,
  mapAssessmentPipeline,
  mapApprovalTrend,
  mapTiPerformanceComparison,
  mapDivisionPerformanceTrend
} from '../../utils/dashboardMappers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import LineChartCard from '../../components/charts/LineChartCard';
import BarChartCard from '../../components/charts/BarChartCard';
import DonutChartCard from '../../components/charts/DonutChartCard';
import DrillDownChartModal from '../../components/dashboard/DrillDownChartModal';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Globe,
  Building2,
  Users, 
  ShieldAlert,
  Percent,
  Compass,
  UserCheck,
  UserCog,
  ThumbsUp,
  Inbox,
  ClipboardCheck,
  FileText
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownType, setDrillDownType] = useState(null);
  const [workforceTrend, setWorkforceTrend] = useState([]);
  const [highRiskStaffData, setHighRiskStaffData] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbData, workforceRes, highRiskRes] = await Promise.all([
        getSuperAdminDashboardData(),
        getSuperAdminWorkforceActivity({ limit: 1 }),
        getSuperAdminHighRiskStaff({ limit: 1 })
      ]);

      if (dbData.success) {
        setData(dbData.data);
      } else {
        throw new Error(dbData.message || 'Failed to fetch dashboard data');
      }

      if (workforceRes.success) {
        setWorkforceTrend(workforceRes.data.monthlyCounts || []);
      }
      if (highRiskRes.success) {
        setHighRiskStaffData(highRiskRes.data.stationCounts || []);
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

  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

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

  // Formatted data
  const stationProgress = mapStationProgress(graphs.stationWiseEvaluationProgress).slice(0, 8);
  const stationAvgScore = mapStationAvgScore(graphs.stationWiseAverageScore).slice(0, 8);
  const userGraphRoleMap = {
    'PM': 'PM', 'POINTSMAN': 'PM',
    'SM': 'SM', 'STATION MASTER': 'SM',
    'SS': 'SM Incharge', 'STATION MASTER INCHARGE': 'SM Incharge',
    'TM': 'TM', 'TRAIN MANAGER': 'TM',
    'TI': 'TI', 'TRAFFIC INSPECTOR': 'TI',
    'AOM': 'AOM', 'ASSISTANT OPERATIONS MANAGER': 'AOM',
    'SUPER_ADMIN': 'SA', 'SA': 'SA',
    'SMS': 'SMS', 'STATION MASTER SUPERVISOR': 'SMS', 'STATION MASTER SUPERVISIOR': 'SMS', 'STATION MASTER SUPERVISIO': 'SMS',
    'CM': 'CM', 'CABIN MASTER': 'CM',
    'SHM': 'SHM', 'SHUNTING MASTER': 'SHM'
  };
  const mappedUserRole = userGraphRoleMap[(user?.role || '').toUpperCase()];
  const roleStaffDist = mapRoleDistribution(graphs.roleWiseStaffDistribution)
    .filter(item => item.role !== mappedUserRole);
  const roleOrder = ['PM', 'SHM', 'CM', 'SM', 'SM Incharge', 'TM', 'SMS', 'TI', 'AOM'];
  roleStaffDist.sort((a, b) => {
    const idxA = roleOrder.indexOf(a.role);
    const idxB = roleOrder.indexOf(b.role);
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    return valA - valB;
  });
  const categoryDist = mapCategoryDistribution(graphs.categoryDistribution);
  const pipeline = mapAssessmentPipeline(graphs.assessmentPipeline);
  const approvalTrend = mapApprovalTrend(graphs.approvalTrend);
  const divisionTrend = mapDivisionPerformanceTrend(graphs.divisionPerformanceTrend);
  const safetyCompliance = mapSafetyCompliance(graphs.safetyComplianceAnalytics);
  const tiPerformance = mapTiPerformanceComparison(graphs.tiPerformanceComparison);
  const stationCategoryDist = mapStationCategoryDistribution(graphs.stationCategoryDistribution);
  const completionTrend = mapMonthlyCompletionTrend(graphs.monthlyAssessmentCompletionTrend);

  // Map workforceTrend to line chart format and pad with 6 months
  const mappedWorkforce = (() => {
    const rawMapped = safeArray(workforceTrend).map(item => ({
      month: item.month,
      'Created Users': Number(item.created || 0),
      'Transferred Users': Number(item.transferred || 0),
      'Deactivated Users': Number(item.deactivated || 0),
      'Reactivated Users': Number(item.reactivated || 0)
    }));
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
    }
    
    const presentMonths = new Set(rawMapped.map(item => item.month));
    const padded = [...rawMapped];
    last6Months.forEach(m => {
      if (!presentMonths.has(m)) {
        padded.push({
          month: m,
          'Created Users': 0,
          'Transferred Users': 0,
          'Deactivated Users': 0,
          'Reactivated Users': 0
        });
      }
    });
    
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parseMonthYear = (monthStr) => {
      if (!monthStr || monthStr === 'N/A') return new Date(0);
      const parts = monthStr.split(' ');
      if (parts.length !== 2) return new Date(0);
      const [mName, yStr] = parts;
      const mIndex = monthOrder.indexOf(mName);
      const year = parseInt(yStr, 10);
      if (mIndex === -1 || isNaN(year)) return new Date(0);
      return new Date(year, mIndex, 1);
    };
    
    padded.sort((a, b) => parseMonthYear(a.month) - parseMonthYear(b.month));
    return padded;
  })();

  const mappedHighRisk = safeArray(highRiskStaffData).map(item => ({
    stationName: item.stationName || 'Unknown',
    stationCode: item.stationCode || item.stationName || 'N/A',
    Count: Number(item.count || 0),
    fill: '#EF5350'
  })).slice(0, 8);

  const getComplianceColorClass = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const processedStations = mapStationAvgScore(graphs.stationWiseAverageScore).map(s => {
    const catDist = graphs.stationCategoryDistribution?.find(c => c.stationName === s.stationName) || {};
    const catA = catDist.categoryA || catDist.category_a || 0;
    const catB = catDist.categoryB || catDist.category_b || 0;
    const catC = catDist.categoryC || catDist.category_c || 0;
    const catD = catDist.categoryD || catDist.category_d || 0;
    const totalCategorized = catA + catB + catC + catD;
    const catAAndB = catA + catB;
    const safetyPercent = totalCategorized > 0 ? Math.round((catAAndB / totalCategorized) * 100) : 100;
    
    return {
      stationName: s.stationName,
      stationCode: s.stationCode || s.stationName,
      avgScore: Math.round(s.averageScore || s.Score || 0),
      safetyPercent: safetyPercent,
      highRiskCount: catD
    };
  });

  const topStations = [...processedStations]
    .filter(s => s.avgScore > 0)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  const needingAttention = [...processedStations]
    .filter(s => s.safetyPercent < 90 || s.highRiskCount > 0)
    .sort((a, b) => {
      if (b.highRiskCount !== a.highRiskCount) {
        return b.highRiskCount - a.highRiskCount;
      }
      if (a.safetyPercent !== b.safetyPercent) {
        return a.safetyPercent - b.safetyPercent;
      }
      return a.avgScore - b.avgScore;
    })
    .slice(0, 5);

  const renderStationTable = (stationsList, type) => {
    return (
      <div className="staff-table-wrapper" style={{ width: '100%', marginTop: '8px' }}>
        <table className="staff-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 16px', fontSize: '11px', textTransform: 'uppercase' }}>#</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', textTransform: 'uppercase' }}>Station</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', textTransform: 'uppercase' }}>Avg Score</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', textTransform: 'uppercase' }}>Safety %</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', textTransform: 'uppercase' }}>High Risk</th>
            </tr>
          </thead>
          <tbody>
            {stationsList.map((station, index) => (
              <tr key={station.stationCode}>
                <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{index + 1}</td>
                <td style={{ padding: '10px 16px', fontSize: '13.5px', fontWeight: 500 }}>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{station.stationName}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Code: {station.stationCode}</div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: '13.5px', fontWeight: 600, color: station.avgScore >= 80 ? '#16A34A' : station.avgScore >= 50 ? '#D97706' : '#DC2626' }}>
                  {station.avgScore}%
                </td>
                <td style={{ padding: '10px 16px', fontSize: '13.5px', fontWeight: 500 }}>
                  {station.safetyPercent}%
                </td>
                <td style={{ 
                  padding: '10px 16px', 
                  fontSize: '13.5px', 
                  fontWeight: 600, 
                  color: station.highRiskCount > 0 ? '#DC2626' : '#64748B'
                }}>
                  {station.highRiskCount}
                </td>
              </tr>
            ))}
            {stationsList.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748B', padding: '24px 0' }}>
                  No station data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <div className="page-header-container">
          <h1 className="page-title">Super Admin System-wide Dashboard</h1>
          <p className="page-subtitle">
            System administration console for <strong>{user?.fullName || user?.full_name || 'Admin User'}</strong>. Global safety metrics, staff audits, and active configurations.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <StatCard 
            title="Total Divisions"
            value={summary.totalDivisions}
            icon={<Globe size={20} />}
            type="normal"
            trend="Active operating divisions"
          />
          <StatCard 
            title="Total Stations"
            value={summary.totalStations}
            icon={<Building2 size={20} />}
            type="normal"
            trend="Total stations across divisions"
          />
          <StatCard 
            title="Total Employees"
            value={summary.totalEmployees}
            icon={<Users size={20} />}
            type="normal"
            trend="Total active safety crew"
          />
          <StatCard 
            title="Pending Approvals"
            value={summary.pendingApprovals}
            icon={<Inbox size={20} />}
            type="warning"
            trend="Awaiting review"
          />
          <StatCard 
            title="Total Evaluations"
            value={summary.totalAssessments}
            icon={<ClipboardCheck size={20} />}
            type="success"
            trend="System-wide assessment count"
          />
        </div>

        {/* Staff Role Headcount Cards */}
        <div className="role-stat-grid-5">
          {/* Pointsmen Card */}
          <div className="role-stat-card pm" onClick={() => navigate('/workforce/pointsmen')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">Pointsmen</span>
              </div>
              <span className="role-stat-value">{summary.totalPM}</span>
              <span className="role-stat-desc">Active field safety staff</span>
            </div>
            <div className="role-stat-icon-container">
              <Users size={18} />
            </div>
          </div>

          {/* Shunting Masters Card */}
          <div className="role-stat-card shm" onClick={() => navigate('/workforce/shunting-masters')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">Shunting Masters</span>
              </div>
              <span className="role-stat-value">{summary.totalShuntingMasters || 0}</span>
              <span className="role-stat-desc">Shunt and yard staff</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCog size={18} />
            </div>
          </div>

          {/* Cabin Masters Card */}
          <div className="role-stat-card tnc" onClick={() => navigate('/workforce/cabin-master')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">CABIN MASTERS</span>
              </div>
              <span className="role-stat-value">{summary.totalTNC || 0}</span>
              <span className="role-stat-desc">Cabin staff</span>
            </div>
            <div className="role-stat-icon-container">
              <Users size={18} />
            </div>
          </div>

          {/* Station Masters Card */}
          <div className="role-stat-card sm" onClick={() => navigate('/workforce/station-masters')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">Station Masters</span>
              </div>
              <span className="role-stat-value">{summary.totalSM}</span>
              <span className="role-stat-desc">Station operations team</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCheck size={18} />
            </div>
          </div>

          {/* Station Masters Incharge Card */}
          <div className="role-stat-card ss" onClick={() => navigate('/workforce/station-masters-incharge')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">SM Incharges</span>
              </div>
              <span className="role-stat-value">{summary.totalSS}</span>
              <span className="role-stat-desc">Station admin heads</span>
            </div>
            <div className="role-stat-icon-container">
              <Building2 size={18} />
            </div>
          </div>

          {/* Train Managers Card */}
          <div className="role-stat-card tm" onClick={() => navigate('/workforce/train-managers')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">Train Managers</span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>{summary.totalTM}</span>
              <span className="role-stat-desc">Guard and line controllers</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCog size={18} />
            </div>
          </div>

          {/* Station Master Supervisors Card */}
          <div className="role-stat-card sms" onClick={() => navigate('/workforce/station-master-supervisors')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">SM Supervisors</span>
              </div>
              <span className="role-stat-value">{summary.totalSMSupervisors || 0}</span>
              <span className="role-stat-desc">Senior station officials</span>
            </div>
            <div className="role-stat-icon-container">
              <Users size={18} />
            </div>
          </div>

          {/* Traffic Inspectors Card */}
          <div className="role-stat-card ti" onClick={() => navigate('/workforce/traffic-inspectors')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">Traffic Inspectors</span>
              </div>
              <span className="role-stat-value">{summary.totalTI}</span>
              <span className="role-stat-desc">Safety & compliance team</span>
            </div>
            <div className="role-stat-icon-container">
              <Compass size={18} />
            </div>
          </div>

          {/* Operations Managers Card (AOM) */}
          <div className="role-stat-card aom" onClick={() => navigate('/workforce/aom-users')}>
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">AOM</span>
              </div>
              <span className="role-stat-value">{summary.totalAOM}</span>
              <span className="role-stat-desc">Division supervisors</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCog size={18} />
            </div>
          </div>
        </div>

        {/* Row 1: Progress & Average Score Charts */}
        <div className="charts-grid" style={{ marginTop: '24px' }}>
          <BarChartCard 
            title="Station-wise Evaluation Progress"
            subtitle="Completed vs pending evaluation counts per station"
            data={stationProgress}
            xKey="stationCode"
            bars={[
              { key: 'Completed', color: '#1B365D', name: 'Completed' },
              { key: 'Pending', color: '#D69E2E', name: 'Pending' }
            ]}
            barSize={12}
            headerAction={
              <button 
                onClick={() => {
                  setDrillDownType('stationEvaluationProgress');
                  setIsDrillDownOpen(true);
                }}
                style={{
                  backgroundColor: '#1B365D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Full Screen
              </button>
            }
          />

          <BarChartCard 
            title="Station-wise Average Score"
            subtitle="Average safety score percentage across stations"
            data={stationAvgScore}
            xKey="stationCode"
            yKey="Score"
            yKeyName="Average Score"
            barColor="#2E7D32"
            barSize={16}
            headerAction={
              <button 
                onClick={() => {
                  setDrillDownType('stationAverageScore');
                  setIsDrillDownOpen(true);
                }}
                style={{
                  backgroundColor: '#2E7D32',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Full Screen
              </button>
            }
          />
        </div>

        {/* Row 2: Grade/Category Distribution & Safety Compliance Analytics (both half-width) */}
        <div className="charts-grid">
          <DonutChartCard 
            title="Grade/Category Distribution"
            subtitle="Staff grades in your section"
            data={categoryDist}
            colors={['#1B365D', '#2B6CB0', '#D69E2E', '#C53030']}
            headerAction={
              <button 
                onClick={() => {
                  setDrillDownType('categoryDistribution');
                  setIsDrillDownOpen(true);
                }}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Full Screen
              </button>
            }
          />

          <ChartCard 
            title="Safety Compliance Analytics"
            subtitle="Completion rates for safety operations"
          >
            <div className="compliance-list">
              {safetyCompliance.map((item, index) => (
                <div key={index} className="compliance-item">
                  <div className="compliance-info">
                    <span className="compliance-label">{item.label}</span>
                    <span className="compliance-value">{item.percentage}%</span>
                  </div>
                  <div className="compliance-bar-bg">
                    <div 
                      className={`compliance-bar-fill ${getComplianceColorClass(item.percentage)}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  {item.note && <span className="compliance-note">{item.note}</span>}
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Row 3: Role-wise Staff Distribution (full-width) */}
        <div className="charts-grid charts-grid-full">
          <BarChartCard 
            title="Role-wise Staff Distribution"
            subtitle="Designation breakdown of safety personnel"
            data={roleStaffDist}
            xKey="role"
            yKey="Count"
            yKeyName="Staff Count"
            barColor="#0B2341"
            barSize={40}
            hideLegend={true}
            yInterval={150}
            height={350}
          />
        </div>

        {/* Row 4: Traffic Inspector Performance (vertical, full-width) */}
        <div className="charts-grid charts-grid-full">
          <BarChartCard 
            title="Traffic Inspector Performance"
            subtitle="Average assessment scores achieved across TIs"
            data={tiPerformance}
            xKey="tiName"
            yKey="Score"
            yKeyName="Average Score"
            barColor="#0F172A"
            barSize={32}
            hideLegend={true}
          />
        </div>

        {/* New Row: User Management Activity & High-Risk Staff by Station */}
        <div className="charts-grid">
          <LineChartCard 
            title="User Management Activity"
            subtitle="Workforce management activity across the division"
            data={mappedWorkforce}
            xKey="month"
            lines={[
              { key: 'Created Users', color: '#3B82F6', name: 'Created Users' },
              { key: 'Transferred Users', color: '#F59E0B', name: 'Transferred Users' },
              { key: 'Deactivated Users', color: '#EF4444', name: 'Deactivated Users' },
              { key: 'Reactivated Users', color: '#10B981', name: 'Reactivated Users' }
            ]}
            headerAction={
              <button 
                onClick={() => {
                  setDrillDownType('workforceActivity');
                  setIsDrillDownOpen(true);
                }}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Full Screen
              </button>
            }
          />

          <BarChartCard 
            title="High-Risk Staff by Station"
            subtitle="Stations requiring operational attention and monitoring"
            data={mappedHighRisk}
            xKey="stationCode"
            yKey="Count"
            yKeyName="High-Risk Staff Count"
            barColor="#EF5350"
            barSize={32}
            hideLegend={true}
            headerAction={
              <button 
                onClick={() => {
                  setDrillDownType('highRiskStaff');
                  setIsDrillDownOpen(true);
                }}
                style={{
                  backgroundColor: '#EF5350',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Full Screen
              </button>
            }
          />
        </div>

        {/* Row 5: Division Performance Trend & Assessment Workflow Trend */}
        <div className="charts-grid">
          <LineChartCard 
            title="Division Performance Trend"
            subtitle="Mean division average score change over months"
            data={divisionTrend}
            xKey="month"
            yKey="Score"
            lineColor="#10B981"
          />

          <LineChartCard 
            title="Assessment Workflow Trend (Last 3 Months)"
            subtitle="Visualize how assessments move through the workflow pipeline over time"
            data={completionTrend.slice(-3)}
            xKey="month"
            lines={[
              { key: 'Created', color: '#64748B', name: 'Created' },
              { key: 'Evaluated', color: '#2563EB', name: 'Evaluated' },
              { key: 'Approved', color: '#16A34A', name: 'Approved' }
            ]}
          />
        </div>

        {/* Row 6: Assessment Pipeline (division-wide premium component) */}
        <div className="charts-grid charts-grid-full">
          <ChartCard 
            title="Assessment Pipeline"
            subtitle="Division-wide pipeline status and trend"
          >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '24px' }}>
              {/* Pipeline KPI Cards Grid */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '16px',
                  width: '100%'
                }}
              >
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1B365D' }}></span>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Approved</span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#0B2341', marginLeft: '14px' }}>{pipeline.summary?.approved ?? 0}</span>
                </div>
                
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Pending</span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#0B2341', marginLeft: '14px' }}>{pipeline.summary?.pending ?? 0}</span>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C53030' }}></span>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Rejected</span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#0B2341', marginLeft: '14px' }}>{pipeline.summary?.rejected ?? 0}</span>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748B' }}></span>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Overdue</span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#0B2341', marginLeft: '14px' }}>{pipeline.summary?.overdue ?? 0}</span>
                </div>
              </div>

              {/* Grouped Bar Chart */}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pipeline.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} key={JSON.stringify(pipeline.monthly)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dy={10} interval={0} />
                  <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                  <Bar dataKey="Approved" fill="#1B365D" barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
                  <Bar dataKey="Pending" fill="#2563EB" barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
                  <Bar dataKey="Rejected" fill="#C53030" barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
                  <Bar dataKey="Overdue" fill="#64748B" barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Top Performing Stations & Stations Needing Attention */}
        <div className="charts-grid" style={{ marginTop: '24px' }}>
          <ChartCard 
            title="Top Performing Stations"
            subtitle="Highest average assessment score system-wide"
            style={{ minHeight: 'auto' }}
            bodyStyle={{ display: 'block', minHeight: 'auto' }}
          >
            {renderStationTable(topStations, 'performance')}
          </ChartCard>

          <ChartCard 
            title="Stations Needing Attention"
            subtitle="Stations requiring immediate safety audit system-wide"
            style={{ minHeight: 'auto' }}
            bodyStyle={{ display: 'block', minHeight: 'auto' }}
          >
            {renderStationTable(needingAttention, 'attention')}
          </ChartCard>
        </div>
      </div>
      <DrillDownChartModal 
        isOpen={isDrillDownOpen} 
        onClose={() => setIsDrillDownOpen(false)} 
        graphType={drillDownType} 
      />
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
