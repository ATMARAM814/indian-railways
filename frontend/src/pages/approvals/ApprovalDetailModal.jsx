import React, { useEffect, useState } from 'react';
import { 
  X, Check, AlertTriangle, ShieldCheck, Edit3, Save, 
  User, Calendar, MapPin, Award, BookOpen, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
  getAssessmentDetails, 
  getAssessmentAnswers, 
  getYesNoQuestions 
} from '../../services/assessment.service';
import { 
  approveAssessment, 
  rejectAssessment, 
  modifyAssessment 
} from '../../services/approval.service';


const sectionNames = {
  ALERTNESS: 'Alertness & Vigilance',
  SAFETY_RECORD: 'Safety Record & Rules Compliance',
  LEADERSHIP: 'Leadership & Initiative',
  DISCIPLINE: 'Discipline & Attendance',
  APPEARANCE: 'Appearance & Turnout'
};

const ApprovalDetailModal = ({ assessmentId, roleCode, userRole, onClose, onActionSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [yesNoQuestions, setYesNoQuestions] = useState([]);
  
  // Action/Form states
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'modify'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);
  
  // Modify scores state
  const [modifiedScores, setModifiedScores] = useState({
    alertnessScore: 0,
    safetyRecordScore: 0,
    leadershipScore: 0,
    disciplineScore: 0,
    appearanceScore: 0
  });

  const isReadOnly = userRole === 'SUPER_ADMIN';

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailsRes, answersRes, questionsRes] = await Promise.all([
        getAssessmentDetails(assessmentId),
        getAssessmentAnswers(assessmentId),
        getYesNoQuestions(roleCode).catch(() => ({ success: true, data: [] }))
      ]);

      if (detailsRes.success) {
        setAssessment(detailsRes.data);
        // Set initial modified scores to current values
        setModifiedScores({
          alertnessScore: detailsRes.data.alertness_score || 0,
          safetyRecordScore: detailsRes.data.safety_record_score || 0,
          leadershipScore: detailsRes.data.leadership_score || 0,
          disciplineScore: detailsRes.data.discipline_score || 0,
          appearanceScore: detailsRes.data.appearance_score || 0
        });
      } else {
        throw new Error(detailsRes.message || 'Failed to fetch assessment details');
      }

      if (answersRes.success) {
        setAnswers(answersRes.data);
      }
      
      if (questionsRes.success) {
        setYesNoQuestions(questionsRes.data);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading assessment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assessmentId) {
      loadDetails();
    }
  }, [assessmentId]);

  // Group yes/no answers by section for display
  const groupedAnswers = answers.reduce((acc, ans) => {
    const sec = ans.section_code;
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(ans);
    return acc;
  }, {});

  // Group questions by section to find maximum possible scores per section
  const groupedQuestions = yesNoQuestions.reduce((acc, q) => {
    const sec = q.section_code;
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(q);
    return acc;
  }, {});

  const getSectionMaxScore = (sectionCode) => {
    const sectionQs = groupedQuestions[sectionCode] || [];
    if (sectionQs.length > 0) {
      return sectionQs.reduce((sum, q) => sum + (q.marks_per_question || 0), 0);
    }
    // Fallback standard max is 15 marks
    return 15;
  };

  const handleScoreChange = (field, val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val) || 0);
    setModifiedScores(prev => ({
      ...prev,
      [field]: num
    }));
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setModalFeedback(null);
    try {
      const res = await approveAssessment(assessmentId, remarks);
      if (res.success) {
        setModalFeedback({ type: 'success', message: 'Assessment approved successfully.' });
        // Update local assessment state for immediate feedback in the modal
        setAssessment(prev => ({
          ...prev,
          approval_status: 'approved',
          approval_remark: remarks
        }));
        setTimeout(() => {
          onActionSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(res.message || 'Failed to approve assessment.');
      }
    } catch (err) {
      setModalFeedback({ type: 'error', message: err.message });
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      setModalFeedback({ type: 'error', message: 'Rejection reason is required.' });
      return;
    }
    setSubmitting(true);
    setModalFeedback(null);
    try {
      const res = await rejectAssessment(assessmentId, remarks);
      if (res.success) {
        setModalFeedback({ type: 'success', message: 'Assessment rejected successfully.' });
        // Update local assessment state for immediate feedback in the modal
        setAssessment(prev => ({
          ...prev,
          approval_status: 'rejected',
          rejection_reason: remarks
        }));
        setTimeout(() => {
          onActionSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(res.message || 'Failed to reject assessment.');
      }
    } catch (err) {
      setModalFeedback({ type: 'error', message: err.message });
      setSubmitting(false);
    }
  };

  const handleModify = async () => {
    // Validate scores against their maximum limits
    const limitErrors = [];
    const fields = [
      { key: 'alertnessScore', code: 'ALERTNESS' },
      { key: 'safetyRecordScore', code: 'SAFETY_RECORD' },
      { key: 'leadershipScore', code: 'LEADERSHIP' },
      { key: 'disciplineScore', code: 'DISCIPLINE' },
      { key: 'appearanceScore', code: 'APPEARANCE' }
    ];

    for (const f of fields) {
      const max = getSectionMaxScore(f.code);
      const score = modifiedScores[f.key];
      if (score === '' || isNaN(score)) {
        limitErrors.push(`Score for ${sectionNames[f.code]} is required.`);
      } else if (score > max) {
        limitErrors.push(`Score for ${sectionNames[f.code]} cannot exceed max marks of ${max}.`);
      }
    }

    if (limitErrors.length > 0) {
      setModalFeedback({ type: 'error', message: limitErrors[0] });
      return;
    }

    setSubmitting(true);
    setModalFeedback(null);
    try {
      const res = await modifyAssessment(assessmentId, modifiedScores, remarks);
      if (res.success) {
        setModalFeedback({ type: 'success', message: 'Assessment scores modified successfully.' });
        onActionSuccess(); // Refresh parent background list immediately
        // Reset action type and reload details from backend to reflect update
        setTimeout(async () => {
          setActionType(null);
          setRemarks('');
          setModalFeedback(null);
          await loadDetails();
        }, 1200);
      } else {
        throw new Error(res.message || 'Failed to modify assessment.');
      }
    } catch (err) {
      setModalFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getPassFailStatus = (percentage) => {
    const pct = parseFloat(percentage);
    return pct >= 50 ? (
      <span style={{ color: 'var(--success)', fontWeight: '700', backgroundColor: 'var(--success-light)', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>PASS</span>
    ) : (
      <span style={{ color: 'var(--error)', fontWeight: '700', backgroundColor: 'var(--error-light)', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>FAIL</span>
    );
  };

  const getCategoryBadgeClass = (percentage, alcoholicStatus) => {
    if (alcoholicStatus === 'Alcoholic') return 'cat-d';
    const pct = parseFloat(percentage || 0);
    if (pct >= 80) return 'cat-a';
    if (pct >= 50) return 'cat-b';
    if (pct >= 26) return 'cat-c';
    return 'cat-d';
  };

  const getCategoryCodeName = (percentage, alcoholicStatus) => {
    if (alcoholicStatus === 'Alcoholic') return 'D (High Risk)';
    const pct = parseFloat(percentage || 0);
    if (pct >= 80) return 'A (Low Risk)';
    if (pct >= 50) return 'B (Medium Risk)';
    if (pct >= 26) return 'C (Medium Risk)';
    return 'D (High Risk)';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge status-approved">Approved</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">Rejected</span>;
      case 'pending_approval':
      default:
        return <span className="status-badge status-pending">Pending Approval</span>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 35, 65, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        width: '95%',
        maxWidth: '1000px',
        height: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-family)'
      }}>
        {/* Modal Header */}
        <div style={{
          backgroundColor: '#0B2341',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Review Assessment Details</h2>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Assessment ID: {assessmentId}</span>
          </div>
          <button 
            onClick={onClose} 
            disabled={submitting}
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content Wrapper */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
              <RefreshCw className="animate-spin text-blue-600" size={32} />
              <span style={{ color: '#475569', fontWeight: 600 }}>Loading assessment details...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--error)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={36} />
              <span className="font-bold">{error}</span>
              <button className="btn-secondary" onClick={loadDetails} style={{ marginTop: '12px' }}>Retry</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Feedback Banner */}
              {modalFeedback && (
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: modalFeedback.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
                  borderColor: modalFeedback.type === 'success' ? '#86EFAC' : '#FECACA',
                  color: modalFeedback.type === 'success' ? '#166534' : '#991B1B'
                }}>
                  <AlertCircle size={20} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{modalFeedback.message}</span>
                </div>
              )}

              {/* Top Summary Blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {/* Employee / Assessor details Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} style={{ color: 'var(--accent-blue)' }} /> Employee Details
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '14px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Full Name:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.assessed_name}</span>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>HRMS ID:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.assessed_hrms_id}</span>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Role / Post:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.assessed_role_code}</span>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Station Code:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.station_code || '-'}</span>
                  </div>

                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingTop: '8px', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} style={{ color: '#64748B' }} /> Assessor Details
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '14px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Assessor Name:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.assessor_name}</span>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Assessor Role:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.assessor_role_code}</span>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Evaluation Date:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{assessment.evaluated_at ? new Date(assessment.evaluated_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                </div>

                {/* Scores and Grading Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} style={{ color: 'var(--accent-blue)' }} /> Evaluation Scorecard
                    </h3>
                    {getStatusBadge(assessment.approval_status)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke={
                            getCategoryBadgeClass(assessment.percentage, assessment.alcoholic_status) === 'cat-a' ? '#10B981' :
                            getCategoryBadgeClass(assessment.percentage, assessment.alcoholic_status) === 'cat-b' ? '#3B82F6' :
                            getCategoryBadgeClass(assessment.percentage, assessment.alcoholic_status) === 'cat-c' ? '#F59E0B' :
                            '#EF4444'
                          } 
                          strokeWidth="8" 
                          strokeDasharray={`${2 * Math.PI * 40}`} 
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - (parseFloat(assessment.percentage) || 0) / 100)}`}
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#0B2341' }}>{assessment.total_score}</span>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>/{assessment.max_marks || 100}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>MCQ Marks (Phase 1):</span>
                        <span style={{ color: '#0F172A', fontWeight: '700' }}>{assessment.mcq_score} / 25</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Checklist Marks (Phase 2):</span>
                        <span style={{ color: '#0F172A', fontWeight: '700' }}>{assessment.evaluation_score} / 75</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '6px', marginTop: '2px' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Total Percentage:</span>
                        <span style={{ color: '#0F172A', fontWeight: '800' }}>{parseFloat(assessment.percentage || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Projected Category</span>
                      <span className={`category-tag ${getCategoryBadgeClass(assessment.percentage, assessment.alcoholic_status)}`} style={{ display: 'inline-block', fontSize: '13px', fontWeight: '700' }}>
                        Category {getCategoryCodeName(assessment.percentage, assessment.alcoholic_status)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Additional Operational details */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} style={{ color: 'var(--accent-blue)' }} /> Operational & Training Status
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 24px', fontSize: '14px' }}>
                  <div>
                    <span style={{ display: 'block', color: '#64748B', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>PME Status</span>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>{assessment.pme_status || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', color: '#64748B', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>Refresher Training Status</span>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>{assessment.ref_status || 'N/A'}</span>
                  </div>

                  <div>
                    <span style={{ display: 'block', color: '#64748B', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>Safety Training Required</span>
                    <span style={{ fontWeight: '600', color: assessment.training_required ? 'var(--warning)' : '#0F172A' }}>
                      {assessment.training_required ? `YES (${assessment.training_status || 'Pending'})` : 'NO'}
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'block', color: '#64748B', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>Alcoholic Status</span>
                    <span style={{ fontWeight: '600', color: assessment.alcoholic_status === 'Suspicious' || assessment.alcoholic_status === 'Habitual' ? 'var(--error)' : '#0F172A' }}>
                      {assessment.alcoholic_status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'block', color: '#64748B', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>Safety Concern Status</span>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>{assessment.safety_concern_status || 'N/A'}</span>
                  </div>
                </div>
                {assessment.remarks_for_approver && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Assessor Remarks / Comments for Approver</span>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, fontStyle: 'italic' }}>"{assessment.remarks_for_approver}"</p>
                  </div>
                )}
              </div>

              {/* History / Previous remarks if existing */}
              {(assessment.approval_remark || assessment.rejection_reason || assessment.modification_remark) && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>Workflow History & Logs</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {assessment.modification_remark && (
                      <div style={{ fontSize: '13px', borderBottom: '1px dashed #F1F5F9', paddingBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#475569' }}>Modification Remark (during review): </span>
                        <span style={{ color: '#334155' }}>"{assessment.modification_remark}"</span>
                        {assessment.modified_at && <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '8px' }}>({new Date(assessment.modified_at).toLocaleDateString('en-IN')})</span>}
                      </div>
                    )}
                    {assessment.approval_remark && (
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ fontWeight: 700, color: '#16A34A' }}>Approval Remark: </span>
                        <span style={{ color: '#15803D', fontStyle: 'italic' }}>"{assessment.approval_remark}"</span>
                      </div>
                    )}
                    {assessment.rejection_reason && (
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ fontWeight: 700, color: '#DC2626' }}>Rejection Reason: </span>
                        <span style={{ color: '#B91C1C', fontStyle: 'italic' }}>"{assessment.rejection_reason}"</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Panels */}
              {!isReadOnly && assessment.approval_status === 'pending_approval' && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {actionType === null ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button 
                        onClick={() => { setActionType('modify'); setRemarks(assessment.modification_remark || ''); }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '10px 20px', 
                          fontWeight: '600',
                          backgroundColor: '#475569',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                      >
                        <Edit3 size={16} /> Modify Checklist Scores
                      </button>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => setActionType('reject')}
                          style={{ 
                            borderColor: '#DC2626', 
                            border: '1px solid',
                            color: '#DC2626', 
                            backgroundColor: '#FEF2F2', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '10px 20px', 
                            fontWeight: '600',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        >
                          <X size={16} /> Reject Assessment
                        </button>
                        <button 
                          onClick={() => setActionType('approve')}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '10px 20px', 
                            fontWeight: '600',
                            backgroundColor: 'var(--primary-navy)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-navy-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-navy)'}
                        >
                          <Check size={16} /> Approve & Category Sign-off
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {actionType === 'modify' && (
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0B2341', marginBottom: '16px' }}>Modify Subsection Scores</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                            {Object.keys(sectionNames).map((secCode) => {
                              const fKey = secCode === 'ALERTNESS' ? 'alertnessScore'
                                          : secCode === 'SAFETY_RECORD' ? 'safetyRecordScore'
                                          : secCode === 'LEADERSHIP' ? 'leadershipScore'
                                          : secCode === 'DISCIPLINE' ? 'disciplineScore'
                                          : 'appearanceScore';
                              const max = getSectionMaxScore(secCode);
                              
                              return (
                                <div key={secCode} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{sectionNames[secCode]} (Max: {max})</label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    max={max}
                                    value={modifiedScores[fKey]} 
                                    onChange={(e) => handleScoreChange(fKey, e.target.value)}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #CBD5E1',
                                      fontSize: '14px',
                                      fontWeight: '600'
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                          {actionType === 'approve' ? 'Approval Remarks (Optional)' : actionType === 'reject' ? 'Rejection Reason (Mandatory)' : 'Modification Reason / Remarks'}
                        </label>
                        <textarea 
                          rows="3" 
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder={actionType === 'reject' ? 'Please provide a clear reason for rejecting this assessment...' : 'Type remarks here...'}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '14px',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          disabled={submitting}
                          onClick={() => { setActionType(null); setRemarks(''); setModalFeedback(null); }}
                        >
                          Cancel
                        </button>
                        
                        {actionType === 'approve' && (
                          <button 
                            disabled={submitting}
                            onClick={handleApprove}
                            style={{
                              padding: '10px 20px',
                              fontWeight: '600',
                              backgroundColor: 'var(--primary-navy)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--primary-navy-hover)'; }}
                            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--primary-navy)'; }}
                          >
                            {submitting ? 'Processing...' : 'Confirm Approve'}
                          </button>
                        )}

                        {actionType === 'reject' && (
                          <button 
                            disabled={submitting}
                            onClick={handleReject}
                            style={{
                              padding: '10px 20px',
                              fontWeight: '600',
                              backgroundColor: '#DC2626',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#B91C1C'; }}
                            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#DC2626'; }}
                          >
                            {submitting ? 'Processing...' : 'Confirm Reject'}
                          </button>
                        )}

                        {actionType === 'modify' && (
                          <button 
                            disabled={submitting}
                            onClick={handleModify}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              padding: '10px 20px',
                              fontWeight: '600',
                              backgroundColor: 'var(--primary-navy)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--primary-navy-hover)'; }}
                            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--primary-navy)'; }}
                          >
                            <Save size={16} /> {submitting ? 'Saving...' : 'Save & Persist Changes'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}


            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '16px 24px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0
        }}>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Close</button>
        </div>

      </div>
    </div>
  );
};

export default ApprovalDetailModal;
