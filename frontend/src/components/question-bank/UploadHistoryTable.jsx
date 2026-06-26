import React from 'react';
import { FileText, Loader2 } from 'lucide-react';

const UploadHistoryTable = ({ history = [], loading = false }) => {
  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const date = new Date(dateVal);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#1B365D' }} />
        <span style={{ marginLeft: '12px', fontSize: '15px', color: '#64748B', fontWeight: 500 }}>Loading upload history...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <FileText size={40} style={{ color: '#94A3B8', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>No uploads found.</h3>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Use the Bulk Upload tab to upload question bank sets.</p>
      </div>
    );
  }

  return (
    <div className="staff-table-wrapper" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <table className="staff-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Role</th>
            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Uploaded By</th>
            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Question Count</th>
            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Action Type</th>
            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Uploaded At</th>
          </tr>
        </thead>
        <tbody>
          {history.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} className="table-row-hover">
              <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #DBEAFE' }}>
                  {log.roleCode}
                </span>
              </td>
              <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                {log.uploadedByName}
              </td>
              <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#059669', fontWeight: 700 }}>
                {log.questionCount} Questions
              </td>
              <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  {log.actionType}
                </span>
              </td>
              <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#475569' }}>
                {formatDate(log.uploadedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UploadHistoryTable;
