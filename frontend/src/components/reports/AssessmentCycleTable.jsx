import React from 'react';
import { CalendarDays } from 'lucide-react';

const AssessmentCycleTable = ({ cyclesData }) => {
  const hasCycles = Array.isArray(cyclesData) && cyclesData.length > 0;

  return (
    <div className="staff-table-card" style={{ marginBottom: '24px' }}>
      <div className="staff-table-header" style={{ backgroundColor: '#0B2341', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={16} className="text-white" />
          <h3 className="staff-table-title" style={{ color: '#FFFFFF', margin: 0 }}>Assessment Cycle Analytics</h3>
        </div>
      </div>

      <div className="staff-table-wrapper">
        {!hasCycles ? (
          <div style={{ padding: '48px', textAlignment: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>No cycle metrics available</p>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>No cycles fit the filter criteria.</p>
          </div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr className="bg-slate-50 border-b border-[#D7E3EF]">
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Cycle Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Total Assessments</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Completed</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Pending</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Approved</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Rejected</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Average Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {cyclesData.map((cy, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-bold text-[#0B2341]">{cy.cycleName}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-slate-600">{cy.totalAssessments}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-emerald-600 bg-emerald-50/5">{cy.completedCount}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-amber-600 bg-amber-50/5">{cy.pendingCount}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-emerald-600">{cy.approvedCount}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-rose-600">{cy.rejectedCount}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-[#2B5CE6]">
                    {cy.averageScore ? `${Number(cy.averageScore).toFixed(1)}%` : '0.0%'}
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

export default AssessmentCycleTable;
