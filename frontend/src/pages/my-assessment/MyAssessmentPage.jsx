import React, { useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useMyAssessment } from '../../hooks/useMyAssessment';
import MyAssessmentKpiCards from '../../components/my-assessment/MyAssessmentKpiCards';
import ActiveAssessmentBanner from '../../components/my-assessment/ActiveAssessmentBanner';
import NoActiveAssessmentCard from '../../components/my-assessment/NoActiveAssessmentCard';
import AssessmentHistoryTable from '../../components/my-assessment/AssessmentHistoryTable';
import { LandingSkeleton } from '../../components/my-assessment/MyAssessmentSkeletons';
import '../../styles/my-assessment.css';

const MyAssessmentPage = () => {
  const {
    loading,
    error,
    activeAssessment,
    history,
    stats,
    fetchLandingData,
    resolveCategory
  } = useMyAssessment();

  useEffect(() => {
    fetchLandingData();
  }, [fetchLandingData]);

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              My Assessments
            </h1>
            <p className="page-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Indian Railways Evaluation Command Portal — Candidate Portal
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-sm)',
            color: '#991B1B',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {loading && history.length === 0 && !activeAssessment ? (
          <LandingSkeleton />
        ) : (
          <>
            {/* Section A: KPI cards */}
            <MyAssessmentKpiCards stats={stats} />

            {/* Section B: Active Banner or No Active banner */}
            <div style={{ marginBottom: '32px' }}>
              {activeAssessment ? (
                <ActiveAssessmentBanner assessment={activeAssessment} />
              ) : (
                <NoActiveAssessmentCard />
              )}
            </div>

            {/* Section C: Historical table */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '23px', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Assessment History
                  </h3>
                  <p style={{ fontSize: '17px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
                    All submitted exams, in-progress evaluations, and completed scorecards
                  </p>
                </div>
              </div>
              <AssessmentHistoryTable history={history} resolveCategory={resolveCategory} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAssessmentPage;
