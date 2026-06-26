// Topbar.jsx
import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Topbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Derive page title from active path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/assessments')) return 'Staff Assessments';
    if (path.startsWith('/pointsmen')) return 'Pointsmen Directory';
    if (path.startsWith('/station-masters')) return 'Station Masters Directory';
    if (path.startsWith('/train-managers')) return 'Train Managers Directory';
    if (path.startsWith('/workforce/station-masters-incharge')) return 'SM Incharges Directory';
    if (path.startsWith('/traffic-inspectors')) return 'Traffic Inspectors Directory';
    if (path.startsWith('/division')) return 'Division Structure';
    if (path.startsWith('/approvals')) return 'Assessments Approval Panel';
    if (path.startsWith('/reports')) return 'Evaluation Reports';
    if (path.startsWith('/audit-logs')) return 'System Audit Logs';
    if (path.startsWith('/question-bank')) return 'Question Bank Management';
    if (path.startsWith('/staff-management')) return 'Staff Accounts Management';
    return 'Railway Evaluation System';
  };

  const getInitials = (name) => {
    if (!name) return 'IR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const fullName = user.fullName || user.full_name || 'Railway Staff';
  const initials = getInitials(fullName);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle-btn" onClick={onToggleSidebar}>
          <Menu size={22} />
        </button>
        <span className="topbar-title">{getPageTitle()}</span>
      </div>

      <div className="topbar-right">
        <div className="topbar-date">
          <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          <span>{formattedDate}</span>
        </div>
        <div className="topbar-divider"></div>
        <div className="topbar-user">
          <Link to="/profile" className="user-avatar" title={fullName} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
