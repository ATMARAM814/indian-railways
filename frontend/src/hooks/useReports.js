import { useState, useCallback } from 'react';
import {
  getReportsSummary,
  getReportsPerformance,
  getReportsHighRisk,
  getReportsStations,
  getReportsCycles,
  getEmployeeReport,
  getStaffPerformanceReport,
} from '../services/reports.service';

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Individual dataset states
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [stations, setStations] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [employeeReport, setEmployeeReport] = useState(null);
  
  // Paginated workforce list state
  const [workforceList, setWorkforceList] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const fetchSummary = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportsSummary(filters);
      if (res.success) {
        setSummary(res.data);
      } else {
        setError(res.message || 'Failed to fetch summary data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPerformance = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportsPerformance(filters);
      if (res.success) {
        setPerformance(res.data);
      } else {
        setError(res.message || 'Failed to fetch performance charts data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching performance metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHighRisk = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportsHighRisk(filters);
      if (res.success) {
        setHighRisk(res.data);
      } else {
        setError(res.message || 'Failed to fetch high-risk employee list');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching high risk staff');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportsStations(filters);
      if (res.success) {
        setStations(res.data);
      } else {
        setError(res.message || 'Failed to fetch station analytics');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching stations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCycles = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportsCycles(filters);
      if (res.success) {
        setCycles(res.data);
      } else {
        setError(res.message || 'Failed to fetch cycle comparative data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching cycles');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployee = useCallback(async (employeeId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployeeReport(employeeId);
      if (res.success) {
        setEmployeeReport(res.data);
      } else {
        setError(res.message || 'Failed to fetch employee scorecard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching employee report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkforcePerformance = useCallback(async (filters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffPerformanceReport({
        ...filters,
        page,
        limit: 10
      });
      if (res.success) {
        setWorkforceList(res.data.records);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch workforce performance');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching workforce list');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    summary,
    performance,
    highRisk,
    stations,
    cycles,
    employeeReport,
    workforceList,
    pagination,
    fetchSummary,
    fetchPerformance,
    fetchHighRisk,
    fetchStations,
    fetchCycles,
    fetchEmployee,
    fetchWorkforcePerformance
  };
};
