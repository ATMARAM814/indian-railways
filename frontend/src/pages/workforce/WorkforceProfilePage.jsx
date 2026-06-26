import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Award, 
  Briefcase, TrendingUp, MapPin, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, 
  YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { getWorkforceDetails } from '../../services/workforce.service';
import { cleanDesignationText } from '../../utils/dashboardMappers';

const WorkforceProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getWorkforceDetails(id);
        if (res.success) {
          setProfile(res.data);
        } else {
          setError(res.message || 'Failed to retrieve profile details');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <LoadingState message="Fetching detailed workforce profile..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div style={{ padding: '32px' }}>
          <ErrorState title="Failed to Load Profile" message={error || 'Profile not found'} />
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              marginTop: '16px', 
              padding: '10px 18px', 
              fontSize: '13.5px', 
              fontWeight: 600, 
              color: '#475569', 
              backgroundColor: '#F1F5F9', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Render Category Badge
  const renderCategoryBadge = (cat) => {
    if (!cat || cat === '—' || cat === 'N/A') return <span style={{ color: '#94A3B8', fontWeight: 600 }}>N/A</span>;
    let styles = { padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 };

    switch (cat.toUpperCase()) {
      case 'A':
        styles = { ...styles, backgroundColor: '#E0F2FE', color: '#0369A1' };
        break;
      case 'B':
        styles = { ...styles, backgroundColor: '#F3E8FF', color: '#6B21A8' };
        break;
      case 'C':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#B45309' };
        break;
      case 'D':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }
    return <span style={styles}>Cat {cat}</span>;
  };

  // Render Risk Badge
  const renderRiskBadge = (risk) => {
    if (!risk || risk === 'NOT_CATEGORIZED') return <span style={{ color: '#94A3B8', fontWeight: 600 }}>N/A</span>;
    let styles = { padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' };

    switch (risk.toUpperCase()) {
      case 'LOW':
        styles = { ...styles, backgroundColor: '#DCFCE7', color: '#15803D' };
        break;
      case 'MEDIUM':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#D97706' };
        break;
      case 'HIGH':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }
    return <span style={styles}>{risk} Risk</span>;
  };

  // Format Date helper (e.g. 04-Jun-2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <DashboardLayout>
      <div className="profile-page-container">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            marginBottom: '24px', 
            padding: '8px 14px', 
            fontSize: '13px', 
            fontWeight: 600, 
            color: '#475569', 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #D7E3EF', 
            borderRadius: '8px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(11, 35, 65, 0.05)'
          }}
        >
          <ArrowLeft size={16} /> Back to Workforce
        </button>

        {/* Profile Header Block */}
        <div className="profile-header-card">
          {/* Avatar and Main Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              backgroundColor: '#EEF6FC',
              color: '#1B365D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
              border: '1px solid rgba(27, 54, 93, 0.1)'
            }}>
              {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>{profile.full_name}</h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: profile.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                  color: profile.status === 'active' ? '#16A34A' : '#64748B'
                }}>
                  {profile.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} />
                <span>{cleanDesignationText(profile.designation || profile.role)}</span>
                <span style={{ color: '#D7E3EF' }}>|</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{profile.hrms_id}</span>
              </p>
            </div>
          </div>

          {/* Core Badges Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '10px 16px', borderRight: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Category</span>
              <div style={{ marginTop: '6px' }}>{renderCategoryBadge(profile.categoryCode)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 16px', borderRight: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Risk Level</span>
              <div style={{ marginTop: '6px' }}>{renderRiskBadge(profile.riskLevel)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 16px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Latest Evaluation</span>
              <div style={{ marginTop: '6px', fontSize: '16px', fontWeight: 700, color: profile.summary?.totalAssessments > 0 ? '#1B365D' : '#94A3B8' }}>
                {profile.summary?.totalAssessments > 0 ? `${parseFloat(profile.trend[profile.trend.length - 1]?.score || 0).toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="profile-layout-grid" style={{ marginBottom: '28px' }}>
          
          {/* Left Column (Bio, Posting, Hierarchy) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Personal & Professional Details Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>Staff Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Employee ID</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                    <User size={15} style={{ color: '#94A3B8' }} />
                    {profile.employee_id || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                    <Phone size={15} style={{ color: '#94A3B8' }} />
                    {profile.phone || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                    <Mail size={15} style={{ color: '#94A3B8' }} />
                    {profile.email || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Record Created At</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                    <Calendar size={15} style={{ color: '#94A3B8' }} />
                    {formatDate(profile.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Posting Details Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>Posting Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Current Station</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                    <MapPin size={15} style={{ color: '#94A3B8' }} />
                    {profile.stationName ? `${profile.stationName} (${profile.stationCode})` : 'Unassigned'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Division</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                    <MapPin size={15} style={{ color: '#94A3B8' }} />
                    {profile.divisionName ? `${profile.divisionName} (${profile.divisionCode})` : '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Zone</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                    <MapPin size={15} style={{ color: '#94A3B8' }} />
                    {profile.zone || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting Hierarchy Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>Reporting Hierarchy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Pointsman/Shunting Master specific hierarchy */}
                {['PM', 'Shunting Master'].includes(profile.role) && (
                  <>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #1B365D' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Station Master (SM)</span>
                      <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A', marginTop: '2px' }}>
                        {profile.hierarchy?.assignedSm?.full_name || 'No SM Assigned'}
                      </strong>
                      {profile.hierarchy?.assignedSm?.hrms_id && (
                        <span style={{ fontSize: '12px', color: '#64748B' }}>HRMS: {profile.hierarchy.assignedSm.hrms_id}</span>
                      )}
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #1B365D' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Traffic Inspector (TI)</span>
                      <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A', marginTop: '2px' }}>
                        {profile.hierarchy?.assignedTi?.full_name || 'No TI Assigned'}
                      </strong>
                      {profile.hierarchy?.assignedTi?.hrms_id && (
                        <span style={{ fontSize: '12px', color: '#64748B' }}>HRMS: {profile.hierarchy.assignedTi.hrms_id}</span>
                      )}
                    </div>
                  </>
                )}

                {/* Station Master specific hierarchy */}
                {['SM', 'SS', 'Cabin Master', 'CABIN MASTER'].includes(profile.role) && (
                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #1B365D' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Traffic Inspector (TI)</span>
                    <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A', marginTop: '2px' }}>
                      {profile.hierarchy?.assignedTi?.full_name || 'No TI Assigned'}
                    </strong>
                    {profile.hierarchy?.assignedTi?.hrms_id && (
                      <span style={{ fontSize: '12px', color: '#64748B' }}>HRMS: {profile.hierarchy.assignedTi.hrms_id}</span>
                    )}
                  </div>
                )}

                {/* General/Common Higher levels */}
                {['PM', 'SM', 'TI', 'TM', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'Shunting Master'].includes(profile.role) && (
                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #1B365D' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Assistant Operations Manager (AOM)</span>
                    <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A', marginTop: '2px' }}>
                      {profile.hierarchy?.assignedAom?.full_name || 'No AOM Assigned'}
                    </strong>
                    {profile.hierarchy?.assignedAom?.hrms_id && (
                      <span style={{ fontSize: '12px', color: '#64748B' }}>HRMS: {profile.hierarchy.assignedAom.hrms_id}</span>
                    )}
                  </div>
                )}

                {/* AOM Specific Division assignments */}
                {profile.role === 'AOM' && (
                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #1B365D' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Division</span>
                    <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A', marginTop: '2px' }}>
                      {profile.hierarchy?.divisionInfo?.name || 'No Division Assigned'}
                    </strong>
                    {profile.hierarchy?.divisionInfo?.code && (
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        Code: {profile.hierarchy.divisionInfo.code} | Zone: {profile.hierarchy.divisionInfo.zone}
                      </span>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Right Column (Metrics, Trend Graph, History Table) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Assessment Summary stats */}
            <div className="profile-kpi-grid">
              
              {/* Assessments Completed */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Assessments</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>{profile.summary?.totalAssessments || 0}</div>
              </div>

              {/* Avg Score */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Avg Score</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: profile.summary?.averageScore >= 80 ? '#16A34A' : profile.summary?.averageScore >= 50 ? '#D97706' : '#DC2626', marginTop: '6px' }}>
                  {profile.summary?.totalAssessments > 0 ? `${parseFloat(profile.summary.averageScore).toFixed(1)}%` : '—'}
                </div>
              </div>

              {/* Highest Score */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Highest Score</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A', marginTop: '6px' }}>
                  {profile.summary?.totalAssessments > 0 ? `${parseFloat(profile.summary.highestScore).toFixed(1)}%` : '—'}
                </div>
              </div>

              {/* Lowest Score */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Lowest Score</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626', marginTop: '6px' }}>
                  {profile.summary?.totalAssessments > 0 ? `${parseFloat(profile.summary.lowestScore).toFixed(1)}%` : '—'}
                </div>
              </div>

            </div>

            {/* Score Trend Graph Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: '#1B365D' }} />
                Evaluation Score Performance Trend
              </h3>
              <div style={{ flex: 1, minHeight: '220px', width: '100%' }}>
                {profile.trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={profile.trend.map((t, idx) => ({ ...t, formattedDate: formatDate(t.date), label: `Eval ${idx + 1}` }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #D7E3EF' }} formatter={(value) => [`${value}%`, 'Score']} labelFormatter={(label, items) => items[0]?.payload?.formattedDate || label} />
                      <Line type="monotone" dataKey="score" stroke="#1B365D" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94A3B8', fontSize: '13.5px' }}>
                    No completed evaluations recorded to display trend.
                  </div>
                )}
              </div>
            </div>

            {/* Assessment History Table */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #EEF2F6', paddingBottom: '12px' }}>Assessment History</h3>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role Type</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessor</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.history?.map((hist) => (
                      <tr key={hist.id} style={{ borderBottom: '1px solid #EEF2F6' }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                          {formatDate(hist.evaluatedAt || hist.createdAt)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1B365D' }}>
                          {hist.assessmentType}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700 }}>
                          {hist.status === 'cancelled' || hist.approvalStatus === 'rejected' ? (
                            <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>
                          ) : hist.finalScore !== null && hist.approvalStatus === 'approved' ? (
                            <span style={{ color: hist.finalScore >= 80 ? '#16A34A' : hist.finalScore >= 50 ? '#D97706' : '#DC2626' }}>
                              {hist.finalScore.toFixed(1)}%
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Results pending</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                          {hist.assessorName}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {hist.status === 'cancelled' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                              <XCircle size={14} style={{ color: '#94A3B8' }} /> Cancelled
                            </span>
                          ) : hist.approvalStatus === 'approved' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>
                              <CheckCircle size={14} /> Approved
                            </span>
                          ) : hist.approvalStatus === 'rejected' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
                              <XCircle size={14} /> Rejected
                            </span>
                          ) : hist.approvalStatus === 'pending_approval' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>
                              <Clock size={14} /> Pending
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!profile.history || profile.history.length === 0) && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px', fontSize: '13px' }}>
                          No historical assessment records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default WorkforceProfilePage;
