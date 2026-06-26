import { useState, useCallback } from 'react';
import { getPmeRefStatus } from '../services/pmeRef.service';

export const usePmeRefStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPmeRefStatus();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch PME & REF status');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching PME & REF status');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    fetchStatus,
  };
};
