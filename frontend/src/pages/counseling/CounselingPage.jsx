// CounselingPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCandidateCounselingData, saveCandidateCounselingData, activateCandidateRetest } from '../../api/counselingApi';
import { ArrowLeft, User, ShieldAlert, CheckCircle, AlertCircle, Save, Loader2, MessageSquare, Zap } from 'lucide-react';

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

  useEffect(() => {
    if (!candidateId) {
      setError("No candidate selected. Please navigate from the watchlist dashboard.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCandidateCounselingData(candidateId);
        if (data.success) {
          setCandidate(data.data.candidate);
          setSubjects(data.data.subjects || []);
        } else {
          setError(data.message || "Failed to load candidate counseling details.");
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
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                    >
                      Completed (Yes)
                    </button>
                    <button
                      type="button"
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
                        cursor: 'pointer',
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
            disabled={submitting || activatingRetest}
            style={{
              padding: '10px 24px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (submitting || activatingRetest) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!submitting && !activatingRetest) e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              if (!submitting && !activatingRetest) e.currentTarget.style.backgroundColor = '#10B981';
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
            disabled={!allCompleted || activatingRetest || submitting}
            style={{
              padding: '10px 24px',
              backgroundColor: allCompleted ? '#2563EB' : '#E2E8F0',
              color: allCompleted ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (!allCompleted || activatingRetest || submitting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: allCompleted ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (allCompleted && !activatingRetest && !submitting) {
                e.currentTarget.style.backgroundColor = '#1D4ED8';
              }
            }}
            onMouseLeave={(e) => {
              if (allCompleted && !activatingRetest && !submitting) {
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
