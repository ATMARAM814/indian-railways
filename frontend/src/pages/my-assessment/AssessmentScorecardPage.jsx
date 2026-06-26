import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useMyAssessment } from '../../hooks/useMyAssessment';
import QuestionReviewList from '../../components/my-assessment/QuestionReviewList';
import { ScorecardSkeleton } from '../../components/my-assessment/MyAssessmentSkeletons';
import { ArrowLeft, FileText, Shield, TrendingUp, ClipboardList, Target, ShieldCheck, Zap, Crown, Star, Smile } from 'lucide-react';
import '../../styles/my-assessment.css';

const AssessmentScorecardPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const {
    loading,
    error,
    scorecardDetails,
    questionsReview,
    fetchScorecard,
    resolveCategory
  } = useMyAssessment();

  useEffect(() => {
    fetchScorecard(assessmentId);
  }, [assessmentId, fetchScorecard]);

  const formattedDate = scorecardDetails?.evaluated_at
    ? new Date(scorecardDetails.evaluated_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : scorecardDetails?.submitted_at
    ? new Date(scorecardDetails.submitted_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : 'N/A';

  const percentage = parseFloat(scorecardDetails?.percentage || 0);
  const isEvaluated = scorecardDetails?.status === 'completed' || scorecardDetails?.status === 'approved' || scorecardDetails?.approval_status === 'approved';
  const category = isEvaluated ? resolveCategory(percentage, scorecardDetails?.alcoholic_status) : 'Pending';

  const getCategoryName = (cat) => {
    switch (cat) {
      case 'Pending': return 'Pending Practical / Approval';
      case 'A': return 'Outstanding';
      case 'B': return 'Good';
      case 'C': return 'Needs Training';
      case 'D': return 'Critical';
      default:  return 'N/A';
    }
  };

  const getCategoryDescription = (cat) => {
    switch (cat) {
      case 'Pending': return 'Practical safety check or final manager approval is currently pending.';
      case 'A': return 'Highly competent to execute safety-critical railway operations.';
      case 'B': return 'Competent. Demonstrated standard knowledge & response profiles.';
      case 'C': return 'Requires monitoring and recommended targeted counselling.';
      case 'D': return 'Unsatisfactory performance. Mandatory safety training required.';
      default:  return 'No category resolved.';
    }
  };

  const getCompetencySummaryText = () => {
    if (!scorecardDetails) return '';
    if (!isEvaluated) {
      return `MCQ Exam completed with score: ${scorecardDetails.mcq_score}/25. Practical safety checklist evaluation is currently pending. Your final safety score and category will be resolved after practical assessment is completed.`;
    }
    const totalScore = scorecardDetails.total_score || 0;
    const categoryName = getCategoryName(category);
    const categoryDesc = getCategoryDescription(category);
    const mcqScore = scorecardDetails.mcq_score || 0;
    
    return `Assessment score achieved: ${totalScore}/100 (${categoryName} Competency). Demonstrated standard safety competency in "${scorecardDetails.assessed_role_code} Online Examination" scoring ${mcqScore}/25 marks. Overall performance category is resolved as Category ${category} (${categoryDesc}). It is recommended to maintain periodic rules compliance checks and undergo regular shunting/points operation audits to sustain high safety metrics.`;
  };

  const DOMAINS = [
    { key: 'mcq_score',            name: 'MCQ Online Examination',           max: 25 },
    { key: 'alertness_score',      name: 'Alertness & Reflexes Test',        max: 20 },
    { key: 'safety_record_score',  name: 'Safety Record & Rules Compliance', max: 15 },
    { key: 'leadership_score',     name: 'Leadership & Crisis Management',   max: 12 },
    { key: 'discipline_score',     name: 'Discipline & Conduct',             max: 10 },
    { key: 'appearance_score',     name: 'Appearance & Demeanor',            max:  8 }
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', width: '100%' }}>
        <div style={{ width: '100%', margin: '0 auto' }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5', borderRadius: 8,
              color: '#991B1B', marginBottom: 24, fontSize: 14
            }}>
              {error}
            </div>
          )}

          {loading && !scorecardDetails ? (
            <ScorecardSkeleton />
          ) : scorecardDetails ? (
            <>
              {/* Page Header - Nagpur Junction Operations / My Assessment with KPI Chips */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '16px',
                width: '100%'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748B', marginBottom: '2px' }}>
                    Nagpur Junction Operations
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    My Assessment
                  </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', background: '#FFFFFF',
                    border: '1px solid #D7E3EF', borderRadius: '20px',
                    fontSize: '12.5px', color: '#475569', fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(11, 35, 65, 0.05)'
                  }}>
                    <FileText size={14} style={{ color: '#94A3B8' }} />
                    <span>5 Assessments</span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', background: '#FFFFFF',
                    border: '1px solid #D7E3EF', borderRadius: '20px',
                    fontSize: '12.5px', color: '#475569', fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(11, 35, 65, 0.05)'
                  }}>
                    <TrendingUp size={14} style={{ color: '#94A3B8' }} />
                    <span>Avg {percentage.toFixed(0)}</span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px',
                    background: category === 'A' ? '#ECFDF5' : category === 'B' ? '#EFF6FF' : '#FFFBEB',
                    border: `1px solid ${category === 'A' ? '#A7F3D0' : category === 'B' ? '#BFDBFE' : '#FDE68A'}`,
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    color: category === 'A' ? '#15803D' : category === 'B' ? '#1D4ED8' : '#B45309',
                    fontWeight: 700,
                    boxShadow: '0 1px 2px rgba(11, 35, 65, 0.05)'
                  }}>
                    <ShieldCheck size={14} />
                    <span>Cat. {category}</span>
                  </div>
                </div>
              </div>

              {/* Main Scorecard Card - matches my-style exactly */}
              <div className="scorecard-wrapper-card" style={{ width: '100%' }}>
                
                {/* Header inside Card: Detailed Evaluation Scorecard (Left) and Return to History button (Right) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      Detailed Evaluation Scorecard
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigate('/my-assessment')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      backgroundColor: '#2563EB',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  >
                    <ArrowLeft size={14} />
                    <span>Go back to My Assessment</span>
                  </button>
                </div>

                {/* Top Panel: circular score gauge on the left, details on the right */}
                <div className="scorecard-top-panel">
                  {/* Gauge */}
                  <div className={`scorecard-gauge-box cat-${category === 'Pending' ? 'pending' : category?.toLowerCase()}`}>
                    <span className="scorecard-gauge-value">{isEvaluated ? (scorecardDetails.total_score ?? 0) : '—'}</span>
                    <span className="scorecard-gauge-label">/ 100</span>
                  </div>

                  {/* Metadata */}
                  <div className="scorecard-info-content">
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      background: category === 'Pending' ? '#FFFBEB' : category === 'A' ? '#ECFDF5' : '#EFF6FF',
                      color: category === 'Pending' ? '#B45309' : category === 'A' ? '#15803D' : '#1D4ED8'
                    }}>
                      {category === 'Pending' ? 'Status: Pending Practical Evaluation' : `Final Category: Category ${category}`}
                    </span>
                    <h2 className="scorecard-info-title">
                      {new Date(scorecardDetails.evaluated_at || scorecardDetails.submitted_at || scorecardDetails.created_at).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} - Safety Evaluation
                    </h2>
                    <p className="scorecard-info-subtitle">
                      Attempt Completed: {formattedDate} &nbsp;·&nbsp; Assessed By: {scorecardDetails.assessor_name || `Supervisor (${scorecardDetails.assessor_role_code || 'N/A'})`}
                    </p>
                  </div>
                </div>

                {/* Official Performance Evaluation Summary Box */}
                <div className="scorecard-summary-banner">
                  <div className="scorecard-summary-header">
                    <ClipboardList size={16} />
                    <span>Official Performance Evaluation Summary</span>
                  </div>
                  <p className="scorecard-summary-text">
                    {getCompetencySummaryText()}
                  </p>
                </div>

                {/* Safety Domain Competency Breakdown - matches my-style progress bar layout */}
                <div className="scorecard-domain-section">
                  <h3 className="scorecard-domain-header">
                    Safety Domain Competency Breakdown
                  </h3>

                  <div className="scorecard-domain-grid" style={{ gap: '16px' }}>
                    {DOMAINS.map((dom) => {
                      const isMcq = dom.key === 'mcq_score';
                      const isPendingDom = !isEvaluated && !isMcq;
                      
                      const score = isPendingDom ? null : (scorecardDetails[dom.key] ?? 0);
                      const max = dom.max;
                      const pct = (score !== null && max > 0) ? (score / max) * 100 : 0;
                      return (
                        <div key={dom.key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '24px',
                          width: '100%'
                        }}>
                          {/* Left: Domain Name */}
                          <div style={{ width: '240px', fontSize: '13px', fontWeight: 600, color: '#334155', flexShrink: 0 }}>
                            {dom.name}
                          </div>

                          {/* Middle: Progress Track */}
                          <div style={{ flexGrow: 1, height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{ height: '100%', borderRadius: '4px', backgroundColor: '#10B981', width: `${pct}%` }}
                            />
                          </div>

                          {/* Right: Score */}
                          <div style={{ width: '60px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#0F172A', flexShrink: 0 }}>
                            {score !== null ? `${score} / ${max}` : `— / ${max}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Complete Assessment Question Review section */}
              <div style={{ marginTop: '36px', width: '100%' }}>
                <QuestionReviewList questions={questionsReview} />
              </div>

              {/* Bottom Return Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
                <button
                  onClick={() => navigate('/my-assessment')}
                  className="btn-premium-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 32px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    borderRadius: '50px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Go back to My Assessment</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssessmentScorecardPage;
