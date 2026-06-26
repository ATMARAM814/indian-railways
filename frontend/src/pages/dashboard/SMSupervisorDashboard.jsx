// SMSupervisorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSmSupervisorDashboardData } from '../../api/dashboardApi';
import { 
  mapRoleDistribution, 
  mapCategoryDistribution, 
  mapMonthlyCompletionTrend,
  mapScoreSafetyTrend,
  cleanDesignationText
} from '../../utils/dashboardMappers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import LineChartCard from '../../components/charts/LineChartCard';
import BarChartCard from '../../components/charts/BarChartCard';
import DonutChartCard from '../../components/charts/DonutChartCard';
import StaffProfileModal from '../../components/dashboard/StaffProfileModal';
import { getWorkforceDetails } from '../../services/workforce.service';
import { 
  Users, 
  ClipboardCheck, 
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Inbox,
  ThumbsUp,
  UserCog,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SMSupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [officialsPage, setOfficialsPage] = useState(1);
  const [tmPage, setTmPage] = useState(1);
  const [pointsmenPage, setPointsmenPage] = useState(1);
  const pageSize = 10;

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
      const res = await getSmSupervisorDashboardData();
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
  const station = data?.station;
  const stationMasters = data?.stationMasters || [];
  const stationMasterIncharges = data?.stationMasterIncharges || [];
  const cabinMasters = data?.cabinMasters || [];
  const trainManagers = data?.trainManagers || [];
  const pointsmen = data?.pointsmen || [];

  const allStationOfficials = [
    ...stationMasters,
    ...stationMasterIncharges,
    ...cabinMasters
  ];

  const totalOfficialsPages = Math.ceil(allStationOfficials.length / pageSize);
  const currentOfficials = allStationOfficials.slice((officialsPage - 1) * pageSize, officialsPage * pageSize);

  const totalTmPages = Math.ceil(trainManagers.length / pageSize);
  const currentTms = trainManagers.slice((tmPage - 1) * pageSize, tmPage * pageSize);

  const totalPointsmenPages = Math.ceil(pointsmen.length / pageSize);
  const currentPointsmen = pointsmen.slice((pointsmenPage - 1) * pageSize, pointsmenPage * pageSize);

  // Formatted data for charts
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
  const completionTrend = mapMonthlyCompletionTrend(graphs.monthlyAssessmentCompletionTrend);
  const scoreSafetyTrend = mapScoreSafetyTrend(graphs.scoreSafetyTrend);

  // Category Distribution Bar Chart Data
  const categoryBarData = [
    { name: 'Cat A', Score: Number(summary.categoryA || 0), fill: '#1B365D' },
    { name: 'Cat B', Score: Number(summary.categoryB || 0), fill: '#2B6CB0' },
    { name: 'Cat C', Score: Number(summary.categoryC || 0), fill: '#D69E2E' },
    { name: 'Cat D', Score: Number(summary.categoryD || 0), fill: '#C53030' }
  ];

  // Risk Distribution Donut Chart Data
  const riskDist = [
    { name: 'Low', value: Number(summary.categoryA || 0) },
    { name: 'Medium', value: Number(summary.categoryB || 0) + Number(summary.categoryC || 0) },
    { name: 'High', value: Number(summary.categoryD || 0) }
  ];

  const handleViewProfile = (staffMember, e) => {
    e.preventDefault();
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  };

  const renderPaginationControls = (currentPage, totalPages, totalCount, onPageChange) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        padding: '10px 16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #D7E3EF'
      }}>
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          Showing <strong style={{ color: '#0F172A' }}>{((currentPage - 1) * pageSize) + 1}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong style={{ color: '#0F172A' }}>{totalCount}</strong> records
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              color: currentPage === 1 ? '#94A3B8' : '#475569',
              backgroundColor: currentPage === 1 ? '#F8FAFC' : '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              color: currentPage === totalPages ? '#94A3B8' : '#475569',
              backgroundColor: currentPage === totalPages ? '#F8FAFC' : '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        {station && (
          <div className="station-banner-card" style={{ marginBottom: '8px' }}>
            <div className="station-banner-info">
              <span className="station-banner-subtitle">Supervisor Station Assignment</span>
              <h2 className="station-banner-title">{station.name}</h2>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#93C5FD', flexWrap: 'wrap' }}>
                <span>• {stationMasters.length} Station Masters</span>
                {stationMasterIncharges.length > 0 && (
                  <span>• {stationMasterIncharges.length} {stationMasterIncharges.length === 1 ? 'SM Incharge' : 'SM Incharges'}</span>
                )}
                {cabinMasters.length > 0 && (
                  <span>• {cabinMasters.length} Cabin Masters</span>
                )}
                <span>• {trainManagers.length} Train Managers</span>
                <span>• {pointsmen.length} Pointsmen & Shunting Masters</span>
              </div>
            </div>
            <div className="station-banner-code-block">
              <span className="station-banner-code-label">Station Code</span>
              <span className="station-banner-code">{station.code}</span>
            </div>
          </div>
        )}

        <div className="page-header-container">
          <h1 className="page-title">Station Master Supervisor Dashboard</h1>
          <p className="page-subtitle">
            Supervisor console for <strong>{user?.fullName || user?.full_name || 'SMS User'}</strong>. Managing station evaluations, safety trends, and workflow approvals.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <StatCard 
            title="Total Employees"
            value={summary.totalEmployees}
            icon={<Users size={20} />}
            type="normal"
            trend="Total supervised personnel"
          />
          <StatCard 
            title="Pending Approvals"
            value={summary.pendingApprovals}
            icon={<Inbox size={20} />}
            type="warning"
            trend="Awaiting your approval"
          />
          <StatCard 
            title="Completed Approvals"
            value={summary.completedApprovals}
            icon={<ThumbsUp size={20} />}
            type="success"
            trend="Total audits approved"
          />
          <StatCard 
            title="Pending Assessments"
            value={summary.pendingAssessments}
            icon={<ClipboardCheck size={20} />}
            type="normal"
            trend="Assessments to complete"
          />
          <StatCard 
            title="High Risk Staff (Cat D)"
            value={summary.highRiskStaff}
            icon={<ShieldAlert size={20} />}
            type={summary.highRiskStaff > 0 ? 'danger' : 'normal'}
            trend="Requires field safety audits"
          />
        </div>

        {/* Role Headcount Grid */}
        <div className="role-stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: '24px' }}>
          <div className="role-stat-card pm">
            <div className="role-stat-info">
              <span className="role-stat-title">Pointsmen</span>
              <span className="role-stat-value">{summary.totalPM}</span>
              <span className="role-stat-desc">Active Pointsmen</span>
            </div>
            <div className="role-stat-icon-container">
              <Users size={18} />
            </div>
          </div>

          <div className="role-stat-card pm" style={{ borderLeftColor: '#8B5CF6' }}>
            <div className="role-stat-info">
              <span className="role-stat-title">Shunting Masters</span>
              <span className="role-stat-value">{summary.totalSHM}</span>
              <span className="role-stat-desc">Active Shunting Masters</span>
            </div>
            <div className="role-stat-icon-container" style={{ color: '#8B5CF6' }}>
              <Users size={18} />
            </div>
          </div>

          <div className="role-stat-card sm">
            <div className="role-stat-info">
              <span className="role-stat-title">SM & SM Incharge Staff</span>
              <span className="role-stat-value">{summary.totalSM + (summary.totalSS || 0) + (summary.totalCM || 0)}</span>
              <span className="role-stat-desc">Station Controllers</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCheck size={18} />
            </div>
          </div>

          <div className="role-stat-card tm">
            <div className="role-stat-info">
              <span className="role-stat-title">Train Managers</span>
              <span className="role-stat-value">{summary.totalTM}</span>
              <span className="role-stat-desc">Guard & Line Controllers</span>
            </div>
            <div className="role-stat-icon-container">
              <UserCog size={18} />
            </div>
          </div>
        </div>

        {/* Premium Risk Category Overview */}
        <div className="category-summary-grid">
          <div className="category-premium-card cat-a">
            <div className="category-card-info">
              <span className="category-card-label">Category A</span>
              <span className="category-card-value">{summary.categoryA || 0}</span>
              <span className="category-card-desc">Low Risk (Excellent)</span>
            </div>
            <div className="category-premium-icon-container cat-a">
              <ShieldCheck size={22} />
            </div>
          </div>

          <div className="category-premium-card cat-b">
            <div className="category-card-info">
              <span className="category-card-label">Category B</span>
              <span className="category-card-value">{summary.categoryB || 0}</span>
              <span className="category-card-desc">Medium Risk (Satisfactory)</span>
            </div>
            <div className="category-premium-icon-container cat-b">
              <Shield size={22} />
            </div>
          </div>

          <div className="category-premium-card cat-c">
            <div className="category-card-info">
              <span className="category-card-label">Category C</span>
              <span className="category-card-value">{summary.categoryC || 0}</span>
              <span className="category-card-desc">Medium Risk (Needs Training)</span>
            </div>
            <div className="category-premium-icon-container cat-c">
              <AlertTriangle size={22} />
            </div>
          </div>

          <div className="category-premium-card cat-d">
            <div className="category-card-info">
              <span className="category-card-label">Category D</span>
              <span className="category-card-value">{summary.categoryD || 0}</span>
              <span className="category-card-desc">High Risk (Critical Alert)</span>
            </div>
            <div className="category-premium-icon-container cat-d">
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <BarChartCard 
            title="Category Distribution"
            subtitle={`A/B/C/D breakdown of pointsmen and shunting staff at ${station?.name || 'Assigned Station'}`}
            data={categoryBarData}
            xKey="name"
            yKey="Score"
          />

          <DonutChartCard 
            title="Risk Distribution"
            subtitle={`Staff risk level breakdown at ${station?.name || 'Assigned Station'}`}
            data={riskDist}
            colors={['#2E7D32', '#D69E2E', '#C53030']}
          />
        </div>

        <div className="charts-grid charts-grid-full">
          <BarChartCard 
            title="Role-wise Staff Distribution"
            subtitle={`Staff headcount count per role at ${station?.name || 'Assigned Station'}`}
            data={roleStaffDist}
            xKey="role"
            yKey="Count"
            yKeyName="Staff Count"
            barColor="#1B365D"
            barSize={40}
            hideLegend={true}
            yInterval={150}
            height={350}
          />
        </div>

        <div className="charts-grid charts-grid-full">
          <LineChartCard 
            title="Monthly Completion Trend"
            subtitle="Assessment creations, evaluations, and approvals progress"
            data={completionTrend}
            xKey="month"
            lines={[
              { key: 'Created', color: '#64748B', name: 'Created' },
              { key: 'Completed', color: '#3B82F6', name: 'Evaluated' },
              { key: 'Approved', color: '#16A34A', name: 'Approved' }
            ]}
          />
        </div>

        <div className="charts-grid charts-grid-full">
          <LineChartCard 
            title="Score & Safety Trend (Last 6 Months)"
            subtitle="Average evaluation scores mapped with overall station safety classification percentage"
            data={scoreSafetyTrend}
            xKey="month"
            lines={[
              { key: 'Avg Score', color: '#0B2341', name: 'Avg Score' },
              { key: 'Safety %', color: '#16A34A', name: 'Safety %', strokeDasharray: '5 5', dot: { r: 4, stroke: '#16A34A', fill: '#16A34A' } }
            ]}
          />
        </div>

        {/* Staff Lists & Registers */}
        <div className="staff-tables-container">
          {/* Station Masters Table */}
          <div className="staff-table-card">
            <div className="staff-table-header">
              <h3 className="staff-table-title">Assigned Station Masters & Incharges</h3>
              <span className="staff-table-badge">{allStationOfficials.length} Active</span>
            </div>
            <div className="staff-table-wrapper">
              {allStationOfficials.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  No Station Masters or Incharges assigned to this station.
                </div>
              ) : (
                <>
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>HRMS ID</th>
                        <th>Designation</th>
                        <th>Category</th>
                        <th>Phone Number</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOfficials.map((sm) => (
                        <tr key={sm.id}>
                          <td>
                            <div className="staff-name-col">
                              <div className="staff-initials-avatar">
                                {sm.fullName
                                  ? sm.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                  : 'SM'}
                              </div>
                              <span className="staff-name-text">{sm.fullName || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{sm.hrmsId || sm.hrms_id || 'N/A'}</td>
                          <td>{cleanDesignationText(sm.designation || 'N/A')}</td>
                          <td>
                            <span className={`category-tag cat-${(sm.category || 'none').toLowerCase()}`}>
                              {sm.category ? `Category ${sm.category}` : 'Uncategorized'}
                            </span>
                          </td>
                          <td>{sm.phone || 'N/A'}</td>
                          <td>
                            <a 
                              href={`/staff/profile/${sm.id}`} 
                              className="staff-link-btn" 
                              onClick={(e) => handleViewProfile(sm, e)}
                            >
                              View Profile
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPaginationControls(officialsPage, totalOfficialsPages, allStationOfficials.length, setOfficialsPage)}
                </>
              )}
            </div>
          </div>

          {/* Train Managers Table */}
          <div className="staff-table-card">
            <div className="staff-table-header">
              <h3 className="staff-table-title">Assigned Train Managers</h3>
              <span className="staff-table-badge">{trainManagers.length} Active</span>
            </div>
            <div className="staff-table-wrapper">
              {trainManagers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  No Train Managers assigned to this station.
                </div>
              ) : (
                <>
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>HRMS ID</th>
                        <th>Designation</th>
                        <th>Category</th>
                        <th>Phone Number</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTms.map((tm) => (
                        <tr key={tm.id}>
                          <td>
                            <div className="staff-name-col">
                              <div className="staff-initials-avatar">
                                {tm.fullName
                                  ? tm.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                  : 'TM'}
                              </div>
                              <span className="staff-name-text">{tm.fullName || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{tm.hrmsId || tm.hrms_id || 'N/A'}</td>
                          <td>{cleanDesignationText(tm.designation || 'N/A')}</td>
                          <td>
                            <span className={`category-tag cat-${(tm.category || 'none').toLowerCase()}`}>
                              {tm.category ? `Category ${tm.category}` : 'Uncategorized'}
                            </span>
                          </td>
                          <td>{tm.phone || 'N/A'}</td>
                          <td>
                            <a 
                              href={`/staff/profile/${tm.id}`} 
                              className="staff-link-btn" 
                              onClick={(e) => handleViewProfile(tm, e)}
                            >
                              View Profile
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPaginationControls(tmPage, totalTmPages, trainManagers.length, setTmPage)}
                </>
              )}
            </div>
          </div>

          {/* Pointsmen & Shunting Masters Table */}
          <div className="staff-table-card">
            <div className="staff-table-header">
              <h3 className="staff-table-title">Assigned Pointsmen & Shunting Masters</h3>
              <span className="staff-table-badge">{pointsmen.length} Active</span>
            </div>
            <div className="staff-table-wrapper">
              {pointsmen.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  No Pointsmen or Shunting Masters assigned to this station.
                </div>
              ) : (
                <>
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>HRMS ID</th>
                        <th>Designation</th>
                        <th>Role</th>
                        <th>Category</th>
                        <th>Phone Number</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPointsmen.map((pm) => (
                        <tr key={pm.id}>
                          <td>
                            <div className="staff-name-col">
                              <div className="staff-initials-avatar">
                                {pm.fullName
                                  ? pm.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                  : 'PM'}
                              </div>
                              <span className="staff-name-text">{pm.fullName || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{pm.hrmsId || pm.hrms_id || 'N/A'}</td>
                          <td>{cleanDesignationText(pm.designation || 'N/A')}</td>
                          <td>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              backgroundColor: pm.role === 'Shunting Master' || pm.role === 'SHM' || pm.role === 'SHUNTING MASTER' ? '#EDE9FE' : '#F1F5F9',
                              color: pm.role === 'Shunting Master' || pm.role === 'SHM' || pm.role === 'SHUNTING MASTER' ? '#6D28D9' : '#475569'
                            }}>
                              {pm.role}
                            </span>
                          </td>
                          <td>
                            <span className={`category-tag cat-${(pm.category || 'none').toLowerCase()}`}>
                              {pm.category ? `Category ${pm.category}` : 'Uncategorized'}
                            </span>
                          </td>
                          <td>{pm.phone || 'N/A'}</td>
                          <td>
                            <a 
                              href={`/staff/profile/${pm.id}`} 
                              className="staff-link-btn" 
                              onClick={(e) => handleViewProfile(pm, e)}
                            >
                              View Profile
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPaginationControls(pointsmenPage, totalPointsmenPages, pointsmen.length, setPointsmenPage)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Staff Profile Card Modal Popup */}
      <StaffProfileModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
    </DashboardLayout>
  );
};

export default SMSupervisorDashboard;
