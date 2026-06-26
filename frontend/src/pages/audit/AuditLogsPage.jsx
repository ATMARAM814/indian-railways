import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import AuditSummaryCards from '../../components/audit/AuditSummaryCards';
import AuditFilterCard from '../../components/audit/AuditFilterCard';
import AuditLogTable from '../../components/audit/AuditLogTable';
import DrillDownPagination from '../../components/dashboard/DrillDownPagination';
import {
  ShieldAlert,
  List,
  FolderLock,
  Lock,
  UserCheck,
  ClipboardList,
  Award,
  BookOpen,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const {
    logs,
    summary,
    loading,
    summaryLoading,
    error,
    pagination,
    filters,
    activeTab,
    setActiveTab,
    setFilters,
    resetFilters,
    setPage,
  } = useAuditLogs();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetFilters();
  };

  const getModuleIcon = (mod) => {
    switch (mod) {
      case 'Auth': return <Lock size={20} />;
      case 'Workforce': return <FolderLock size={20} />;
      case 'Assessment': return <ClipboardList size={20} />;
      case 'Approval': return <Award size={20} />;
      case 'Question Bank': return <BookOpen size={20} />;
      case 'Reports': return <FileSpreadsheet size={20} />;
      default: return <List size={20} />;
    }
  };

  const modulesList = [
    { name: 'Auth', key: 'Auth', desc: 'Login, logout, failed attempt events' },
    { name: 'Workforce', key: 'Workforce', desc: 'Workforce registrations, updates, status changes & transfers' },
    { name: 'Assessment', key: 'Assessment', desc: 'Evaluations, drafts, & score reviews' },
    { name: 'Approval', key: 'Approval', desc: 'Manager approvals, declines, & adjustments' },
    { name: 'Question Bank', key: 'Question Bank', desc: 'Question creation & bulk imports' },
    { name: 'Reports', key: 'Reports', desc: 'Report downloads & access' },
  ];

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
            System Audit Logs
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Track and monitor critical operations, security policies, and administrator actions system-wide.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#0B2341',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(11, 35, 65, 0.1)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#102A4C';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0B2341';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <LayoutDashboard size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* KPI Cards */}
      <AuditSummaryCards summary={summary} loading={summaryLoading} />

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #CBD5E1',
          paddingBottom: '1px',
          marginBottom: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none', // Firefox
        }}
      >
        <button
          onClick={() => handleTabChange('all')}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'all' ? '3px solid #0B2341' : '3px solid transparent',
            color: activeTab === 'all' ? '#0B2341' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            flexShrink: 0,
          }}
        >
          All Activity Logs
        </button>
        <button
          onClick={() => handleTabChange('module')}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'module' ? '3px solid #0B2341' : '3px solid transparent',
            color: activeTab === 'module' ? '#0B2341' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            flexShrink: 0,
          }}
        >
          Grouped by Module
        </button>
        <button
          onClick={() => handleTabChange('critical')}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'critical' ? '3px solid #EF4444' : '3px solid transparent',
            color: activeTab === 'critical' ? '#EF4444' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <ShieldAlert size={16} />
          Critical & High Severity
        </button>
      </div>

      {/* Grouped by Module UI Folder View */}
      {activeTab === 'module' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341' }}>Select Module Directory</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {modulesList.map((mod) => {
              const isSelected = filters.moduleName === mod.key;
              return (
                <div
                  key={mod.key}
                  onClick={() => setFilters({ moduleName: isSelected ? '' : mod.key })}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: isSelected ? '2px solid #2B5CE6' : '1px solid #D7E3EF',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.04)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(11, 35, 65, 0.08)';
                      e.currentTarget.style.borderColor = '#BFDBFE';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(11, 35, 65, 0.04)';
                      e.currentTarget.style.borderColor = '#D7E3EF';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'rgba(43, 92, 230, 0.1)' : 'rgba(11, 31, 58, 0.08)',
                        color: isSelected ? '#2B5CE6' : '#0B1F3A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getModuleIcon(mod.key)}
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: '11px', color: '#2B5CE6', fontWeight: 700, textTransform: 'uppercase' }}>
                        Selected
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0B2341', marginTop: '4px' }}>
                    {mod.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                    {mod.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit Log Filters */}
      <AuditFilterCard
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      {/* Error Alert */}
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

      {/* Main Table Grid */}
      <AuditLogTable records={logs} loading={loading} />

      {/* Pagination Grid */}
      {pagination && pagination.totalPages > 1 && (
        <DrillDownPagination
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
