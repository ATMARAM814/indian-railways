import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import UploadStatsCard from '../../../components/question-bank/UploadStatsCard';
import UploadHistoryTable from '../../../components/question-bank/UploadHistoryTable';
import DrillDownPagination from '../../../components/dashboard/DrillDownPagination';
import { useQuestionBank } from '../../../hooks/useQuestionBank';

const UploadHistoryPage = () => {
  const {
    loading,
    error,
    stats,
    history,
    pagination,
    fetchStats,
    fetchHistory
  } = useQuestionBank();

  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchHistory(page, limit);
  }, [fetchHistory, page]);

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
            Question Bank History
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Review upload events and active metrics.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              color: '#991B1B',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <UploadStatsCard
          stats={stats}
          history={history}
          totalLogs={pagination?.total || 0}
        />

        <UploadHistoryTable
          history={history}
          loading={loading}
        />

        {pagination && pagination.totalPages > 1 && (
          <DrillDownPagination
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadHistoryPage;
