// DrillDownChartModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStationSummaryReport } from '../../api/reportsApi';
import { getSuperAdminWorkforceActivity, getSuperAdminHighRiskStaff } from '../../api/dashboardApi';
import { normalizeStationSummaryData } from '../../utils/drillDownMappers';
import DrillDownFilters from './DrillDownFilters';
import DrillDownTable from './DrillDownTable';
import DrillDownPagination from './DrillDownPagination';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import ChartCard from './ChartCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  UserPlus,
  ArrowLeftRight,
  UserMinus,
  RefreshCw,
  ShieldAlert,
  Building,
  MapPin,
  AlertOctagon
} from 'lucide-react';

const DrillDownChartModal = ({ isOpen, onClose, graphType }) => {
  const { user } = useAuth();
  const role = user?.role || 'TI';

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Extra workforce/risk specific states
  const [extraChartData, setExtraChartData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [highRiskChartPage, setHighRiskChartPage] = useState(1);
  const highRiskChartLimit = 10;

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    stationName: '',
    stationCode: '',
    category: '',
    riskLevel: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 8,
    role: '',
    activityType: ''
  });

  const getGraphTitle = () => {
    switch (graphType) {
      case 'stationEvaluationProgress':
        return 'Station-wise Evaluation Progress';
      case 'stationAverageScore':
        return 'Station-wise Average Score';
      case 'categoryDistribution':
        return 'Grade / Category Distribution';
      case 'workforceActivity':
        return 'User Management Activity Analytics';
      case 'highRiskStaff':
        return 'High-Risk Staff Concentration Analytics';
      default:
        return 'Station Summary Report';
    }
  };

  const getGraphSubtitle = () => {
    switch (graphType) {
      case 'stationEvaluationProgress':
        return 'Completed vs pending assessment progress by station';
      case 'stationAverageScore':
        return 'Average assessment score comparison across stations';
      case 'categoryDistribution':
        return 'Station-wise staff category distribution';
      case 'workforceActivity':
        return 'Comprehensive workforce movement and staff administration activity';
      case 'highRiskStaff':
        return 'Division-wide stations requiring operational attention and monitoring';
      default:
        return 'Detailed station metrics overview';
    }
  };

  const fetchData = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      // Clean query params (only send non-empty values)
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params[key] = filters[key];
        }
      });

      if (graphType === 'workforceActivity') {
        const res = await getSuperAdminWorkforceActivity(params);
        if (res.success && res.data) {
          setData(res.data.records || []);
          setKpis(res.data.kpis || null);
          
          // Map monthlyCounts to line chart format and pad with 6 months
          const rawMapped = (res.data.monthlyCounts || []).map(item => ({
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
          setExtraChartData(padded);
          
          if (res.data.total !== undefined) {
            setPagination({
              total: res.data.total,
              page: filters.page,
              limit: filters.limit,
              totalPages: Math.ceil(res.data.total / filters.limit) || 1
            });
          }
        } else {
          throw new Error(res.message || 'Failed to fetch workforce activity data');
        }
      } else if (graphType === 'highRiskStaff') {
        const res = await getSuperAdminHighRiskStaff(params);
        if (res.success && res.data) {
          setData(res.data.records || []);
          setKpis(res.data.kpis || null);
          
          const mappedHighRisk = (res.data.stationCounts || []).map(item => ({
            stationName: item.stationName || 'Unknown',
            stationCode: item.stationCode || item.stationName || 'N/A',
            Count: Number(item.count || 0),
            fill: '#EF5350'
          }));
          setExtraChartData(mappedHighRisk);
          
          if (res.data.total !== undefined) {
            setPagination({
              total: res.data.total,
              page: filters.page,
              limit: filters.limit,
              totalPages: Math.ceil(res.data.total / filters.limit) || 1
            });
          }
        } else {
          throw new Error(res.message || 'Failed to fetch high-risk staff data');
        }
      } else {
        const res = await getStationSummaryReport(params);
        if (res.success && res.data) {
          const normalized = normalizeStationSummaryData(res.data.records);
          setData(normalized);
          setKpis(null);
          setExtraChartData([]);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        } else {
          throw new Error(res.message || 'Failed to fetch station summary report data');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load station analytics data.');
    } finally {
      setLoading(false);
    }
  };

  // Reset filters and states when modal opens or graph type changes
  useEffect(() => {
    if (isOpen) {
      setFilters({
        search: '',
        stationName: '',
        stationCode: '',
        category: '',
        riskLevel: '',
        fromDate: '',
        toDate: '',
        page: 1,
        limit: 8,
        role: '',
        activityType: ''
      });
      setData([]);
      setExtraChartData([]);
      setKpis(null);
      setHighRiskChartPage(1);
    }
  }, [isOpen, graphType]);

  // Trigger fetch on filter or page changes
  useEffect(() => {
    fetchData();
  }, [filters, isOpen]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page to 1 when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      stationName: '',
      stationCode: '',
      category: '',
      riskLevel: '',
      fromDate: '',
      toDate: '',
      page: 1,
      limit: 8,
      role: '',
      activityType: ''
    });
  };

  if (!isOpen) return null;

  // Unified graph colors across all roles/dashboards
  const completedColor = '#1B365D';
  const pendingColor = '#D69E2E';
  const averageScoreColor = '#2E7D32';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#EEF6FC',
      zIndex: 9999,
      overflowY: 'auto',
      padding: '24px 32px',
      fontFamily: "'Poppins', 'Inter', sans-serif"
    }}>
      {/* Header section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {getGraphTitle()}
          </h1>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Page {pagination.page} of {pagination.totalPages} (Showing {data.length} records per page out of {pagination.total} matching records)
          </span>
        </div>
        
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#FCA5A5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#FEE2E2'}
        >
          Close Zoom View
        </button>
      </div>

      {/* Reusable filters component */}
      <DrillDownFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        graphType={graphType}
      />

      {/* KPI Section */}
      {kpis && (graphType === 'workforceActivity' || graphType === 'highRiskStaff') && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginTop: '24px'
        }}>
          {graphType === 'workforceActivity' && (
            <>
              {/* Card 1 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #3B82F6',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Created Users</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.createdUsers}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>New staff accounts</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                  color: '#3B82F6', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={20} />
                </div>
              </div>

              {/* Card 2 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #10B981',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Reactivations</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.reactivations}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Restored access count</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                  color: '#10B981', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RefreshCw size={20} />
                </div>
              </div>

              {/* Card 3 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #F59E0B',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Transfers</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.transfers}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Station rotation count</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                  color: '#F59E0B', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowLeftRight size={20} />
                </div>
              </div>

              {/* Card 4 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #EF4444',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Deactivations</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.deactivations}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Suspended accounts</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                  color: '#EF4444', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserMinus size={20} />
                </div>
              </div>
            </>
          )}

          {graphType === 'highRiskStaff' && (
            <>
              {/* Card 1 */}
              {/* Card 1 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #B91C1C',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total High-Risk Staff</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.totalHighRiskStaff}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Total Category D staff</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(185, 28, 28, 0.08)', 
                  color: '#B91C1C', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={20} />
                </div>
              </div>

              {/* Card 2 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #EF4444',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>High-Risk Stations</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.highRiskStations}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Stations with Category D staff</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                  color: '#EF4444', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building size={20} />
                </div>
              </div>

              {/* Card 3 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: '4px solid #F59E0B',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highest Risk Station</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{kpis.highestRiskStation}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Most Category D staff</span>
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                  color: '#F59E0B', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={20} />
                </div>
              </div>

              {/* Card 4 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
                borderLeft: `4px solid ${kpis.averageDivisionRisk === 'HIGH' ? '#EF4444' : kpis.averageDivisionRisk === 'MEDIUM' ? '#F59E0B' : '#22C55E'}`,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Division Risk</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{kpis.averageDivisionRisk}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Calculated division risk</span>
                </div>
                <div style={{ 
                  backgroundColor: kpis.averageDivisionRisk === 'HIGH' ? 'rgba(239, 68, 68, 0.08)' : kpis.averageDivisionRisk === 'MEDIUM' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)', 
                  color: kpis.averageDivisionRisk === 'HIGH' ? '#EF4444' : kpis.averageDivisionRisk === 'MEDIUM' ? '#F59E0B' : '#22C55E', 
                  padding: '10px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertOctagon size={20} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Loading / Error states */}
        {loading ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <LoadingState cardsCount={1} />
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : (
          <>
            {/* Chart section */}
            <ChartCard 
              title={getGraphSubtitle()} 
              subtitle={
                graphType === 'workforceActivity' 
                  ? 'Historical division-wide workforce actions' 
                  : graphType === 'highRiskStaff' 
                    ? 'High-risk employee station concentration' 
                    : `Showing up to ${filters.limit} stations on this page`
              }
              bodyStyle={{ display: 'flex', flexDirection: 'column', width: '100%' }}
            >
              {(data.length === 0 && graphType !== 'highRiskStaff' && graphType !== 'workforceActivity') ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px', color: '#64748B' }}>
                  No records found for selected filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  {graphType === 'stationEvaluationProgress' && (
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: data.length > 5 ? 25 : 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis 
                        dataKey="stationCode" 
                        stroke="#64748B" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                        interval={0}
                        angle={0}
                        textAnchor="middle"
                        height={30}
                      />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                      <Bar dataKey="completed" name="Completed Evaluations" fill={completedColor} barSize={16} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pending Evaluations" fill={pendingColor} barSize={16} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}

                  {graphType === 'stationAverageScore' && (
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: data.length > 5 ? 25 : 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis 
                        dataKey="stationCode" 
                        stroke="#64748B" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                        interval={0}
                        angle={0}
                        textAnchor="middle"
                        height={30}
                      />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                      <Bar dataKey="averageScore" name="Average Evaluation Score" fill={averageScoreColor} barSize={24} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}

                  {graphType === 'categoryDistribution' && (
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: data.length > 5 ? 25 : 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis 
                        dataKey="stationCode" 
                        stroke="#64748B" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                        interval={0}
                        angle={0}
                        textAnchor="middle"
                        height={30}
                      />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                      <Bar dataKey="categoryA" name="Category A" fill="#1B365D" barSize={9} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="categoryB" name="Category B" fill="#2B6CB0" barSize={9} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="categoryC" name="Category C" fill="#D69E2E" barSize={9} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="categoryD" name="Category D" fill="#C53030" barSize={9} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  )}

                  {graphType === 'workforceActivity' && (
                    <LineChart data={extraChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dy={10} interval={0} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                      <Line type="monotone" dataKey="Created Users" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Transferred Users" stroke="#F59E0B" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Deactivated Users" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Reactivated Users" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}

                  {graphType === 'highRiskStaff' && (
                    <BarChart data={extraChartData.slice((highRiskChartPage - 1) * highRiskChartLimit, highRiskChartPage * highRiskChartLimit)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis 
                        dataKey="stationCode" 
                        stroke="#64748B" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                        interval={0}
                        angle={0}
                        textAnchor="middle"
                        height={30}
                      />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Count" name="High-Risk Staff Count" fill="#EF5350" barSize={32} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
              
              {graphType === 'highRiskStaff' && extraChartData.length > highRiskChartLimit && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '16px',
                  marginBottom: '8px',
                  width: '100%'
                }}>
                  <button
                    type="button"
                    onClick={() => setHighRiskChartPage(p => Math.max(p - 1, 1))}
                    disabled={highRiskChartPage === 1}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: highRiskChartPage === 1 ? '#F1F5F9' : '#1B365D',
                      color: highRiskChartPage === 1 ? '#94A3B8' : '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: highRiskChartPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    &larr; Prev Stations
                  </button>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    Page {highRiskChartPage} of {Math.ceil(extraChartData.length / highRiskChartLimit)} ({extraChartData.length} stations total)
                  </span>
                  <button
                    type="button"
                    onClick={() => setHighRiskChartPage(p => Math.min(p + 1, Math.ceil(extraChartData.length / highRiskChartLimit)))}
                    disabled={highRiskChartPage === Math.ceil(extraChartData.length / highRiskChartLimit)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: highRiskChartPage === Math.ceil(extraChartData.length / highRiskChartLimit) ? '#F1F5F9' : '#1B365D',
                      color: highRiskChartPage === Math.ceil(extraChartData.length / highRiskChartLimit) ? '#94A3B8' : '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: highRiskChartPage === Math.ceil(extraChartData.length / highRiskChartLimit) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next Stations &rarr;
                  </button>
                </div>
              )}
            </ChartCard>

            {/* Table section */}
            <DrillDownTable data={data} graphType={graphType} />

            {/* Pagination footer */}
            <DrillDownPagination 
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DrillDownChartModal;
