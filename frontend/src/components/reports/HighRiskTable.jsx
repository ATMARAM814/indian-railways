import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, FileText, User, ArrowRight } from 'lucide-react';

const HighRiskTable = ({ highRiskStaff }) => {
  const hasStaff = Array.isArray(highRiskStaff) && highRiskStaff.length > 0;

  return (
    <div className="staff-table-card" style={{ marginBottom: '24px' }}>
      <div className="staff-table-header" style={{ backgroundColor: '#0B2341', borderBottom: 'none' }}>
        <h3 className="staff-table-title" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} className="text-rose-500 animate-pulse" />
          High Risk Staff Monitoring
        </h3>
        <span className="staff-table-badge" style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}>
          {hasStaff ? `${highRiskStaff.length} Employees` : '0 Active'}
        </span>
      </div>

      <div className="staff-table-wrapper">
        {!hasStaff ? (
          <div style={{ padding: '48px', textAlignment: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: '12px', backgroundColor: '#DCFCE7', color: '#16A34A', borderRadius: '50%', marginBottom: '12px' }}>
              <ShieldAlert size={24} style={{ color: '#15803D' }} />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>All Staff Compliant</p>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>No Category D or critical score thresholds breached.</p>
          </div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr className="bg-slate-50 border-b border-[#D7E3EF]">
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Employee Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">HRMS ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Station</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Latest Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Assessor</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Reporting Authority</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Last Assessed</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {highRiskStaff.map((staff) => (
                <tr key={staff.userId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-bold text-[#0B2341]">{staff.fullName}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{staff.hrmsId}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">
                    {staff.stationCode || 'N/A'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-rose-600">
                    {staff.latestScore ? `${Number(staff.latestScore).toFixed(1)}%` : '0.0%'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px]">
                      {staff.category || 'D'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">{staff.assessorName || 'System'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">{staff.reportingAuthority || 'N/A'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-semibold">
                    {staff.lastAssessmentDate ? new Date(staff.lastAssessmentDate).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                   <td className="px-4 py-3.5 text-xs font-semibold text-right" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <Link 
                        to={`/reports/employee/${staff.userId}`}
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
    </div>
  );
};

export default HighRiskTable;
