// useStationIntelligence.js
import { useState, useEffect, useMemo } from 'react';
import { getStationIntelligence } from '../services/stationIntelligence.service';

import { normalizeRoleKey } from '../components/stations/StationOverviewCards';

export const useStationIntelligence = (stationId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Workforce filter states
  const [filters, setFilters] = useState({
    role: 'All',
    category: 'All',
    search: '',
  });

  const loadIntelligence = async () => {
    if (!stationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getStationIntelligence(stationId);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to retrieve station intelligence.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'An error occurred while loading station intelligence.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, [stationId]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      role: 'All',
      category: 'All',
      search: '',
    });
  };

  // Compute filtered workforce list
  const filteredWorkforce = useMemo(() => {
    if (!data || !data.workforce) return [];

    return data.workforce.filter((emp) => {
      // 1. Role Filter mapping
      if (filters.role && filters.role !== 'All') {
        const targetRoleKey = normalizeRoleKey(filters.role);
        if (targetRoleKey !== 'All') {
          const empRoleKey = normalizeRoleKey(emp.role);
          if (empRoleKey !== targetRoleKey) return false;
        }
      }

      // 2. Category Filter
      if (filters.category && filters.category !== 'All') {
        const empCat = (emp.category || '').toUpperCase().trim();
        const targetCat = filters.category.toUpperCase().trim();
        if (empCat !== targetCat) return false;
      }

      // 3. Text Search (Name, HRMS ID)
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const fullName = (emp.fullName || '').toLowerCase();
        const hrmsId = (emp.hrmsId || '').toLowerCase();
        if (!fullName.includes(query) && !hrmsId.includes(query)) return false;
      }

      return true;
    });
  }, [data, filters]);

  return {
    data,
    loading,
    error,
    filters,
    filteredWorkforce,
    handleFilterChange,
    handleResetFilters,
    refetch: loadIntelligence,
  };
};
export default useStationIntelligence;
