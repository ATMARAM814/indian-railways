import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, User, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const WorkforcePerformanceTable = ({ workforceList, pagination, onPageChange }) => {
  const hasRecords = Array.isArray(workforceList) && workforceList.length > 0;
  const { total = 0, page = 1, limit = 10, totalPages = 1 } = pagination || {};

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'A': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'B': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'C': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'D': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const renderApprovalStatus = (status) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
          <CheckCircle2 size={12} />
          Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
          <XCircle size={12} />
          Rejected
        </span>
      );
    }
    if (status === 'pending_approval' || status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
          <AlertCircle size={12} />
          Pending Approval
        </span>
      );
    }
    return <span className="text-slate-400 font-semibold text-[11px]">-</span>;
  };

  return (
    <div className="staff-table-card" style={{ marginBottom: '24px' }}>
      <div className="staff-table-header" style={{ backgroundColor: '#0B2341', borderBottom: 'none' }}>
        <h3 className="staff-table-title" style={{ color: '#FFFFFF', margin: 0 }}>Workforce Performance Report</h3>
        <span className="staff-table-badge" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>
          Showing {startIdx}-{endIdx} of {total} employees
        </span>
      </div>

      <div className="staff-table-wrapper">
        {!hasRecords ? (
          <div style={{ padding: '48px', textAlignment: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>No employee records found</p>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>Adjust filters or search parameters to view results.</p>
          </div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr className="bg-slate-50 border-b border-[#D7E3EF]">
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Employee Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">HRMS ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Station</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Latest Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Average Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Last Assessed</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Approval Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {workforceList.map((emp) => (
                <tr key={emp.userId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-[#0B2341]">{emp.fullName}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">{emp.hrmsId}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">{emp.stationName || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryBadgeClass(emp.category)}`}>
                      Category {emp.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-center font-bold text-[#0B2341]">
                    {emp.latestScore ? `${Number(emp.latestScore).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-center font-bold text-[#0B2341]">
                    {emp.averageScore ? `${Number(emp.averageScore).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-semibold">
                    {emp.lastAssessmentDate ? new Date(emp.lastAssessmentDate).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs">{renderApprovalStatus(emp.approvalStatus)}</td>
                   <td className="px-4 py-3 text-xs font-semibold text-right" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <Link
                        to={`/reports/employee/${emp.userId}`}
                        className="report-action-btn"
                      >
                        <FileText size={12} />
                        Report
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Showing <span style={{ fontWeight: 700, color: '#0F172A' }}>{startIdx}</span> to <span style={{ fontWeight: 700, color: '#0F172A' }}>{endIdx}</span> of <span style={{ fontWeight: 700, color: '#0F172A' }}>{total}</span> employees
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: page === 1 ? '#94A3B8' : '#475569',
                backgroundColor: page === 1 ? '#F8FAFC' : '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const maxButtons = 5;
              let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
              let endPage = startPage + maxButtons - 1;
              if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxButtons + 1);
              }
              const pageButtons = [];
              for (let i = startPage; i <= endPage; i++) {
                pageButtons.push(
                  <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                      backgroundColor: page === i ? '#0B2341' : '#FFFFFF',
                      color: page === i ? '#FFFFFF' : '#475569'
                    }}
                  >
                    {i}
                  </button>
                );
              }
              return pageButtons;
            })()}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: page === totalPages ? '#94A3B8' : '#475569',
                backgroundColor: page === totalPages ? '#F8FAFC' : '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforcePerformanceTable;
