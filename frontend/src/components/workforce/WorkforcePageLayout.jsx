import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import WorkforceFilters from './WorkforceFilters';
import WorkforceTable from './WorkforceTable';
import WorkforceCreateModal from './WorkforceCreateModal';
import WorkforceEditModal from './WorkforceEditModal';
import WorkforceTransferModal from './WorkforceTransferModal';
import WorkforceStatusModal from './WorkforceStatusModal';
import WorkforceResetPasswordModal from './WorkforceResetPasswordModal';
import LoadingState from '../dashboard/LoadingState';
import ErrorState from '../dashboard/ErrorState';
import { useWorkforce } from '../../hooks/useWorkforce';
import { useAuth } from '../../context/AuthContext';
import { TableSkeleton } from '../reports/ReportSkeletons';

const WorkforcePageLayout = ({
  roleCode,
  roleTitle,
  roleSubtitle,
  showStationFilter = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    users,
    loading,
    error,
    pagination,
    stations,
    divisions,
    fetchUsers,
    handleCreate,
    handleUpdate,
    handleTransfer,
    handleStatusToggle,
    handleResetPassword
  } = useWorkforce(roleCode);

  const [filters, setFilters] = useState({
    search: '',
    stationId: '',
    category: '',
    riskLevel: ''
  });

  const [activePage, setActivePage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users whenever filters or page changes
  useEffect(() => {
    fetchUsers(filters, activePage);
  }, [filters, activePage, fetchUsers]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setActivePage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      stationId: '',
      category: '',
      riskLevel: ''
    });
    setActivePage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setActivePage(newPage);
    }
  };

  // Modal Actions
  const openCreate = () => setCreateOpen(true);
  const openEdit = (user) => {
    setSelectedUser(user);
    setEditOpen(true);
  };
  const openTransfer = (user) => {
    setSelectedUser(user);
    setTransferOpen(true);
  };
  const openStatus = (user) => {
    setSelectedUser(user);
    setStatusOpen(true);
  };
  const openResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  // Submit Operations
  const onSubmitCreate = async (data) => {
    const res = await handleCreate(data);
    if (res.success) {
      fetchUsers(filters, activePage);
    }
    return res;
  };

  const onSubmitEdit = async (id, data) => {
    const res = await handleUpdate(id, data);
    if (res.success) {
      fetchUsers(filters, activePage);
    }
    return res;
  };

  const onSubmitTransfer = async (id, data) => {
    const res = await handleTransfer(id, data);
    if (res.success) {
      fetchUsers(filters, activePage);
    }
    return res;
  };

  const onSubmitStatusToggle = async (id, currentStatus) => {
    const res = await handleStatusToggle(id, currentStatus);
    if (res.success) {
      fetchUsers(filters, activePage);
    }
    return res;
  };

  const onSubmitResetPassword = async (id) => {
    const res = await handleResetPassword(id);
    return res;
  };

  const onViewProfile = (user) => {
    navigate(`/workforce/profile/${user.id}`);
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '32px', minHeight: 'calc(100vh - 70px)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{roleTitle}</h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>{roleSubtitle}</p>
          </div>
          <button
            onClick={openCreate}
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#1B365D',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#11223C'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1B365D'}
          >
            <Plus size={16} />
            Add New User
          </button>
        </div>

        {/* Filters Card */}
        <WorkforceFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          stations={stations}
          showStation={showStationFilter && !['SM', 'SS', 'Cabin Master', 'CABIN MASTER'].includes(user?.role)}
        />

        {/* Content Area (States: Loading, Error, Empty, or Table) */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '64px' }}>
            <ErrorState title="Failed to Load Data" message={error} />
          </div>
        ) : (
          <>
            {/* Table */}
            <WorkforceTable
              users={users}
              onView={onViewProfile}
              onEdit={openEdit}
              onTransfer={openTransfer}
              onStatusToggle={openStatus}
              onResetPassword={openResetPassword}
              currentUserRole={user?.role}
              roleCode={roleCode}
            />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #D7E3EF'
              }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Showing <strong style={{ color: '#0F172A' }}>{((activePage - 1) * 10) + 1}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(activePage * 10, pagination.total)}</strong> of <strong style={{ color: '#0F172A' }}>{pagination.total}</strong> records
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handlePageChange(activePage - 1)}
                    disabled={activePage === 1}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: activePage === 1 ? '#94A3B8' : '#475569',
                      backgroundColor: activePage === 1 ? '#F8FAFC' : '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    onClick={() => handlePageChange(activePage + 1)}
                    disabled={activePage === pagination.totalPages}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: activePage === pagination.totalPages ? '#94A3B8' : '#475569',
                      backgroundColor: activePage === pagination.totalPages ? '#F8FAFC' : '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: activePage === pagination.totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <WorkforceCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={onSubmitCreate}
          stations={stations}
          divisions={divisions}
          roleTitle={roleTitle}
          roleCode={roleCode}
        />

        <WorkforceEditModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={onSubmitEdit}
          user={selectedUser}
          stations={stations}
          roleCode={roleCode}
        />

        <WorkforceTransferModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          onSubmit={onSubmitTransfer}
          user={selectedUser}
          stations={stations}
        />

        <WorkforceStatusModal
          isOpen={statusOpen}
          onClose={() => setStatusOpen(false)}
          onSubmit={onSubmitStatusToggle}
          user={selectedUser}
        />

        <WorkforceResetPasswordModal
          isOpen={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          onSubmit={onSubmitResetPassword}
          user={selectedUser}
        />

      </div>
    </DashboardLayout>
  );
};

export default WorkforcePageLayout;
