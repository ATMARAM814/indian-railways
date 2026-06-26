import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, getAuditSummary, getCriticalAuditLogs } from '../services/audit.service';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalLogs: 0,
    criticalLogs: 0,
    highSeverityLogs: 0,
    todayLogs: 0,
    failedLoginAttempts: 0,
    userChanges: 0,
    assessmentActions: 0,
    approvalActions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'module' | 'critical'
  const [filters, setFilters] = useState({
    search: '',
    moduleName: '',
    severity: '',
    performedByRole: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 10,
  });

  // Fetch Summary Statistics
  const fetchSummaryData = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await getAuditSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit summary', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch Audit Logs List
  const fetchLogsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      // Map filters correctly
      const params = {
        search: filters.search || undefined,
        moduleName: filters.moduleName || undefined,
        severity: filters.severity || undefined,
        performedByRole: filters.performedByRole || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        page: filters.page,
        limit: filters.limit,
      };

      if (activeTab === 'critical') {
        res = await getCriticalAuditLogs(params);
      } else {
        res = await getAuditLogs(params);
      }

      if (res.success) {
        setLogs(res.data.records);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'An error occurred while fetching audit logs'
      );
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab]);

  // Load summary and logs on filter change
  useEffect(() => {
    fetchLogsList();
  }, [fetchLogsList]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      moduleName: '',
      severity: '',
      performedByRole: '',
      fromDate: '',
      toDate: '',
      page: 1,
      limit: 10,
    });
  };

  const setPage = (pageNumber) => {
    setFilters((prev) => ({ ...prev, page: pageNumber }));
  };

  const setFiltersCustom = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  return {
    logs,
    summary,
    loading,
    summaryLoading,
    error,
    pagination,
    filters,
    activeTab,
    setActiveTab,
    setFilters: setFiltersCustom,
    resetFilters,
    setPage,
    refetchLogs: fetchLogsList,
    refetchSummary: fetchSummaryData,
  };
};
