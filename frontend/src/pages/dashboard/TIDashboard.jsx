// TIDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTiDashboardData } from '../../api/dashboardApi';
import { 
  mapRoleDistribution, 
  mapCategoryDistribution, 
  mapSafetyCompliance,
  mapStationProgress,
  mapStationAvgScore,
  mapAssessmentPipeline,
  mapScoreSafetyTrend
} from '../../utils/dashboardMappers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import BarChartCard from '../../components/charts/BarChartCard';
import DonutChartCard from '../../components/charts/DonutChartCard';
import LineChartCard from '../../components/charts/LineChartCard';
import { getWorkforceDetails } from '../../services/workforce.service';
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
  Building2, 
  ShieldAlert,
  ThumbsUp,
  Inbox,
  Users,
  Award,
  UserCheck,
  UserCog,
  ShieldCheck,
  Shield,
  AlertTriangle
} from 'lucide-react';

const TIDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [personalTrend, setPersonalTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownType, setDrillDownType] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate());
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTiDashboardData();
      if (res.success) {
        setData(res.data);
        console.log(`[FRONTEND UI TIDashboard] Logged-in TI HRMS ID: ${user?.hrmsId || user?.hrms_id || 'N/A'}`);
        console.log(`[FRONTEND UI TIDashboard] Profile ID being used: ${user?.id || user?.userId || 'N/A'}`);
        
        // Log station details from response
        const stationCodesReturned = res.data.graphs?.stationWiseEvaluationProgress?.map(s => s.stationCode) || [];
        console.log(`[FRONTEND UI TIDashboard] Stations returned by API (Codes):`, stationCodesReturned);
      } else {
        throw new Error(res.message || 'Failed to fetch dashboard data');
      }

      if (user?.id) {
        const profileRes = await getWorkforceDetails(user.id);
        if (profileRes.success && profileRes.data?.trend) {
          const mappedTrend = profileRes.data.trend.map((t, idx) => ({
            date: t.date ? formatDate(t.date) : `Eval ${idx + 1}`,
            Score: Number(t.score || 0)
          }));
          setPersonalTrend(mappedTrend);
        }
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
        <LoadingState cardsCount={4} />
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
  
  console.log(`[FRONTEND UI TIDashboard] Rendered station progress codes:`, stationProgress.map(s => s.stationCode));
  console.log(`[FRONTEND UI TIDashboard] Rendered station avg score codes:`, stationAvgScore.map(s => s.stationCode));

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
  const safetyCompliance = mapSafetyCompliance(graphs.safetyComplianceAnalytics);
  const scoreSafetyTrend = mapScoreSafetyTrend(graphs.scoreSafetyTrend);

  // Calculate station performance metrics by joining avg score and category distribution
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

  // Top 3 Performing Stations
  const topStations = [...processedStations]
    .filter(s => s.avgScore > 0)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3);

  // Stations Needing Attention (3)
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
    .slice(0, 3);

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
          <h1 className="page-title">Traffic Inspector Dashboard</h1>
          <p className="page-subtitle">
            Overview console for <strong>{user?.fullName || user?.full_name || 'TI User'}</strong>. Managing safety metrics and evaluation approvals across assigned stations.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <StatCard 
            title="Total Assigned Stations"
            value={summary.totalStations}
            icon={<Building2 size={20} />}
            type="normal"
            trend="Active station list"
          />
          <StatCard 
            title="Total Employees"
            value={summary.totalEmployees}
            icon={<Users size={20} />}
            type="normal"
            trend="Active section personnel"
          />
          <StatCard 
            title="Pending Approvals"
            value={summary.pendingApprovals}
            icon={<Inbox size={20} />}
            type="warning"
            trend="Awaiting inspector review"
          />
          <StatCard 
            title="Completed Approvals"
            value={summary.completedApprovals}
            icon={<ThumbsUp size={20} />}
            type="success"
            trend="Approved safety audits"
          />
          <StatCard 
            title="Section Average Score"
            value={summary.averageSectionScore !== undefined && summary.averageSectionScore !== null ? `${summary.averageSectionScore}%` : '—'}
            icon={<Award size={20} />}
            type="normal"
            trend="Overall section performance"
          />
        </div>
        {/* Staff Role Headcount Cards */}
        <div className="role-stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {/* Pointsmen Card */}
          <div className="role-stat-card pm">
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

          {/* Station Masters Card */}
          <div className="role-stat-card sm">
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

          {/* Train Managers Card */}
          <div className="role-stat-card tm">
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">Train Managers</span>
              </div>
              <span className="role-stat-value">{summary.totalTM}</span>
              <span className="role-stat-desc">Guard and line controllers</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCog size={18} />
            </div>
          </div>
        </div>

        {/* First Screenshot: Progress and Average Score */}
        <div className="charts-grid">
          <BarChartCard 
            title="Station-wise Evaluation Progress"
            subtitle="Completed and pending assessments in your section"
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
                  backgroundColor: '#0B2341',
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
            subtitle="Average performance scores for your stations"
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

        {/* Second Screenshot: Role-wise Staff Distribution */}
        <div className="charts-grid charts-grid-full">
          <BarChartCard 
            title="Role-wise Staff Distribution"
            subtitle="Staff count per role in your section"
            data={roleStaffDist}
            xKey="role"
            yKey="Count"
            yKeyName="Staff Count"
            barColor="#1B365D"
            barSize={40}
            yInterval={150}
            height={350}
          />
        </div>

        {/* Third Screenshot: Grade/Category Distribution and Safety Compliance */}
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
                  backgroundColor: '#0B2341',
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
            subtitle="Section compliance rates across categories"
          >
            <div className="compliance-list">
              {safetyCompliance.map((item, index) => {
                const getComplianceColor = (label) => {
                  if (label.includes("Overall") || label.includes("Disciplinary")) return '#2E7D32'; // Green
                  if (label.includes("PME")) return '#2563EB'; // Blue
                  if (label.includes("REF")) return '#8B5CF6'; // Purple
                  if (label.includes("Incident")) return '#0D9488'; // Teal
                  return '#64748B'; // Grey default
                };
                return (
                  <div key={index} className="compliance-item">
                    <div className="compliance-info">
                      <span className="compliance-label">{item.label}</span>
                      <span className="compliance-value">{item.percentage}%</span>
                    </div>
                    <div className="compliance-bar-bg">
                      <div 
                        className="compliance-bar-fill"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: getComplianceColor(item.label)
                        }}
                      ></div>
                    </div>
                    {item.note && <span className="compliance-note">{item.note}</span>}
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* Third Screenshot: Section-wide Performance & Safety Trend (Last 6 Months) */}
        <div className="charts-grid charts-grid-full">
          <LineChartCard 
            title="Section-wide Performance & Safety Trend (Last 6 Months)"
            subtitle="Average assessment scores and safety compliance percentage in your section"
            data={scoreSafetyTrend}
            xKey="month"
            lines={[
              { key: 'Avg Score', color: '#0B2341', name: 'Avg Score' },
              { key: 'Safety %', color: '#16A34A', name: 'Safety Compliance%', strokeDasharray: '5 5', dot: { r: 4, stroke: '#16A34A', fill: '#16A34A' } }
            ]}
          />
        </div>

        {/* Fourth Screenshot: Assessment Pipeline */}
        <div className="charts-grid charts-grid-full">
          <ChartCard 
            title="Assessment Pipeline"
            subtitle="Section-wide pipeline status and trend"
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
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={pipeline.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} key={JSON.stringify(pipeline.monthly)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dy={10} interval={0} />
                  <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={55} iconType="circle" iconSize={8} />
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
            subtitle="Highest average assessment score in your section"
            style={{ minHeight: 'auto' }}
            bodyStyle={{ display: 'block', minHeight: 'auto' }}
          >
            {renderStationTable(topStations, 'performance')}
          </ChartCard>

          <ChartCard 
            title="Stations Needing Attention"
            subtitle="Stations requiring immediate safety audit in your section"
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

export default TIDashboard;
