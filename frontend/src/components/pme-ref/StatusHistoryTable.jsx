import React from 'react';
import { FileText } from 'lucide-react';

export const StatusHistoryTable = ({ type, history }) => {
  // Format Date helper
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '—') return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate());
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatusBadgeClass = (status) => {
    if (!status || status === '—') return 'badge-none';
    const lower = status.toLowerCase();
    if (lower === 'fit' || lower === 'cleared') return 'badge-fit';
    if (lower === 'unfit' || lower === 'cancelled' || lower === 'expired') return 'badge-unfit';
    if (lower === 'pending') return 'badge-pending';
    if (lower === 'scheduled') return 'badge-scheduled';
    return 'badge-none';
  };

  const isEmpty = !history || history.length === 0;

  if (type === 'pme') {
    if (isEmpty) {
      return (
        <div className="pme-ref-table-wrapper">
          <div className="pme-ref-empty-state">
            <FileText size={48} className="pme-ref-empty-icon" />
            <p className="pme-ref-empty-text">No PME history available.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="pme-ref-table-wrapper">
        <table className="pme-ref-table">
          <thead>
            <tr>
              <th>PME Date</th>
              <th>PME Status</th>
              <th>Conducted By</th>
              <th>Next Due Date</th>
              <th>Medical Fitness Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td>{formatDate(row.pmeDate)}</td>
                <td>
                  <span className={`pme-ref-badge ${getStatusBadgeClass(row.pmeStatus)}`}>
                    {row.pmeStatus || '—'}
                  </span>
                </td>
                <td>{row.conductedBy || '—'}</td>
                <td>{formatDate(row.nextDueDate)}</td>
                <td>
                  <span className={`pme-ref-badge ${getStatusBadgeClass(row.medicalFitnessStatus)}`}>
                    {row.medicalFitnessStatus || '—'}
                  </span>
                </td>
                <td>{row.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Refresher Course Table
  if (isEmpty) {
    return (
      <div className="pme-ref-table-wrapper">
        <div className="pme-ref-empty-state">
          <FileText size={48} className="pme-ref-empty-icon" />
          <p className="pme-ref-empty-text">No refresher training history available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pme-ref-table-wrapper">
      <table className="pme-ref-table">
        <thead>
          <tr>
            <th>Training Date</th>
            <th>REF Status</th>
            <th>Conducted By</th>
            <th>Next Due Date</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row.trainingDate)}</td>
              <td>
                <span className={`pme-ref-badge ${getStatusBadgeClass(row.refStatus)}`}>
                  {row.refStatus || '—'}
                </span>
              </td>
              <td>{row.conductedBy || '—'}</td>
              <td>{formatDate(row.nextDueDate)}</td>
              <td>{row.remarks || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatusHistoryTable;
