import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Award, Briefcase, 
  MapPin, CheckCircle, XCircle, Clock, Shield, 
  Activity, ArrowRight, HelpCircle, HardDrive, TrendingUp,
  Compass, FileText, LayoutDashboard
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, 
  YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { getWorkforceDetails } from '../../services/workforce.service';
import { cleanDesignationText } from '../../utils/dashboardMappers';

// Grid Info Field Component
const DetailField = ({ icon, label, value, isBadge = false, isOrange = false, isGreen = false, subtext = null }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#F0F4FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      {React.cloneElement(icon, { size: 18, style: { color: '#2B5CE6' } })}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {isBadge ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{ 
            padding: '2px 10px', 
            borderRadius: '9999px', 
            fontSize: '11.5px', 
            fontWeight: 700, 
            backgroundColor: '#DEF7EC', 
            color: '#03543F',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#31C48D' }} />
            {value}
          </span>
        </div>
      ) : (
        <div style={{ 
          fontSize: '13.5px', 
          fontWeight: 700, 
          color: isOrange ? '#D97706' : isGreen ? '#16A34A' : '#1E293B'
        }}>
          {value}
          {subtext && (
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#16A34A', marginTop: '1px' }}>
              {subtext}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const MyProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        throw new Error('User session not found. Please log in again.');
      }
      const res = await getWorkforceDetails(user.id);
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

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <LoadingState message="Fetching your profile details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div style={{ padding: '32px' }}>
          <ErrorState 
            title="Failed to Load Profile" 
            message={error || 'Profile details could not be found.'} 
          />
          <button 
            onClick={loadProfile} 
            style={{ 
              marginTop: '16px', 
              padding: '10px 18px', 
              fontSize: '13.5px', 
              fontWeight: 600, 
              color: '#FFFFFF', 
              backgroundColor: '#1B365D', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(27, 54, 93, 0.2)'
            }}
          >
            Retry Fetching
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Format Date helper (e.g. 14 Aug 1992)
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Available';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate());
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Get User Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Derive display designation
  const getDisplayRoleName = (role) => {
    const rolesMap = {
      PM: 'Pointsman',
      SM: 'Station Master',
      TI: 'Traffic Inspector',
      AOM: 'Assistant Operations Manager',
      SS: 'SM Incharge',
      TM: 'Train Manager',
      SHM: 'Shunting Master',
      'SHUNTING MASTER': 'Shunting Master',
      'Shunting Master': 'Shunting Master',
      SUPER_ADMIN: 'Super Admin'
    };
    return rolesMap[role] || role;
  };

  // Check if operational details exist in database values
  const hasOperationalDetails = 
    profile.pme_last_completed || 
    profile.pme_next_due || 
    profile.refresher_completed || 
    profile.refresher_due || 
    profile.training_clearance || 
    profile.postedFrom || 
    profile.postingType;


  return (
    <DashboardLayout>
      {/* Responsive Layout Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .profile-hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1.8fr;
          gap: 24px;
          align-items: center;
          background: var(--primary-navy, #0B2341);
          color: #FFFFFF;
          border-radius: var(--radius-lg, 12px);
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: var(--shadow-md, 0 4px 6px rgba(11, 35, 65, 0.08));
        }
        .profile-kpi-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
        }
        .profile-grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: start;
        }
        .profile-operational-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px 20px;
          flex: 1;
        }
        @media (max-width: 1200px) {
          .profile-hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .profile-kpi-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 1024px) {
          .profile-grid-container {
            grid-template-columns: 1fr;
          }
          .profile-operational-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .profile-kpi-container {
            grid-template-columns: 1fr;
          }
          .profile-operational-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      <div style={{ padding: '32px', fontFamily: "'Outfit', 'Inter', sans-serif", backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={24} style={{ color: '#1B365D' }} />
            My Profile
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
            View your personal details, assessment performance and service information
          </p>
        </div>

        {/* Profile Summary Hero Card */}
        <div className="profile-hero-grid">
          {/* Left: Avatar & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-blue, #2B5CE6)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 700,
                border: '3px solid #FFFFFF',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                {getInitials(profile.full_name)}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '3px solid #FFFFFF'
              }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>{profile.full_name}</h2>
              <div style={{ fontSize: '14px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <span>{cleanDesignationText(profile.designation || getDisplayRoleName(profile.role))}</span>
              </div>
              
              {/* Location info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} />
                  {profile.stationName ? `${profile.stationName} (${profile.stationCode})` : 'Unassigned'}
                  {profile.zone ? ` • ${profile.zone}` : ''}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={14} />
                  {profile.divisionName ? profile.divisionName : 'Not Available'}
                </span>
              </div>

              {/* Badges Row */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '9999px', 
                  fontSize: '11px', 
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  border: '1px solid #10B981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Active
                </span>
                {profile.categoryCode && (
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '9999px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3B82F6',
                    border: '1px solid #3B82F6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Category {profile.categoryCode}
                  </span>
                )}
                {profile.riskLevel && profile.riskLevel !== 'NOT_CATEGORIZED' && (
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '9999px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#F59E0B',
                    border: '1px solid #F59E0B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {profile.riskLevel} Risk
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary KPIs */}
          <div className="profile-kpi-container">
            {/* KPI box */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '12px', 
              padding: '14px 16px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={13} style={{ color: '#38BDF8' }} />
                Latest Score
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '6px', color: '#FFFFFF' }}>
                {profile.summary?.totalAssessments > 0 ? (
                  <>
                    {parseFloat(profile.trend[profile.trend.length - 1]?.score || 0).toFixed(0)}
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>/100</span>
                  </>
                ) : '—'}
              </div>
            </div>

            {/* KPI 2 */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '12px', 
              padding: '14px 16px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={13} style={{ color: '#38BDF8' }} />
                Total Assessments
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '6px', color: '#FFFFFF' }}>
                {profile.summary?.totalAssessments || 0}
              </div>
            </div>

            {/* KPI 3 */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '12px', 
              padding: '14px 16px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={13} style={{ color: '#38BDF8' }} />
                Average Score
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '6px', color: '#FFFFFF' }}>
                {profile.summary?.totalAssessments > 0 ? (
                  <>
                    {parseFloat(profile.summary.averageScore || 0).toFixed(1)}
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>/100</span>
                  </>
                ) : '—'}
              </div>
            </div>

            {/* KPI 4 */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '12px', 
              padding: '14px 16px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} style={{ color: '#38BDF8' }} />
                Last Assessment
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.lastAssessmentDate ? formatDate(profile.lastAssessmentDate) : 'Not Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic layout: Row 1 containing Personal Details and Operational Details side-by-side */}
        <div className="profile-grid-container" style={{ marginBottom: '28px' }}>
          
          {/* Row 1, Col 1: Personal Details */}
          <div style={{ 
            backgroundColor: 'var(--card-bg, #FFFFFF)', 
            border: '1px solid var(--border-light, #D7E3EF)', 
            borderRadius: 'var(--radius-lg, 12px)', 
            padding: '24px', 
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(11, 35, 65, 0.05))',
            display: 'flex',
            flexDirection: 'column',
            height: '420px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1B365D', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: '#2B5CE6' }} />
                Personal & Professional Details
              </h3>
              <span style={{ color: '#2B5CE6', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>•••</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', flex: 1 }}>
              <DetailField 
                icon={<HardDrive />} 
                label="Employee ID / HRMS ID" 
                value={profile.employee_id || profile.hrms_id || '—'} 
              />
              <DetailField 
                icon={<Briefcase />} 
                label="Designation" 
                value={cleanDesignationText(profile.designation || getDisplayRoleName(profile.role)) || '—'} 
              />
              <DetailField 
                icon={<Calendar />} 
                label="Date of Birth" 
                value={profile.dob ? formatDate(profile.dob) : '—'} 
              />
              <DetailField 
                icon={<Compass />} 
                label="Current Zone" 
                value={profile.zone || '—'} 
              />
              <DetailField 
                icon={<Phone />} 
                label="Mobile Number" 
                value={profile.phone ? `+91 ${profile.phone}` : '—'} 
              />
              <DetailField 
                icon={<MapPin />} 
                label="Current Division" 
                value={profile.divisionName || '—'} 
              />
              <DetailField 
                icon={<Mail />} 
                label="Email ID" 
                value={profile.email || '—'} 
              />
              <DetailField 
                icon={<MapPin />} 
                label="Current Station Placement" 
                value={profile.stationName ? `${profile.stationName} (${profile.stationCode})` : '—'} 
              />
              <DetailField 
                icon={<Shield />} 
                label="Account Status" 
                value={profile.status ? profile.status.toUpperCase() : '—'} 
                isBadge={profile.status === 'active' || profile.status === 'inactive'} 
              />
              <DetailField 
                icon={<User />} 
                label="Reporting Officer" 
                value={(() => {
                  const role = profile.role;
                  const { assignedSm, assignedTi, assignedAom } = profile.hierarchy || {};
                  if (role === 'PM' || role === 'Shunting Master' || role === 'SHUNTING MASTER' || role === 'SHM') {
                    if (assignedSm?.full_name) return `${assignedSm.full_name} (SM)`;
                    if (assignedTi?.full_name) return `${assignedTi.full_name} (TI)`;
                    if (assignedAom?.full_name) return `${assignedAom.full_name} (AOM)`;
                  } else if (role === 'SM' || role === 'SS' || role === 'Cabin Master' || role === 'CABIN MASTER') {
                    if (assignedTi?.full_name) return `${assignedTi.full_name} (TI)`;
                    if (assignedAom?.full_name) return `${assignedAom.full_name} (AOM)`;
                  } else if (role === 'TI') {
                    if (assignedAom?.full_name) return `${assignedAom.full_name} (AOM)`;
                  } else if (role === 'TM') {
                    if (assignedTi?.full_name) return `${assignedTi.full_name} (TI)`;
                    if (assignedAom?.full_name) return `${assignedAom.full_name} (AOM)`;
                  } else if (role === 'AOM') {
                    return 'Sr. DOM';
                  }
                  return '—';
                })()} 
              />
              <DetailField 
                icon={<Calendar />} 
                label="Joining Date" 
                value={profile.created_at ? formatDate(profile.created_at) : '—'} 
              />
              <DetailField 
                icon={<FileText />} 
                label="Employee Type" 
                value={profile.employee_type || '—'} 
              />
            </div>
          </div>


        </div>

      </div>
    </DashboardLayout>
  );
};

export default MyProfilePage;
