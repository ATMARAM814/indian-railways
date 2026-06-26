// SMDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSmDashboardData } from '../../api/dashboardApi';
import { 
  mapRoleDistribution, 
  mapCategoryDistribution, 
  mapStationCategoryDistribution, 
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SMDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [personalTrend, setPersonalTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [officialsPage, setOfficialsPage] = useState(1);
  const [pointsmenPage, setPointsmenPage] = useState(1);
  const [shuntingPage, setShuntingPage] = useState(1);
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
      const res = await getSmDashboardData();
      if (res.success) {
        setData(res.data);
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
  const station = data?.station;
  const stationMasters = data?.stationMasters || [];
  const stationMasterIncharges = data?.stationMasterIncharges || [];
  const cabinMasters = data?.cabinMasters || [];
  const shuntingMasters = data?.shuntingMasters || [];
  const pointsmen = data?.pointsmen || [];

  const allStationOfficials = [
    ...stationMasters,
    ...stationMasterIncharges,
    ...cabinMasters
  ];

  const allFieldStaff = [
    ...pointsmen,
    ...shuntingMasters
  ];

  const combinedPointsmenAndShunting = [
    ...pointsmen,
    ...shuntingMasters
  ];

  const isSS = user?.role === 'SS';

  const actualPointsmen = combinedPointsmenAndShunting.filter(
    (s) => !['Shunting Master', 'SHUNTING MASTER', 'SHM'].includes(s.role)
  );

  const actualShuntingMasters = combinedPointsmenAndShunting.filter(
    (s) => ['Shunting Master', 'SHUNTING MASTER', 'SHM'].includes(s.role)
  );

  const totalOfficialsPages = Math.ceil(allStationOfficials.length / pageSize);
  const currentOfficials = allStationOfficials.slice((officialsPage - 1) * pageSize, officialsPage * pageSize);

  const totalPointsmenPages = Math.ceil((isSS ? actualPointsmen.length : allFieldStaff.length) / pageSize);
  const currentPointsmen = (isSS ? actualPointsmen : allFieldStaff).slice((pointsmenPage - 1) * pageSize, pointsmenPage * pageSize);

  const totalShuntingPages = Math.ceil(actualShuntingMasters.length / pageSize);
  const currentShunting = actualShuntingMasters.slice((shuntingPage - 1) * pageSize, shuntingPage * pageSize);

  // Formatted data
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
  const categoryDist = mapCategoryDistribution(graphs.categoryDistribution);
  const stationCategoryDist = mapStationCategoryDistribution(graphs.stationCategoryDistribution);
  const completionTrend = mapMonthlyCompletionTrend(graphs.monthlyAssessmentCompletionTrend);
  const scoreSafetyTrend = mapScoreSafetyTrend(graphs.scoreSafetyTrend);

  // Category Distribution Bar Chart Data
  const categoryBarData = [
    { name: 'Cat A', Score: Number(summary.categoryA || 0), fill: '#1B365D' },
    { name: 'Cat B', Score: Number(summary.categoryB || 0), fill: '#2B6CB0' },
    { name: 'Cat C', Score: Number(summary.categoryC || 0), fill: '#D69E2E' },
    { name: 'Cat D', Score: Number(summary.categoryD || 0), fill: '#C53030' }
  ];

  // Risk Distribution Donut Chart Data (Low, Medium, High)
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
              <span className="station-banner-subtitle">Assigned Station Posting</span>
              <h2 className="station-banner-title">{station.name}</h2>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#93C5FD', flexWrap: 'wrap' }}>
                <span>• {stationMasters.length + (user?.role === 'SM' ? 1 : 0)} Station Masters</span>
                {stationMasterIncharges.length + (user?.role === 'SS' ? 1 : 0) > 0 && (
                  <span>• {stationMasterIncharges.length + (user?.role === 'SS' ? 1 : 0)} {(stationMasterIncharges.length + (user?.role === 'SS' ? 1 : 0)) === 1 ? 'SM Incharge' : 'SM Incharges'}</span>
                )}
                {cabinMasters.length + (['Cabin Master', 'CABIN MASTER'].includes(user?.role) ? 1 : 0) > 0 && (
                  <span>• {cabinMasters.length + (['Cabin Master', 'CABIN MASTER'].includes(user?.role) ? 1 : 0)} Cabin Masters</span>
                )}
                {shuntingMasters.length + (['Shunting Master', 'SHUNTING MASTER', 'SHM'].includes(user?.role) ? 1 : 0) > 0 && (
                  <span>• {shuntingMasters.length + (['Shunting Master', 'SHUNTING MASTER', 'SHM'].includes(user?.role) ? 1 : 0)} Shunting Masters</span>
                )}
                <span>• {pointsmen.length} Pointsmen</span>
              </div>
            </div>
            <div className="station-banner-code-block">
              <span className="station-banner-code-label">Station Code</span>
              <span className="station-banner-code">{station.code}</span>
            </div>
          </div>
        )}

        <div className="page-header-container">
          <h1 className="page-title">Station Dashboard</h1>
          <p className="page-subtitle">
            Station Master console for <strong>{user?.fullName || user?.full_name || 'SM User'}</strong>. Monitoring station safety evaluations and staff readiness.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <StatCard 
            title="Total Employees"
            value={summary.totalEmployees}
            icon={<Users size={20} />}
            type="normal"
            trend="Total active station crew"
          />
          <StatCard 
            title="Total Pointsmen"
            value={summary.totalPM}
            icon={<Users size={20} />}
            type="normal"
            trend="Active PM postings"
          />
          <StatCard 
            title="Completed Assessments"
            value={summary.completedAssessments}
            icon={<CheckCircle size={20} />}
            type="success"
            trend="Evaluated staff members"
          />
          <StatCard 
            title="Pending Assessments"
            value={summary.pendingAssessments}
            icon={<ClipboardCheck size={20} />}
            type="warning"
            trend="Awaiting master evaluation"
          />
          <StatCard 
            title="High Risk Staff (Cat D)"
            value={summary.highRiskStaff}
            icon={<ShieldAlert size={20} />}
            type={summary.highRiskStaff > 0 ? 'danger' : 'normal'}
            trend="Requires category audits"
          />
        </div>

        {/* Responsive Secondary metric card overview for categories */}
        <div className="category-summary-grid">
          {/* Card A */}
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

          {/* Card B */}
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

          {/* Card C */}
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

          {/* Card D */}
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
            subtitle={`A/B/C/D breakdown of pointsmen at ${station?.name || 'Nagpur Junction'}`}
            data={categoryBarData}
            xKey="name"
            yKey="Score"
          />

          <DonutChartCard 
            title="Risk Distribution"
            subtitle={`Pointsmen risk level breakdown at ${station?.name || 'Nagpur Junction'}`}
            data={riskDist}
            colors={['#2E7D32', '#D69E2E', '#C53030']}
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
              <h3 className="staff-table-title">Assigned Station Masters & Supervisors</h3>
              <span className="staff-table-badge">{allStationOfficials.length} Active</span>
            </div>
            <div className="staff-table-wrapper">
              {allStationOfficials.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  No other Station Masters or Supervisors assigned to this station.
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
                          <td>{sm.hrmsId || 'N/A'}</td>
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

          {/* Shunting Masters Table (Only visible if user role is SS) */}
          {isSS && (
            <div className="staff-table-card">
              <div className="staff-table-header">
                <h3 className="staff-table-title">Assigned Shunting Masters</h3>
                <span className="staff-table-badge">{actualShuntingMasters.length} Active</span>
              </div>
              <div className="staff-table-wrapper">
                {actualShuntingMasters.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                    No Shunting Masters assigned to this station.
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
                        {currentShunting.map((shm) => (
                          <tr key={shm.id}>
                            <td>
                              <div className="staff-name-col">
                                <div className="staff-initials-avatar">
                                  {shm.fullName
                                    ? shm.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                    : 'SHM'}
                                </div>
                                <span className="staff-name-text">{shm.fullName || 'N/A'}</span>
                              </div>
                            </td>
                            <td>{shm.hrmsId || 'N/A'}</td>
                            <td>{cleanDesignationText(shm.designation || 'N/A')}</td>
                            <td>
                              <span className={`category-tag cat-${(shm.category || 'none').toLowerCase()}`}>
                                {shm.category ? `Category ${shm.category}` : 'Uncategorized'}
                              </span>
                            </td>
                            <td>{shm.phone || 'N/A'}</td>
                            <td>
                              <a 
                                href={`/staff/profile/${shm.id}`} 
                                className="staff-link-btn" 
                                onClick={(e) => handleViewProfile(shm, e)}
                              >
                                View Profile
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {renderPaginationControls(shuntingPage, totalShuntingPages, actualShuntingMasters.length, setShuntingPage)}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pointsmen Table */}
          <div className="staff-table-card">
            <div className="staff-table-header">
              <h3 className="staff-table-title">
                {isSS ? "Assigned Pointsmen" : (shuntingMasters.length > 0 ? "Assigned Pointsmen & Shunting Masters" : "Assigned Pointsmen")}
              </h3>
              <span className="staff-table-badge">
                {isSS ? actualPointsmen.length : allFieldStaff.length} Active
              </span>
            </div>
            <div className="staff-table-wrapper">
              {(isSS ? actualPointsmen.length : allFieldStaff.length) === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  No Pointsmen assigned to this station.
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
                          <td>{pm.hrmsId || 'N/A'}</td>
                          <td>{cleanDesignationText(pm.designation || 'N/A')}</td>
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
                  {renderPaginationControls(pointsmenPage, totalPointsmenPages, isSS ? actualPointsmen.length : allFieldStaff.length, setPointsmenPage)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Detailed Staff Card Modal Popup */}
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

export default SMDashboard;
