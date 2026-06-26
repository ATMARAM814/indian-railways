import React from 'react';
import { Building2 } from 'lucide-react';

const StationPerformanceTable = ({ stationsData }) => {
  const hasStations = Array.isArray(stationsData) && stationsData.length > 0;

  return (
    <div className="staff-table-card" style={{ marginBottom: '24px' }}>
      <div className="staff-table-header" style={{ backgroundColor: '#0B2341', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} className="text-white" />
          <h3 className="staff-table-title" style={{ color: '#FFFFFF', margin: 0 }}>Station Performance Analytics</h3>
        </div>
      </div>

      <div className="staff-table-wrapper">
        {!hasStations ? (
          <div style={{ padding: '48px', textAlignment: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', margin: 0 }}>No station metrics available</p>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>No stations fit the filter criteria.</p>
          </div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr className="bg-slate-50 border-b border-[#D7E3EF]">
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Station Code</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569]">Station Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Total Employees</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Average Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Cat A</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Cat B</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Cat C</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Cat D</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">High Risk Count</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center">Pending Approvals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {stationsData.map((st) => (
                <tr key={st.stationId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-bold text-[#2B5CE6]">{st.stationCode}</td>
                  <td className="px-4 py-3.5 text-xs font-bold text-[#0B2341]">{st.stationName}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-slate-600">{st.totalEmployees}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-emerald-600">
                    {st.averageScore ? `${Number(st.averageScore).toFixed(1)}%` : '0.0%'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-center font-semibold text-emerald-600 bg-emerald-50/10">{st.categoryA || 0}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-semibold text-blue-600 bg-blue-50/10">{st.categoryB || 0}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-semibold text-amber-600 bg-amber-50/10">{st.categoryC || 0}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-semibold text-rose-600 bg-rose-50/10">{st.categoryD || 0}</td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-rose-600">
                    {st.highRiskCount || 0}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-center font-bold text-amber-600">
                    {st.pendingApprovals || 0}
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

export default StationPerformanceTable;
