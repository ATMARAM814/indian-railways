import React from 'react';
import { 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XOctagon, 
  HelpCircle 
} from 'lucide-react';

export const StatusSummaryCards = ({ type, data }) => {
  if (!data) return null;

  // Format Date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
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

  // PME Cards Config
  const pmeCards = [
    {
      label: 'Last PME Date',
      value: formatDate(data.lastDate),
      icon: <Calendar size={18} />,
      highlight: false
    },
    {
      label: 'Next PME Due Date',
      value: formatDate(data.nextDueDate),
      icon: <Calendar size={18} />,
      highlight: true
    },
    {
      label: 'Current PME Status',
      value: data.currentStatus || '—',
      icon: <Activity size={18} />,
      highlight: false,
      isStatus: true
    },
    {
      label: 'Total PME Completed',
      value: data.totalCompleted !== undefined ? data.totalCompleted : 0,
      icon: <CheckCircle2 size={18} />,
      highlight: false
    },
    {
      label: 'Pending / Scheduled PME',
      value: data.pendingScheduled !== undefined ? data.pendingScheduled : 0,
      icon: <Clock size={18} />,
      highlight: false
    },
    {
      label: 'Expired / Overdue PME',
      value: data.expiredOverdue !== undefined ? data.expiredOverdue : 0,
      icon: <AlertTriangle size={18} />,
      highlight: false
    }
  ];

  // REF Cards Config
  const refCards = [
    {
      label: 'Last REF Date',
      value: formatDate(data.lastDate),
      icon: <Calendar size={18} />,
      highlight: false
    },
    {
      label: 'Next REF Due Date',
      value: formatDate(data.nextDueDate),
      icon: <Calendar size={18} />,
      highlight: true
    },
    {
      label: 'Current REF Status',
      value: data.currentStatus || '—',
      icon: <Activity size={18} />,
      highlight: false,
      isStatus: true
    },
    {
      label: 'Total Completed',
      value: data.totalCompleted !== undefined ? data.totalCompleted : 0,
      icon: <CheckCircle2 size={18} />,
      highlight: false
    },
    {
      label: 'Pending / Scheduled',
      value: data.pendingScheduled !== undefined ? data.pendingScheduled : 0,
      icon: <Clock size={18} />,
      highlight: false
    },
    {
      label: 'Expired / Cancelled',
      value: data.expiredCancelled !== undefined ? data.expiredCancelled : 0,
      icon: <XOctagon size={18} />,
      highlight: false
    }
  ];

  const cards = type === 'pme' ? pmeCards : refCards;

  return (
    <div className="pme-ref-kpi-grid">
      {cards.map((card, idx) => (
        <div key={idx} className={`pme-ref-kpi-card ${card.highlight ? 'highlight' : ''}`}>
          <div className="pme-ref-kpi-header">
            <span className="pme-ref-kpi-label">{card.label}</span>
            <div className="pme-ref-kpi-icon-wrapper">
              {card.icon}
            </div>
          </div>
          <div className="pme-ref-kpi-body">
            {card.isStatus ? (
              <div>
                <span className={`pme-ref-badge ${getStatusBadgeClass(card.value)}`}>
                  {card.value}
                </span>
              </div>
            ) : (
              <span className="pme-ref-kpi-value">{card.value}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusSummaryCards;
