import { useState, useEffect, useCallback } from 'react';
import {
  getWorkforceList,
  createWorkforceUser,
  updateWorkforceUser,
  transferWorkforceUser,
  activateWorkforceUser,
  deactivateWorkforceUser,
  getStationsList,
  getDivisionsList,
  resetWorkforceUserPassword,
} from '../services/workforce.service';

export const useWorkforce = (roleCode) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [stations, setStations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);

  // Load stations & divisions on mount
  useEffect(() => {
    const loadDropdownData = async () => {
      setDropdownsLoading(true);
      try {
        const [stationsRes, divisionsRes] = await Promise.all([
          getStationsList().catch(() => ({ success: false, data: [] })),
          getDivisionsList().catch(() => ({ success: false, data: [] })),
        ]);
        if (stationsRes.success) setStations(stationsRes.data);
        if (divisionsRes.success) setDivisions(divisionsRes.data);
      } catch (err) {
        console.error('Failed to load filter dropdowns', err);
      } finally {
        setDropdownsLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  const fetchUsers = useCallback(async (filters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWorkforceList({
        ...filters,
        role: roleCode,
        page,
        limit: 10,
      });

      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch workforce data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  }, [roleCode]);

  const handleCreate = async (data) => {
    try {
      const res = await createWorkforceUser({
        ...data,
        roleCode,
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Creation failed' };
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await updateWorkforceUser(id, data);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Update failed' };
    }
  };

  const handleTransfer = async (id, data) => {
    try {
      const res = await transferWorkforceUser(id, data);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Transfer failed' };
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const res = currentStatus === 'active'
        ? await deactivateWorkforceUser(id)
        : await activateWorkforceUser(id);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Status change failed' };
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const res = await resetWorkforceUserPassword(id);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Password reset failed' };
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    stations,
    divisions,
    dropdownsLoading,
    fetchUsers,
    handleCreate,
    handleUpdate,
    handleTransfer,
    handleStatusToggle,
    handleResetPassword,
  };
};
