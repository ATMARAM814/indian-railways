// CounselingPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  getCandidateCounselingData, 
  saveCandidateCounselingData, 
  activateCandidateRetest, 
  getCounselingDirectory, 
  getCandidateCounselingHistory,
  getEligibleCandidatesForScheduling,
  scheduleCounseling,
  getScheduledCounselingList,
  cancelScheduledCounseling,
  getRetestHistory
} from '../../api/counselingApi';
import { 
  ArrowLeft, User, ShieldAlert, CheckCircle, AlertCircle, Save, Loader2, MessageSquare, Zap, Search, Calendar, History,
  Clock, AlertTriangle, UserCheck, Eye, Trash2, ChevronRight, X
} from 'lucide-react';

const CounselingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidateId');

  const [candidate, setCandidate] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activatingRetest, setActivatingRetest] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Directory State
  const [directoryCandidates, setDirectoryCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCandidateHistory, setSelectedCandidateHistory] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Candidate history state (for checklist view)
  const [candidateHistory, setCandidateHistory] = useState([]);

  // New Counseling Control Centre Tabs: 'landing', 'schedule', 'categoryC', 'categoryD', 'history'
  const [currentTab, setCurrentTab] = useState('landing');
  const [eligibleCandidates, setEligibleCandidates] = useState([]);
  const [selectedEligibleId, setSelectedEligibleId] = useState('');
  const [scheduledList, setScheduledList] = useState([]);
  const [retestHistory, setRetestHistory] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [historyLogLoading, setHistoryLogLoading] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');

  const refreshScheduledList = async () => {
    try {
      const schedRes = await getScheduledCounselingList();
      if (schedRes.success) {
        setScheduledList(schedRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshRetestHistory = async () => {
    try {
      const histRetestRes = await getRetestHistory();
      if (histRetestRes.success) {
        setRetestHistory(histRetestRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (candidateId) {
          // Fetch candidate checklist details
          const data = await getCandidateCounselingData(candidateId);
          if (data.success) {
            setCandidate(data.data.candidate);
            setSubjects(data.data.subjects || []);
          } else {
            setError(data.message || "Failed to load candidate counseling details.");
          }

          // Fetch candidate completed history
          try {
            const histRes = await getCandidateCounselingHistory(candidateId);
            if (histRes.success) {
              setCandidateHistory(histRes.data || []);
            }
          } catch (histErr) {
            console.error("Error loading candidate history:", histErr);
          }
        } else {
          // Fetch overall directory list
          const res = await getCounselingDirectory();
          if (res.success) {
            setDirectoryCandidates(res.data.data || res.data || []);
          } else {
            setError(res.message || "Failed to load counseling directory.");
          }

          // Fetch eligible candidates for scheduling
          try {
            const eligRes = await getEligibleCandidatesForScheduling();
            if (eligRes.success) {
              setEligibleCandidates(eligRes.data || []);
            }
          } catch (eligErr) {
            console.error("Failed to load eligible candidates", eligErr);
          }

          // Fetch scheduled counseling list
          try {
            const schedRes = await getScheduledCounselingList();
            if (schedRes.success) {
              setScheduledList(schedRes.data || []);
            }
          } catch (schedErr) {
            console.error("Failed to load scheduled counseling list", schedErr);
          }

          // Fetch completed retests history
          try {
            const histRetestRes = await getRetestHistory();
            if (histRetestRes.success) {
              setRetestHistory(histRetestRes.data || []);
            }
          } catch (histRetestErr) {
            console.error("Failed to load retest history", histRetestErr);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Error occurred connecting to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId]);

  const handleToggle = (subjectId, isCompleted) => {
    setSubjects(prev =>
      prev.map(sub =>
        sub.subjectId === subjectId
          ? { ...sub, isCompleted }
          : sub
      )
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const statusList = subjects.map(sub => ({
        subjectId: sub.subjectId,
        isCompleted: sub.isCompleted
      }));

      const res = await saveCandidateCounselingData({
        profileId: candidateId,
        statusList
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Counseling checklist saved successfully!'
        });
        // Refetch to get updated "marked by" and "marked at" metadata
        const updated = await getCandidateCounselingData(candidateId);
        if (updated.success) {
          setSubjects(updated.data.subjects || []);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to save counseling record.'
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error occurred while saving.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateRetest = async () => {
    setActivatingRetest(true);
    setFeedback(null);
    try {
      const statusList = subjects.map(sub => ({
        subjectId: sub.subjectId,
        isCompleted: sub.isCompleted
      }));
      await saveCandidateCounselingData({
        profileId: candidateId,
        statusList
      });

      const res = await activateCandidateRetest(candidateId);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Retest successfully activated! The candidate can now attempt their test. This test will remain active for 1 week.'
        });
        const updated = await getCandidateCounselingData(candidateId);
        if (updated.success) {
          setSubjects(updated.data.subjects || []);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to activate retest.'
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error occurred while activating retest.'
      });
    } finally {
      setActivatingRetest(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()} ${hours}:${minutes}`;
  };

  const formatDateDateOnly = (dateStrOrDate) => {
    if (!dateStrOrDate) return 'None';
    const d = new Date(dateStrOrDate);
    if (isNaN(d.getTime())) return dateStrOrDate;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const getNextDueDate = (candidate) => {
    if (!candidate.prevCounselingDate) {
      return { date: null, status: 'overdue', text: 'Immediate (Pending)' };
    }
    const prevDate = new Date(candidate.prevCounselingDate);
    const monthsToAdd = candidate.category === 'D' ? 1 : 3;
    const nextDate = new Date(prevDate.setMonth(prevDate.getMonth() + monthsToAdd));
    
    const today = new Date();
    // Reset times to compare dates accurately
    today.setHours(0,0,0,0);
    const nextDateCompare = new Date(nextDate);
    nextDateCompare.setHours(0,0,0,0);

    const diffTime = nextDateCompare.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = 'completed';
    let statusText = `Scheduled (${formatDateDateOnly(nextDate)})`;
    
    if (diffDays < 0) {
      status = 'overdue';
      statusText = `Overdue (${Math.abs(diffDays)} days ago)`;
    } else if (diffDays <= 7) {
      status = 'due_soon';
      statusText = `Due Soon (in ${diffDays} days)`;
    }
    
    return { date: nextDate, status, text: statusText };
  };

  const handleOpenHistory = async (candidate) => {
    setSelectedCandidateHistory(candidate);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await getCandidateCounselingHistory(candidate.userId);
      if (res.success) {
        setHistoryList(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#0B2341' }} />
          <span style={{ fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>Loading counseling checklist...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{
          padding: '24px 32px',
          fontFamily: "'Poppins', 'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D7E3EF',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: '#475569',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderColor = '#BFDBFE';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#D7E3EF';
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', margin: 0 }}>
                Railway Evaluation System
              </h1>
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '12px',
            color: '#991B1B',
            maxWidth: '600px',
            marginTop: '20px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Connection Error</h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>{error}</p>
            <button
              onClick={() => navigate(-1)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidateId) {
    const handleScheduleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedEligibleId) return;
      setScheduleLoading(true);
      setFeedback(null);
      try {
        const res = await scheduleCounseling(selectedEligibleId);
        if (res.success) {
          setFeedback({
            type: 'success',
            message: res.message || 'Counselling session scheduled successfully.'
          });
          setSelectedEligibleId('');
          await refreshScheduledList();
        } else {
          setFeedback({
            type: 'error',
            message: res.message || 'Failed to schedule session.'
          });
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || err.message || 'Error occurred while scheduling.'
        });
      } finally {
        setScheduleLoading(false);
        setTimeout(() => setFeedback(null), 4000);
      }
    };

    const handleCancelSchedule = async (scheduleId) => {
      if (!window.confirm("Are you sure you want to cancel this scheduled counselling?")) return;
      setFeedback(null);
      try {
        const res = await cancelScheduledCounseling(scheduleId);
        if (res.success) {
          setFeedback({
            type: 'success',
            message: 'Counselling schedule cancelled successfully.'
          });
          await refreshScheduledList();
        } else {
          setFeedback({
            type: 'error',
            message: res.message || 'Failed to cancel schedule.'
          });
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || err.message || 'Error occurred while cancelling.'
        });
      } finally {
        setTimeout(() => setFeedback(null), 4000);
      }
    };

    const getFilteredCandidates = (category) => {
      return directoryCandidates.filter((cand) => {
        if (cand.category !== category) return false;
        
        const matchesSearch =
          (cand.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
          (cand.hrmsId || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
          (cand.stationName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
          (cand.stationCode || '').toLowerCase().includes((searchQuery || '').toLowerCase());

        const dueDateInfo = getNextDueDate(cand);
        const matchesStatus =
          statusFilter === 'all' || dueDateInfo.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
    };

    const getFilteredHistory = () => {
      return retestHistory.filter((row) => {
        const term = (searchQuery || '').toLowerCase();
        const nameMatch = (row.fullName || '').toLowerCase().includes(term);
        const hrmsMatch = (row.hrmsId || '').toLowerCase().includes(term);
        const stationNameMatch = (row.stationName || '').toLowerCase().includes(term);
        const stationCodeMatch = (row.stationCode || '').toLowerCase().includes(term);
        return nameMatch || hrmsMatch || stationNameMatch || stationCodeMatch;
      });
    };

    const filteredEligibleOptions = eligibleCandidates.filter(c => 
      (c.fullName || '').toLowerCase().includes((scheduleSearch || '').toLowerCase()) ||
      (c.hrmsId || '').toLowerCase().includes((scheduleSearch || '').toLowerCase()) ||
      (c.role || '').toLowerCase().includes((scheduleSearch || '').toLowerCase()) ||
      (c.stationName || '').toLowerCase().includes((scheduleSearch || '').toLowerCase())
    );

    const catCCount = directoryCandidates.filter(c => c.category === 'C').length;
    const catDCount = directoryCandidates.filter(c => c.category === 'D').length;

    return (
      <DashboardLayout>
        <div style={{
          padding: '24px 32px',
          fontFamily: "'Poppins', 'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          width: '100%'
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', margin: 0 }}>
                Counselling Control Centre
              </h1>
              <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                {currentTab === 'landing' && 'Manage category-based safety counselling, manually schedule sessions, and view completed retest outcomes.'}
                {currentTab === 'schedule' && 'Manually schedule safety counselling for any candidate under your scope.'}
                {currentTab === 'categoryC' && 'Quarterly Safety Counselling Watchlist (Category C / Medium Risk Staff)'}
                {currentTab === 'categoryD' && 'Monthly Safety Counselling Watchlist (Category D / High Risk Staff)'}
                {currentTab === 'history' && 'Logs and scorecard histories of all completed safety counselling cycles.'}
              </p>
            </div>
            {currentTab !== 'landing' && (
              <button
                onClick={() => {
                  setCurrentTab('landing');
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D7E3EF',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                <ArrowLeft size={16} />
                Back to Control Centre
              </button>
            )}
          </div>

          {/* Feedback Messages */}
          {feedback && (
            <div style={{
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: feedback.type === 'success' ? '#A7F3D0' : '#FCA5A5',
              backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: feedback.type === 'success' ? '#065F46' : '#991B1B',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* LANDING TAB: 4 Dashboard Cards */}
          {currentTab === 'landing' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
              marginTop: '8px'
            }}>
              {/* Card 1: Schedule Counselling */}
              <div 
                onClick={() => setCurrentTab('schedule')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #2B5CE6',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341' }}>Schedule Counselling</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    Manually schedule a counselling session for any employee.
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
                    {scheduledList.length} Active
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#EFF6FF',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2B5CE6',
                  flexShrink: 0
                }}>
                  <Calendar size={18} />
                </div>
              </div>

              {/* Card 2: Category C Watchlist */}
              <div 
                onClick={() => setCurrentTab('categoryC')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #F59E0B',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341' }}>Category C Watchlist</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    Medium risk safety staff. Requires quarterly counselling.
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
                    {catCCount} Flagged
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={18} />
                </div>
              </div>

              {/* Card 3: Category D Watchlist */}
              <div 
                onClick={() => setCurrentTab('categoryD')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #EF4444',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341' }}>Category D Watchlist</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    High risk safety staff. Requires immediate monthly counselling.
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
                    {catDCount} Flagged
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#FEE2E2',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  flexShrink: 0
                }}>
                  <ShieldAlert size={18} />
                </div>
              </div>

              {/* Card 4: Retest History Log */}
              <div 
                onClick={() => setCurrentTab('history')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #64748B',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341' }}>Counselling History Log</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    View completed safety cycles, dates, and historical scorecards.
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
                    {retestHistory.length} Completed
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  flexShrink: 0
                }}>
                  <History size={18} />
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE COUNSELLING TAB */}
          {currentTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Form Section */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #D7E3EF',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0B2341' }}>
                  Schedule Manually
                </h3>
                <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      Select Candidate Working Under You
                    </label>
                    <input 
                      type="text" 
                      placeholder="Type candidate name, HRMS, or role to filter..." 
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        outline: 'none',
                        marginBottom: '8px'
                      }}
                    />
                    <select
                      value={selectedEligibleId}
                      onChange={(e) => setSelectedEligibleId(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Choose Candidate --</option>
                      {filteredEligibleOptions.map(c => (
                        <option key={c.userId} value={c.userId}>
                          {c.fullName} ({c.hrmsId}) | {c.role} | {c.stationCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={scheduleLoading || !selectedEligibleId}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: selectedEligibleId ? '#2B5CE6' : '#94A3B8',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: selectedEligibleId ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      alignSelf: 'flex-start',
                      transition: 'all 0.2s'
                    }}
                  >
                    {scheduleLoading ? <Loader2 className="animate-spin" size={16} /> : <Calendar size={16} />}
                    <span>Schedule Counselling</span>
                  </button>
                </form>
              </div>

              {/* Table Section */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #D7E3EF',
                boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0B2341' }}>
                    Scheduled Counselling Sessions ({scheduledList.length})
                  </h3>
                </div>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13.5px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      color: '#475569',
                      fontWeight: 600
                    }}>
                      <th style={{ padding: '16px 20px' }}>Staff Details</th>
                      <th style={{ padding: '16px 20px' }}>Station</th>
                      <th style={{ padding: '16px 20px' }}>Category Info</th>
                      <th style={{ padding: '16px 20px' }}>Scheduled Date</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledList.map((cand) => {
                      const catColor = cand.category === 'D' ? '#EF4444' : cand.category === 'C' ? '#F59E0B' : '#64748B';
                      const catBg = cand.category === 'D' ? '#FEE2E2' : cand.category === 'C' ? '#FEF3C7' : '#F1F5F9';

                      return (
                        <tr
                          key={cand.userId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#0B2341' }}>{cand.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                              HRMS ID: {cand.hrmsId} | {cand.role}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 500, color: '#334155' }}>
                            {cand.stationName} ({cand.stationCode})
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: catBg,
                              color: catColor
                            }}>
                              {cand.category ? `Category ${cand.category}` : 'Not Categorized'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 500 }}>
                            {formatDate(cand.scheduledAt)}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleCancelSchedule(cand.scheduleId)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #EF4444',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                              >
                                <Trash2 size={13} />
                                Cancel
                              </button>
                              <button
                                onClick={() => navigate(`/counseling?candidateId=${cand.userId}`)}
                                style={{
                                  padding: '6px 14px',
                                  backgroundColor: '#3B82F6',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                              >
                                Start Counselling
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {scheduledList.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                          No scheduled manual counselling sessions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* WATCHLIST TABS (Category C / Category D) */}
          {(currentTab === 'categoryC' || currentTab === 'categoryD') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Filter Bar */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #D7E3EF',
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                  <Search style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8'
                  }} size={18} />
                  <input
                    type="text"
                    placeholder="Search staff by Name, HRMS ID, or Station..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="overdue">Overdue</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="completed">Completed / Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #D7E3EF',
                boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)',
                overflow: 'hidden'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13.5px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      color: '#475569',
                      fontWeight: 600
                    }}>
                      <th style={{ padding: '16px 20px' }}>Staff Details</th>
                      <th style={{ padding: '16px 20px' }}>Station</th>
                      <th style={{ padding: '16px 20px' }}>Risk Category</th>
                      <th style={{ padding: '16px 20px' }}>Previous Date</th>
                      <th style={{ padding: '16px 20px' }}>Next Due Date</th>
                      <th style={{ padding: '16px 20px' }}>Status</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredCandidates(currentTab === 'categoryC' ? 'C' : 'D').map((cand) => {
                      const dueDateInfo = getNextDueDate(cand);
                      
                      let badgeBg = '#E6FBF3';
                      let badgeColor = '#059669';
                      if (dueDateInfo.status === 'overdue') {
                        badgeBg = '#FEE2E2';
                        badgeColor = '#DC2626';
                      } else if (dueDateInfo.status === 'due_soon') {
                        badgeBg = '#FEF3C7';
                        badgeColor = '#D97706';
                      }

                      const catColor = cand.category === 'D' ? '#EF4444' : '#F59E0B';
                      const catBg = cand.category === 'D' ? '#FEE2E2' : '#FEF3C7';

                      return (
                        <tr
                          key={cand.userId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#0B2341' }}>{cand.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                              HRMS ID: {cand.hrmsId} | {cand.role}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 500, color: '#334155' }}>
                            {cand.stationName} ({cand.stationCode})
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: catBg,
                              color: catColor
                            }}>
                              Category {cand.category}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 500 }}>
                            {formatDateDateOnly(cand.prevCounselingDate)}
                          </td>
                          <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>
                            {dueDateInfo.date ? formatDateDateOnly(dueDateInfo.date) : 'Immediate'}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              backgroundColor: badgeBg,
                              color: badgeColor
                            }}>
                              {dueDateInfo.status.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleOpenHistory(cand)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#475569',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                              >
                                History ({cand.historyCount})
                              </button>
                              <button
                                onClick={() => navigate(`/counseling?candidateId=${cand.userId}`)}
                                style={{
                                  padding: '6px 14px',
                                  backgroundColor: '#3B82F6',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                              >
                                Counsel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {getFilteredCandidates(currentTab === 'categoryC' ? 'C' : 'D').length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                          No candidates found matching filters in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COUNSELLING & RETEST HISTORY LOG TAB */}
          {currentTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Filter Bar */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #D7E3EF',
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                  <Search style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8'
                  }} size={18} />
                  <input
                    type="text"
                    placeholder="Search history logs by employee name, HRMS, or station..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #D7E3EF',
                boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)',
                overflow: 'hidden'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13.5px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      color: '#475569',
                      fontWeight: 600
                    }}>
                      <th style={{ padding: '16px 20px' }}>Staff Details</th>
                      <th style={{ padding: '16px 20px' }}>Station</th>
                      <th style={{ padding: '16px 20px' }}>Retest Score</th>
                      <th style={{ padding: '16px 20px' }}>Category Resolved</th>
                      <th style={{ padding: '16px 20px' }}>Retest Date</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredHistory().map((row) => {
                      const scoreVal = parseFloat(row.retestScore || 0);
                      const isSafe = scoreVal >= 50;
                      const catColor = row.category === 'D' ? '#EF4444' : row.category === 'C' ? '#F59E0B' : '#059669';
                      const catBg = row.category === 'D' ? '#FEE2E2' : row.category === 'C' ? '#FEF3C7' : '#E6FBF3';

                      return (
                        <tr
                          key={row.assessmentId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#0B2341' }}>{row.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                              HRMS ID: {row.hrmsId} | {row.role}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 500, color: '#334155' }}>
                            {row.stationName} ({row.stationCode})
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 700, color: isSafe ? '#059669' : '#DC2626' }}>
                            {scoreVal.toFixed(1)}%
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: catBg,
                              color: catColor
                            }}>
                              Category {row.category || 'B'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 500 }}>
                            {formatDateDateOnly(row.completedAt)}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/assessments/${row.role}/${row.assessmentId}/view`)}
                              style={{
                                padding: '6px 14px',
                                backgroundColor: '#0B2341',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1B365D'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2341'}
                            >
                              <Eye size={13} />
                              View Scorecard
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {getFilteredHistory().length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                          No completed retests found matching search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Candidate Completed Retests History Modal (for Category C / D list) */}
          {historyModalOpen && selectedCandidateHistory && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80vh',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #D7E3EF'
              }}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0B2341' }}>
                      Counseling & Retest History Log
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                      {selectedCandidateHistory.fullName} ({selectedCandidateHistory.hrmsId})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setHistoryModalOpen(false);
                      setSelectedCandidateHistory(null);
                      setHistoryList([]);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '22px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#64748B',
                      outline: 'none'
                    }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                  {historyLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
                      <Loader2 className="animate-spin" size={24} style={{ color: '#0B2341' }} />
                      <span style={{ fontSize: '13px', color: '#64748B' }}>Loading records...</span>
                    </div>
                  ) : historyList.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                      No counseling history found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {historyList.map((log, index) => (
                        <div
                          key={log.id}
                          style={{
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '16px',
                            backgroundColor: '#F8FAFC'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>
                              Cycle Completed #{historyList.length - index}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                              Completed: {formatDate(log.completedAt)}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>
                              <strong>Counseled By:</strong> {log.completedByName || 'N/A'}
                            </span>
                            <span>
                              <strong>Post-Retest Score:</strong>{' '}
                              {log.retestScore !== null ? (
                                <span style={{
                                  fontWeight: 700,
                                  color: Number(log.retestScore) >= 50 ? '#10B981' : '#EF4444'
                                }}>
                                  {parseFloat(log.retestScore).toFixed(1)}%
                                </span>
                              ) : (
                                <span style={{ color: '#F59E0B', fontWeight: 600 }}>Retest Pending</span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  backgroundColor: '#F8FAFC',
                  borderBottomLeftRadius: '16px',
                  borderBottomRightRadius: '16px'
                }}>
                  <button
                    onClick={() => {
                      setHistoryModalOpen(false);
                      setSelectedCandidateHistory(null);
                      setHistoryList([]);
                    }}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#64748B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }


  const categoryColor = candidate?.category === 'D' ? '#EF4444' : '#F59E0B';
  const categoryBg = candidate?.category === 'D' ? '#FEE2E2' : '#FEF3C7';
  const allCompleted = subjects.length > 0 && subjects.every(sub => sub.isCompleted === true);

  return (
    <DashboardLayout>
      <div style={{
        padding: '24px 32px',
        fontFamily: "'Poppins', 'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D7E3EF',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: '#475569',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EFF6FF';
              e.currentTarget.style.borderColor = '#BFDBFE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#D7E3EF';
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', margin: 0 }}>
              Staff Counseling & Guidance
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              Mark completed counseling subjects and record feedback remarks for safety-monitored candidates.
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: feedback.type === 'success' ? '#A7F3D0' : '#FCA5A5',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Candidate Overview Card */}
        {candidate && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #D7E3EF',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0B2341' }}>
                  {candidate.fullName}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                  HRMS ID: {candidate.hrmsId} | Role: <strong style={{ color: '#1B365D' }}>{candidate.role}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Station</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                  {candidate.stationName} ({candidate.stationCode})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Latest Score</span>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: categoryColor }}>
                  {candidate.latestScore !== null ? `${parseFloat(candidate.latestScore).toFixed(1)}%` : 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Risk Level</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  backgroundColor: categoryBg,
                  color: categoryColor
                }}>
                  Category {candidate.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {candidate?.hasActiveTest && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid #BFDBFE',
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            <AlertCircle size={18} />
            <span>Retest is already active for this candidate. No further counselling actions or retest scheduling are required at this time.</span>
          </div>
        )}

        {/* Counseling Checklist Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #D7E3EF',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)'
        }}>
          <h2 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0B2341', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: '#0B2341' }} />
            Safety Counseling Subjects Checklist ({candidate?.role})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {subjects.map((sub, idx) => (
              <div
                key={sub.subjectId}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '18px',
                  backgroundColor: sub.isCompleted === true ? '#F8FAF8' : sub.isCompleted === false ? '#FFF5F5' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#1E293B' }}>
                      {idx + 1}. {sub.subjectName}
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                      {sub.description}
                    </p>
                  </div>

                  {/* Yes/No Completion Toggles */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={candidate?.hasActiveTest}
                      onClick={() => handleToggle(sub.subjectId, true)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: sub.isCompleted === true ? '#10B981' : '#CBD5E1',
                        backgroundColor: sub.isCompleted === true ? '#E6FBF3' : '#FFFFFF',
                        color: sub.isCompleted === true ? '#059669' : '#64748B',
                        cursor: candidate?.hasActiveTest ? 'not-allowed' : 'pointer',
                        opacity: candidate?.hasActiveTest ? 0.75 : 1,
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                    >
                      Completed (Yes)
                    </button>
                    <button
                      type="button"
                      disabled={candidate?.hasActiveTest}
                      onClick={() => handleToggle(sub.subjectId, false)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: sub.isCompleted === false ? '#EF4444' : '#CBD5E1',
                        backgroundColor: sub.isCompleted === false ? '#FEE2E2' : '#FFFFFF',
                        color: sub.isCompleted === false ? '#DC2626' : '#64748B',
                        cursor: candidate?.hasActiveTest ? 'not-allowed' : 'pointer',
                        opacity: candidate?.hasActiveTest ? 0.75 : 1,
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                    >
                      Pending (No)
                    </button>
                  </div>
                </div>

                {/* Last Completed Timestamp Info */}
                {sub.isCompleted === true && sub.markedByName && (
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 500, alignSelf: 'flex-start' }}>
                    ✔ Marked Completed by {sub.markedByName} on {formatDate(sub.markedAt)}
                  </span>
                )}
                {sub.isCompleted === false && sub.markedByName && (
                  <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 500, alignSelf: 'flex-start' }}>
                    ✘ Marked Pending by {sub.markedByName} on {formatDate(sub.markedAt)}
                  </span>
                )}
              </div>
            ))}

            {subjects.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                No counseling subjects configured for this candidate's role.
              </div>
            )}
          </div>
        </div>

        {/* Past Counseling Records Log */}
        {candidateHistory.length > 0 && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #D7E3EF',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.05)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0B2341', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: '#0B2341' }} />
              Past Completed Counseling Sessions History
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {candidateHistory.map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '13.5px' }}>
                      Session #{candidateHistory.length - index}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                      Conducted by: <strong>{log.completedByName || 'N/A'}</strong> on {formatDate(log.completedAt)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>
                      Retest Result Score:{' '}
                      {log.retestScore !== null ? (
                        <strong style={{
                          color: Number(log.retestScore) >= 50 ? '#10B981' : '#EF4444',
                          marginLeft: '4px'
                        }}>
                          {parseFloat(log.retestScore).toFixed(1)}%
                        </strong>
                      ) : (
                        <strong style={{ color: '#F59E0B', marginLeft: '4px' }}>Retest Pending</strong>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 24px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || activatingRetest || candidate?.hasActiveTest}
            style={{
              padding: '10px 24px',
              backgroundColor: candidate?.hasActiveTest ? '#E2E8F0' : '#10B981',
              color: candidate?.hasActiveTest ? '#94A3B8' : '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (submitting || activatingRetest || candidate?.hasActiveTest) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: candidate?.hasActiveTest ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!submitting && !activatingRetest && !candidate?.hasActiveTest) e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              if (!submitting && !activatingRetest && !candidate?.hasActiveTest) e.currentTarget.style.backgroundColor = '#10B981';
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving Log...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Counseling Log
              </>
            )}
          </button>
          <button
            onClick={handleActivateRetest}
            disabled={!allCompleted || activatingRetest || submitting || candidate?.hasActiveTest}
            style={{
              padding: '10px 24px',
              backgroundColor: (allCompleted && !candidate?.hasActiveTest) ? '#2563EB' : '#E2E8F0',
              color: (allCompleted && !candidate?.hasActiveTest) ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (!allCompleted || activatingRetest || submitting || candidate?.hasActiveTest) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: (allCompleted && !candidate?.hasActiveTest) ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (allCompleted && !activatingRetest && !submitting && !candidate?.hasActiveTest) {
                e.currentTarget.style.backgroundColor = '#1D4ED8';
              }
            }}
            onMouseLeave={(e) => {
              if (allCompleted && !activatingRetest && !submitting && !candidate?.hasActiveTest) {
                e.currentTarget.style.backgroundColor = '#2563EB';
              }
            }}
          >
            {activatingRetest ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Activating Retest...
              </>
            ) : (
              <>
                <Zap size={18} />
                Activate Retest
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CounselingPage;
