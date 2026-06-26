import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cancelAssessment, activateMCQExam } from '../../services/assessment.service';
import { AssessmentStatusBadge } from './AssessmentStatusBadge';
import { Calendar, Trash2, ShieldAlert, Eye, X, ClipboardCopy, FileText, CheckCircle } from 'lucide-react';
import { cleanDesignationText } from '../../utils/dashboardMappers';
import '../../styles/assessments.css';

const getDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export const AssessmentStaffTable = ({
  staff = [],
  roleCode,
  fetchEligibleStaff,
  fetchStats,
  isAomOrSuperAdmin = false
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Modals state
  const [selectedRow, setSelectedRow] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Form states
  const [assessmentCycle, setAssessmentCycle] = useState('Monthly Assessment');
  const [assessmentType, setAssessmentType] = useState('Periodic Assessment');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => getDefaultDueDate());
  const [instructionsRemarks, setInstructionsRemarks] = useState('');
  
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine Case 1-4
  const getAssessmentCase = (row) => {
    const status = row.assessment_status;
    const approval = row.approval_status;

    if (!status) {
      return 1; // Case 1: No active assessment
    }

    if (status === 'cancelled' || approval === 'approved' || status === 'approved') {
      return 4; // Case 4: Assessment completed / approved / cancelled
    }

    if (status === 'evaluation_submitted' || approval === 'pending_approval') {
      return 3; // Case 3: Submitted / pending approval
    }

    if (['scheduled', 'mcq_access_sent', 'mcq_pending', 'mcq_submitted', 'evaluation_pending', 'created'].includes(status)) {
      return 2; // Case 2: Scheduled / Active / MCQ completed
    }

    return 1;
  };

  // Stepper highlights
  const getActiveStepIndex = (status, approvalStatus) => {
    if (approvalStatus === 'approved' || status === 'approved') return 5;
    if (approvalStatus === 'pending_approval') return 4;
    if (status === 'completed' || status === 'evaluated') return 3;
    if (status === 'mcq_submitted') return 2;
    if (status === 'mcq_access_sent' || status === 'mcq_pending' || status === 'created') return 1;
    return 0; // scheduled
  };

  // Open scheduling modal
  const handleOpenSchedule = (row) => {
    setSelectedRow(row);
    setAssessmentCycle('Monthly Assessment');
    setAssessmentType('Periodic Assessment');
    setScheduledDate(() => new Date().toISOString().split('T')[0]);
    setDueDate(() => getDefaultDueDate());
    setInstructionsRemarks('');
    setErrorMsg('');
    setShowScheduleModal(true);
  };

  // Open cancel modal
  const handleOpenCancel = (row) => {
    setSelectedRow(row);
    setCancellationReason('');
    setErrorMsg('');
    setShowCancelModal(true);
  };

  // Open status modal
  const handleOpenStatus = (row) => {
    setSelectedRow(row);
    setShowStatusModal(true);
  };

  // Submit schedule
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!assessmentCycle || !assessmentType || !scheduledDate || !dueDate) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (new Date(dueDate) < new Date(scheduledDate)) {
      setErrorMsg('Due Date must be greater than or equal to Scheduled Date.');
      return;
    }

    setScheduleLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        assessedUserId: selectedRow.id,
        assessedRoleCode: roleCode,
        assessmentCycle,
        assessmentType,
        scheduledDate,
        dueDate,
        instructionsRemarks
      };

      const res = await activateMCQExam(payload);
      if (res.success) {
        setShowScheduleModal(false);
        fetchEligibleStaff();
        fetchStats();
      } else {
        setErrorMsg(res.message || 'Failed to schedule assessment.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to schedule assessment.');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Submit cancellation
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setErrorMsg('Cancellation reason is required.');
      return;
    }

    setCancelLoading(true);
    setErrorMsg('');
    try {
      const res = await cancelAssessment(selectedRow.assessment_id, cancellationReason);
      if (res.success) {
        setShowCancelModal(false);
        fetchEligibleStaff();
        fetchStats();
      } else {
        setErrorMsg(res.message || 'Failed to cancel assessment.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to cancel assessment.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Form validations for scheduling
  const isScheduleValid = assessmentCycle && assessmentType && scheduledDate && dueDate && (new Date(dueDate) >= new Date(scheduledDate));

  return (
    <div className="table-responsive" style={{ padding: '8px' }}>
      <table className="workforce-table" style={{ fontSize: '15px', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #D7E3EF' }}>
            <th style={{ textAlign: 'left', verticalAlign: 'middle', padding: '12px 16px' }}>Staff Member</th>
            <th style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>Station</th>
            <th style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>Safety Category</th>
            <th style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>Latest Score</th>
            <th style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>Status</th>
            <th style={{ textAlign: 'right', verticalAlign: 'middle', padding: '12px 16px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                No staff members found matching the selected filters.
              </td>
            </tr>
          ) : (
            staff.map((row) => {
              const assessmentCase = getAssessmentCase(row);
              const hasScore = row.percentage !== null && row.percentage !== undefined && row.approval_status === 'approved';

              return (
                <tr key={row.id} className="hover-row" style={{ borderBottom: '1px solid #E2E8F0', height: '64px' }}>
                  <td style={{ textAlign: 'left', verticalAlign: 'middle', padding: '12px 16px' }}>
                    <div className="user-profile-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar-placeholder" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EEF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0b2341' }}>
                        {row.full_name ? row.full_name[0] : '?'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900" style={{ fontWeight: '700', color: '#0b2341' }}>{row.full_name}</div>
                        <div className="text-xs text-slate-500" style={{ fontSize: '12px', color: '#64748B' }}>HRMS: {row.hrms_id} | {cleanDesignationText(row.designation)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>
                    <div className="font-semibold text-slate-700" style={{ fontWeight: '600', color: '#334155' }}>{row.station_code}</div>
                    <div className="text-xs text-slate-500" style={{ fontSize: '12px', color: '#64748B' }}>{row.station_name}</div>
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>
                    {row.category_code ? (
                      <span className={`category-tag cat-${row.category_code}`}>
                        Category {row.category_code}
                      </span>
                    ) : (
                      <span className="category-tag cat-none">Not Categorized</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>
                    <div className="font-semibold text-slate-700" style={{ fontWeight: '600', color: '#334155' }}>
                      {hasScore ? `${parseFloat(row.percentage).toFixed(1)}%` : '-'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 16px' }}>
                    <AssessmentStatusBadge 
                      status={row.assessment_status} 
                      approvalStatus={row.approval_status} 
                    />
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      
                      {/* Case 1 & 4: Show Schedule */}
                      {(assessmentCase === 1 || assessmentCase === 4) && (
                        <button
                          type="button"
                          onClick={() => handleOpenSchedule(row)}
                          style={{
                            padding: '0 16px',
                            height: '36px',
                            fontSize: '13px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#F97316',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
                        >
                          Schedule
                        </button>
                      )}

                      {/* Case 2 & 3: Show Status & Cancel */}
                      {(assessmentCase === 2 || assessmentCase === 3) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenStatus(row)}
                            style={{
                              padding: '0 16px',
                              height: '36px',
                              fontSize: '13px',
                              fontWeight: '700',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#F97316',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
                          >
                            Status
                          </button>

                          {!['mcq_submitted', 'evaluated', 'completed', 'pending_approval', 'approved', 'evaluation_submitted'].includes(row.assessment_status) && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(row)}
                              style={{
                                padding: '0 16px',
                                height: '36px',
                                fontSize: '13px',
                                fontWeight: '700',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#DC2626',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}

                      {/* Always show View Past Assessment */}
                      <button
                        type="button"
                        onClick={() => navigate(`/assessments/${roleCode}/${row.id}/history`, { state: { employee: row } })}
                        style={{
                          padding: '0 16px',
                          height: '36px',
                          fontSize: '13px',
                          fontWeight: '700',
                          borderRadius: '8px',
                          border: '1px solid #2B5CE6',
                          backgroundColor: '#FFFFFF',
                          color: '#2B5CE6',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#EFF6FF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        History
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* SCHEDULE ASSESSMENT MODAL */}
      {showScheduleModal && selectedRow && (
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
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            width: '90%',
            maxWidth: '650px',
            overflow: 'hidden',
            fontFamily: 'var(--font-family)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0B2341',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Schedule New Assessment</h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleScheduleSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Readonly Section */}
                <div className="modal-info-grid" style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Employee Name</label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selectedRow.full_name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>HRMS ID</label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selectedRow.hrms_id}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Role</label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{cleanDesignationText(selectedRow.designation)}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Station</label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selectedRow.station_name} ({selectedRow.station_code})</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Current Category</label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {selectedRow.category_code ? `Category ${selectedRow.category_code}` : 'Uncategorized'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Reporting Authority</label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {currentUser?.fullName || currentUser?.full_name || 'Station Master'}
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div style={{ padding: '12px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', borderRadius: '6px' }}>
                    {errorMsg}
                  </div>
                )}

                {/* Editable Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="modal-inputs-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Assessment Cycle *</label>
                      <select
                        value={assessmentCycle}
                        onChange={(e) => setAssessmentCycle(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      >
                        <option value="Monthly Assessment">Monthly Assessment</option>
                        <option value="Quarterly Assessment">Quarterly Assessment</option>
                        <option value="Annual Assessment">Annual Assessment</option>
                        <option value="Special Safety Review">Special Safety Review</option>
                        <option value="Post Transfer Assessment">Post Transfer Assessment</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Assessment Type *</label>
                      <select
                        value={assessmentType}
                        onChange={(e) => setAssessmentType(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      >
                        <option value="Periodic Assessment">Periodic Assessment</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-inputs-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Scheduled Date *</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Due Date *</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Instructions / Remarks</label>
                    <textarea
                      rows="3"
                      value={instructionsRemarks}
                      onChange={(e) => setInstructionsRemarks(e.target.value)}
                      placeholder="Add any specific instructions or review details..."
                      style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                    ></textarea>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid #E2E8F0'
              }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{
                    padding: '0 16px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isScheduleValid || scheduleLoading}
                  style={{
                    padding: '0 20px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isScheduleValid ? '#F97316' : '#E2E8F0',
                    color: isScheduleValid ? '#FFFFFF' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isScheduleValid ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {scheduleLoading ? 'Scheduling...' : 'Schedule & Activate MCQ Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ASSESSMENT MODAL */}
      {showCancelModal && selectedRow && (
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
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            width: '90%',
            maxWidth: '500px',
            overflow: 'hidden',
            fontFamily: 'var(--font-family)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#DC2626',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Cancel Assessment</h2>
              </div>
              <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCancelSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
                  Are you sure you want to cancel the active assessment cycle for <strong>{selectedRow.full_name}</strong>?
                  This action is permanent and will disable the candidate's MCQ access immediately.
                </p>

                {errorMsg && (
                  <div style={{ padding: '12px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', borderRadius: '6px' }}>
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Cancellation Reason *</label>
                  <textarea
                    rows="3"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Enter reason for cancelling this cycle..."
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                    required
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid #E2E8F0'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    padding: '0 16px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!cancellationReason.trim() || cancelLoading}
                  style={{
                    padding: '0 20px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: cancellationReason.trim() ? '#DC2626' : '#E2E8F0',
                    color: cancellationReason.trim() ? '#FFFFFF' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: cancellationReason.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSESSMENT STATUS MODAL */}
      {showStatusModal && selectedRow && (
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
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            width: '90%',
            maxWidth: '700px',
            overflow: 'hidden',
            fontFamily: 'var(--font-family)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0B2341',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Assessment Cycle Status</h2>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Metadata Info */}
              <div className="modal-status-meta-grid" style={{
                fontSize: '13px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px'
              }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Employee Name</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedRow.full_name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>HRMS ID</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedRow.hrms_id}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Designation</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{cleanDesignationText(selectedRow.designation)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Station</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedRow.station_code}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Assessment Cycle</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedRow.assessment_cycle || 'Periodic Cycle'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Assessment Type</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedRow.assessment_type || 'Periodic Assessment'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Scheduled Date</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    {selectedRow.scheduled_date ? new Date(selectedRow.scheduled_date).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Due Date</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    {selectedRow.due_date ? new Date(selectedRow.due_date).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>

              {/* Status Information Grid */}
              <div className="modal-status-details-grid" style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Assessment Cycle Status:</span>
                    <span style={{ fontWeight: 700 }}>
                      {selectedRow.assessment_status ? selectedRow.assessment_status.toUpperCase() : 'NOT STARTED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>MCQ Exam Status:</span>
                    <span style={{ fontWeight: 700 }}>
                      {['mcq_submitted', 'completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) ? 'SUBMITTED' : 'PENDING'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Evaluation Status:</span>
                    <span style={{ fontWeight: 700 }}>
                      {['completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Approval Status:</span>
                    <span style={{ fontWeight: 700 }}>
                      {selectedRow.approval_status ? selectedRow.approval_status.toUpperCase() : 'PENDING EVALUATION'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Progress Tracker */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '16px' }}>Progress Tracker</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', padding: '0 4px' }}>
                  {/* Background line */}
                  <div style={{ position: 'absolute', top: '16px', left: '8.3%', right: '8.3%', height: '4px', backgroundColor: '#E2E8F0', zIndex: 1 }}></div>
                  
                  {/* Highlighted active line */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '8.3%',
                    width: `${Math.max(0, getActiveStepIndex(selectedRow.assessment_status, selectedRow.approval_status) * 16.67)}%`,
                    height: '4px',
                    backgroundColor: '#16A34A',
                    zIndex: 2,
                    transition: 'width 0.3s ease'
                  }}></div>

                  {[
                    { label: 'Scheduled', idx: 0 },
                    { label: 'MCQ Active', idx: 1 },
                    { label: 'MCQ Submitted', idx: 2 },
                    { label: 'Evaluated', idx: 3 },
                    { label: 'Awaiting Approval', idx: 4 },
                    { label: 'Approved', idx: 5 }
                  ].map((step) => {
                    const isPassed = getActiveStepIndex(selectedRow.assessment_status, selectedRow.approval_status) >= step.idx;
                    return (
                      <div key={step.idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '16.6%', maxWidth: '80px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isPassed ? '#16A34A' : '#FFFFFF',
                          border: isPassed ? '2px solid #16A34A' : '2px solid #CBD5E1',
                          color: isPassed ? '#FFFFFF' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        }}>
                          {isPassed ? <CheckCircle size={16} /> : step.idx + 1}
                        </div>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          color: isPassed ? '#16A34A' : '#64748B',
                          marginTop: '6px',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          lineHeight: '1.2',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                        }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer with Actions */}
            <div style={{
              backgroundColor: '#F8FAFC',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #E2E8F0'
            }}>
              <div>
                {/* View Form (always visible read-only) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    navigate(`/assessments/${roleCode}/${selectedRow.assessment_id}/view`);
                  }}
                  style={{
                    padding: '0 16px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #2B5CE6',
                    backgroundColor: '#FFFFFF',
                    color: '#2B5CE6',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={14} />
                  View Form
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Helper / error message if Evaluate disabled */}
                {!['mcq_submitted', 'completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) && (
                  <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 600, maxWidth: '280px', textAlign: 'right' }}>
                    Evaluation can begin only after the employee submits the MCQ examination.
                  </span>
                )}

                {/* Evaluate button */}
                <button
                  type="button"
                  disabled={
                    !['mcq_submitted', 'completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) ||
                    (selectedRow.assessment_status === 'completed' && selectedRow.approval_status !== 'rejected') ||
                    selectedRow.approval_status === 'approved'
                  }
                  onClick={() => {
                    setShowStatusModal(false);
                    navigate(`/assessments/${roleCode}/${selectedRow.assessment_id}/form`);
                  }}
                  style={{
                    padding: '0 20px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (
                      ['mcq_submitted', 'completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) &&
                      !(selectedRow.assessment_status === 'completed' && selectedRow.approval_status !== 'rejected') &&
                      selectedRow.approval_status !== 'approved'
                    ) ? '#F97316' : '#E2E8F0',
                    color: (
                      ['mcq_submitted', 'completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) &&
                      !(selectedRow.assessment_status === 'completed' && selectedRow.approval_status !== 'rejected') &&
                      selectedRow.approval_status !== 'approved'
                    ) ? '#FFFFFF' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: (
                      ['mcq_submitted', 'completed', 'evaluated', 'pending_approval', 'approved'].includes(selectedRow.assessment_status) &&
                      !(selectedRow.assessment_status === 'completed' && selectedRow.approval_status !== 'rejected') &&
                      selectedRow.approval_status !== 'approved'
                    ) ? 'pointer' : 'not-allowed'
                  }}
                >
                  Evaluate
                </button>

                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  style={{
                    padding: '0 16px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
