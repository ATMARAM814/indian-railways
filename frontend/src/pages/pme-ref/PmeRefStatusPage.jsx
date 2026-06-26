import React, { useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ErrorState from '../../components/dashboard/ErrorState';
import { usePmeRefStatus } from '../../hooks/usePmeRefStatus';
import PmeStatusSection from '../../components/pme-ref/PmeStatusSection';
import RefStatusSection from '../../components/pme-ref/RefStatusSection';
import PmeRefSkeletons from '../../components/pme-ref/PmeRefSkeletons';
import '../../styles/pme-ref.css';

export const PmeRefStatusPage = () => {
  const { data, loading, error, fetchStatus } = usePmeRefStatus();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <DashboardLayout>
      <div className="pme-ref-container">
        <div className="pme-ref-header">
          <h1 className="pme-ref-title">PME & REF Status</h1>
          <p className="pme-ref-subtitle">
            View your Periodical Medical Examination and Refresher Course status, due dates, and history.
          </p>
        </div>

        {loading ? (
          <PmeRefSkeletons />
        ) : error ? (
          <div style={{ padding: '24px 0' }}>
            <ErrorState 
              title="Failed to Load PME & REF Status" 
              message={error || 'An unexpected error occurred while fetching your medical and refresher course status.'} 
            />
            <button 
              onClick={fetchStatus} 
              style={{ 
                marginTop: '16px', 
                padding: '10px 18px', 
                fontSize: '13.5px', 
                fontWeight: 600, 
                color: '#FFFFFF', 
                backgroundColor: '#0B2341', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(11, 35, 65, 0.2)'
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <PmeStatusSection data={data?.pme} />
            <RefStatusSection data={data?.ref} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PmeRefStatusPage;
