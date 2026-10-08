import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Eye, 
  X, 
  Search, 
  Download, 
  Loader2, 
  User, 
  Award, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getAssessmentsReport } from '../../services/reports.service';
import * as XLSX from 'xlsx';

const AssessmentCycleTable = ({ cyclesData }) => {
  const hasCycles = Array.isArray(cyclesData) && cyclesData.length > 0;

  // Modal State
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const handleOpenStaffModal = async (cycle) => {
    setSelectedCycle(cycle);
    setModalOpen(true);
    setLoadingStaff(true);
    setStaffSearch('');
    setSelectedCategoryFilter('');
    setSelectedStatusFilter('');

    try {
      const res = await getAssessmentsReport({
        cycleName: cycle.cycleName,
        assessmentType: cycle.assessmentType,
        limit: 2000,
        page: 1
      });
      const records = res?.data?.records || [];
      setStaffList(records);
    } catch (err) {
      console.error('Failed to fetch cycle staff list:', err);
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCycle(null);
    setStaffList([]);
  };

  // Filtered staff inside modal
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      const matchesSearch = !staffSearch || (
        (item.assessedUserName && item.assessedUserName.toLowerCase().includes(staffSearch.toLowerCase())) ||
        (item.hrmsId && item.hrmsId.toLowerCase().includes(staffSearch.toLowerCase())) ||
        (item.stationName && item.stationName.toLowerCase().includes(staffSearch.toLowerCase())) ||
        (item.stationCode && item.stationCode.toLowerCase().includes(staffSearch.toLowerCase())) ||
        (item.role && item.role.toLowerCase().includes(staffSearch.toLowerCase()))
      );

      const matchesCategory = !selectedCategoryFilter || item.category === selectedCategoryFilter;
      
      const matchesStatus = !selectedStatusFilter || (
        selectedStatusFilter === 'approved' ? item.approvalStatus === 'approved' :
        selectedStatusFilter === 'rejected' ? item.approvalStatus === 'rejected' :
        selectedStatusFilter === 'pending' ? (item.assessmentStatus !== 'completed' || item.approvalStatus === 'pending_approval') :
        selectedStatusFilter === 'completed' ? item.assessmentStatus === 'completed' : true
      );

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [staffList, staffSearch, selectedCategoryFilter, selectedStatusFilter]);

  const handleExportStaffExcel = () => {
    if (filteredStaff.length === 0) {
      alert('No records available to export.');
      return;
    }

    const exportData = filteredStaff.map((staff) => ({
      'Employee Name': staff.assessedUserName || 'N/A',
      'HRMS ID': staff.hrmsId || 'N/A',
      'Role': staff.role || 'N/A',
      'Station': `${staff.stationName || 'N/A'} (${staff.stationCode || 'N/A'})`,
      'Cycle': staff.assessmentCycle || selectedCycle?.cycleName || 'Annual Assessment',
      'Assessment Type': staff.assessmentType || selectedCycle?.assessmentType || 'Periodic Assessment',
      'Category': staff.category ? `Category ${staff.category}` : 'N/A',
      'Score': staff.percentage != null ? `${Number(staff.percentage).toFixed(1)}%` : '-',
      'Status': staff.assessmentStatus || 'N/A',
      'Approval Status': staff.approvalStatus || 'N/A',
      'Assessor': staff.assessorName || 'N/A',
      'Assessment Date': staff.completedAt ? new Date(staff.completedAt).toLocaleDateString('en-GB') : (staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-GB') : '-')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff List');
    
    const maxLens = {};
    exportData.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key] || '');
        maxLens[key] = Math.max(maxLens[key] || key.length, valStr.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

    const safeCycle = (selectedCycle?.cycleName || 'Assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(workbook, `${safeCycle}_Staff_Details.xlsx`);
  };

  return (
    <>
      <div className="staff-table-card" style={{ marginBottom: '24px' }}>
        <div className="staff-table-header" style={{ backgroundColor: '#0B2341', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={16} className="text-white" />
            <h3 className="staff-table-title" style={{ color: '#FFFFFF', margin: 0 }}>Assessment Cycle Analytics</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
            {hasCycles ? `${cyclesData.length} Assessment Types / Cycles` : ''}
          </span>
        </div>

        <div className="staff-table-wrapper">
          {!hasCycles ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>No cycle metrics available</p>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>No cycles fit the filter criteria.</p>
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr className="bg-slate-50 border-b border-[#D7E3EF]">
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Cycle Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Assessment Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Total Assessments</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Completed</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Pending</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Approved</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Rejected</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Average Score</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {cyclesData.map((cy, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-bold text-[#0B2341]">{cy.cycleName}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        fontSize: '11.5px',
                        fontWeight: 600
                      }}>
                        {cy.assessmentType || 'Periodic Assessment'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-center font-bold text-slate-700">{cy.totalAssessments}</td>
                    <td className="px-4 py-3.5 text-xs text-center font-bold text-emerald-600 bg-emerald-50/10">{cy.completedCount}</td>
                    <td className="px-4 py-3.5 text-xs text-center font-bold text-amber-600 bg-amber-50/10">{cy.pendingCount}</td>
                    <td className="px-4 py-3.5 text-xs text-center font-bold text-emerald-600">{cy.approvedCount}</td>
                    <td className="px-4 py-3.5 text-xs text-center font-bold text-rose-600">{cy.rejectedCount}</td>
                    <td className="px-4 py-3.5 text-xs text-center font-bold text-[#2B5CE6]">
                      {cy.averageScore ? `${Number(cy.averageScore).toFixed(1)}%` : '0.0%'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-center">
                      <button
                        onClick={() => handleOpenStaffModal(cy)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#0B2341',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#0B2341';
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#0B2341';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                          e.currentTarget.style.color = '#0B2341';
                          e.currentTarget.style.borderColor = '#CBD5E1';
                        }}
                        title="View Detailed Staff List"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detailed Staff Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              backgroundColor: '#0B2341',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                    {selectedCycle?.cycleName}
                  </h2>
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#93C5FD'
                  }}>
                    {selectedCycle?.assessmentType || 'Periodic Assessment'}
                  </span>
                  <span style={{
                    backgroundColor: '#10B981',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFFFFF'
                  }}>
                    {staffList.length} Total Staff
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
                  Detailed list of railway personnel assessed under this assessment cycle & type.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleExportStaffExcel}
                  disabled={loadingStaff || filteredStaff.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: (loadingStaff || filteredStaff.length === 0) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!loadingStaff && filteredStaff.length > 0) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'; }}
                  title="Export this staff list to Excel"
                >
                  <FileSpreadsheet size={15} />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Filters Bar */}
            <div style={{
              padding: '14px 24px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '380px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search by staff name, HRMS ID, station, role..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Categories</option>
                  <option value="A">Category A</option>
                  <option value="B">Category B</option>
                  <option value="C">Category C</option>
                  <option value="D">Category D (High Risk)</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Modal Body / Table */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0',
              minHeight: '280px'
            }}>
              {loadingStaff ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
                  <Loader2 size={32} className="animate-spin text-[#2B5CE6]" />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', margin: 0 }}>Loading staff members from database...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <User size={36} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>No staff records found</p>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
                    {staffList.length === 0 ? 'No personnel have been assessed under this cycle/type yet.' : 'No staff match the current search or filters.'}
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Name & HRMS ID</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Station</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Category</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Score</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessor</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody style={{ divideY: '1px solid #E2E8F0' }}>
                    {filteredStaff.map((staff, idx) => {
                      const categoryCode = staff.category || 'Unassigned';
                      const categoryBg = categoryCode === 'A' ? '#ECFDF5' : categoryCode === 'B' ? '#EFF6FF' : categoryCode === 'C' ? '#FFFBEB' : categoryCode === 'D' ? '#FEF2F2' : '#F1F5F9';
                      const categoryColor = categoryCode === 'A' ? '#047857' : categoryCode === 'B' ? '#1D4ED8' : categoryCode === 'C' ? '#B45309' : categoryCode === 'D' ? '#B91C1C' : '#475569';

                      const isApproved = staff.approvalStatus === 'approved';
                      const isRejected = staff.approvalStatus === 'rejected';
                      const isPending = staff.assessmentStatus !== 'completed' || staff.approvalStatus === 'pending_approval';

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="hover:bg-slate-50">
                          {/* Staff Name & HRMS */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: '#0B2341', fontSize: '13px' }}>
                              {staff.assessedUserName || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                              HRMS: {staff.hrmsId || 'N/A'}
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              fontSize: '11.5px',
                              fontWeight: 600
                            }}>
                              {staff.role || 'N/A'}
                            </span>
                          </td>

                          {/* Station */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B' }}>
                              {staff.stationName || 'N/A'}
                            </div>
                            {staff.stationCode && (
                              <div style={{ fontSize: '11px', color: '#64748B' }}>
                                Code: {staff.stationCode}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              backgroundColor: categoryBg,
                              color: categoryColor,
                              fontSize: '11.5px',
                              fontWeight: 700,
                              border: `1px solid ${categoryColor}30`
                            }}>
                              {staff.category ? `Category ${staff.category}` : 'Unassigned'}
                            </span>
                          </td>

                          {/* Score */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: staff.percentage != null ? (Number(staff.percentage) >= 60 ? '#047857' : '#B91C1C') : '#64748B'
                            }}>
                              {staff.percentage != null ? `${Number(staff.percentage).toFixed(1)}%` : '-'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                            {isApproved ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#047857', fontSize: '11.5px', fontWeight: 600 }}>
                                <CheckCircle2 size={12} /> Approved
                              </span>
                            ) : isRejected ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '11.5px', fontWeight: 600 }}>
                                <XCircle size={12} /> Rejected
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#B45309', fontSize: '11.5px', fontWeight: 600 }}>
                                <Clock size={12} /> {staff.approvalStatus || staff.assessmentStatus || 'Pending'}
                              </span>
                            )}
                          </td>

                          {/* Assessor */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#475569' }}>
                            {staff.assessorName || 'System'}
                          </td>

                          {/* Date */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right', fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {staff.completedAt ? new Date(staff.completedAt).toLocaleDateString('en-GB') : (staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-GB') : '-')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
                Showing {filteredStaff.length} of {staffList.length} assessed staff records
              </span>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0B2341',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssessmentCycleTable;
