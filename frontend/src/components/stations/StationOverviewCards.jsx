// StationOverviewCards.jsx
import React from 'react';
import { Users, UserCog, UserCheck, Building2, Compass } from 'lucide-react';

export const normalizeRoleKey = (roleStr) => {
  const r = (roleStr || '').toUpperCase().trim();
  if (r === 'ALL' || r === '') return 'All';
  if (r === 'PM' || r === 'POINTSMAN' || r === 'POINTSMEN') return 'PM';
  if (r === 'SM' || r === 'STATION MASTER' || r === 'STATION MASTERS') return 'SM';
  if (r === 'TM' || r === 'TRAIN MANAGER' || r === 'TRAIN MANAGERS') return 'TM';
  if (r === 'SMS' || r === 'STATION MASTER SUPERVISOR' || r === 'STATION MASTER SUPERVISIOR' || r === 'STATION MASTER SUPERVISIO' || r === 'SM SUPERVISORS') return 'SMS';
  if (r === 'CM' || r === 'CABIN MASTER' || r === 'CABIN_MASTER' || r === 'TNC' || r === 'CABIN MASTERS') return 'CM';
  if (r === 'SHM' || r === 'SHUNTING MASTER' || r === 'SHUNTING_MASTER' || r === 'SHUNTING MASTERS') return 'SHM';
  if (r === 'SS' || r === 'STATION MASTER INCHARGE' || r === 'STATION_MASTER_INCHARGE' || r === 'SM INCHARGE' || r === 'SM INCHARGES' || r === 'STATION SUPERINTENDENT') return 'SS';
  if (r === 'TI' || r === 'TRAFFIC INSPECTOR' || r === 'TRAFFIC INSPECTORS') return 'TI';
  if (r === 'AOM' || r === 'ASSISTANT OPERATIONS MANAGER') return 'AOM';
  return r;
};

export const StationOverviewCards = ({ workforce = [], onRoleClick, selectedRole }) => {
  const roleConfig = [
    { key: 'PM', title: 'Pointsmen', className: 'pm', desc: 'Active field safety staff', icon: <Users size={18} /> },
    { key: 'SHM', title: 'Shunting Masters', className: 'shm', desc: 'Shunt and yard staff', icon: <UserCog size={18} /> },
    { key: 'CM', title: 'Cabin Masters', className: 'tnc', desc: 'Cabin staff', icon: <Users size={18} /> },
    { key: 'SM', title: 'Station Masters', className: 'sm', desc: 'Station operations team', icon: <UserCheck size={18} /> },
    { key: 'SS', title: 'SM Incharges', className: 'ss', desc: 'Station admin heads', icon: <Building2 size={18} /> },
    { key: 'TM', title: 'Train Managers', className: 'tm', desc: 'Guard and line controllers', icon: <UserCog size={18} /> },
    { key: 'SMS', title: 'SM Supervisors', className: 'sms', desc: 'Senior station officials', icon: <Users size={18} /> },
    { key: 'TI', title: 'Traffic Inspectors', className: 'ti', desc: 'Safety & compliance team', icon: <Compass size={18} /> },
    { key: 'AOM', title: 'AOM', className: 'aom', desc: 'Division supervisors', icon: <UserCog size={18} /> },
  ];

  const list = Array.isArray(workforce) ? workforce : [];
  const totalCount = list.length;

  const roleCounts = {};
  list.forEach((item) => {
    const key = normalizeRoleKey(item.role);
    roleCounts[key] = (roleCounts[key] || 0) + 1;
  });

  // Only show roles that have at least 1 employee (count > 0)
  const availableRoleCards = roleConfig
    .map(cfg => ({ ...cfg, count: roleCounts[cfg.key] || 0 }))
    .filter(cfg => cfg.count > 0);

  const activeNormKey = normalizeRoleKey(selectedRole);
  const isTotalSelected = activeNormKey === 'All';

  return (
    <div className="role-stat-grid-5" style={{ marginBottom: '24px' }}>
      {/* Total Staff Card */}
      <div 
        className="role-stat-card"
        onClick={() => onRoleClick && onRoleClick('All')}
        style={{
          borderLeft: '4px solid #1B365D',
          cursor: onRoleClick ? 'pointer' : 'default',
          backgroundColor: isTotalSelected ? '#F1F5F9' : '#FFFFFF',
          outline: isTotalSelected && onRoleClick ? '2px solid #1B365D' : 'none',
          boxShadow: isTotalSelected ? '0 4px 6px -1px rgba(27, 54, 93, 0.15)' : undefined,
          transition: 'all 0.15s ease'
        }}
        title="Click to view all station employees"
      >
        <div className="role-stat-info">
          <div className="role-stat-title-container">
            <span className="role-stat-title">Total Staff</span>
          </div>
          <span className="role-stat-value">{totalCount}</span>
          <span className="role-stat-desc">Total station workforce</span>
        </div>
        <div 
          className="role-stat-icon-container"
          style={{ backgroundColor: 'rgba(27, 54, 93, 0.08)', color: '#1B365D' }}
        >
          <Users size={18} />
        </div>
      </div>

      {/* Available Role Cards (count > 0 only) */}
      {availableRoleCards.map(cfg => {
        const isSelected = activeNormKey === cfg.key;
        return (
          <div
            key={cfg.key}
            className={`role-stat-card ${cfg.className}`}
            onClick={() => onRoleClick && onRoleClick(isSelected ? 'All' : cfg.key)}
            style={{
              cursor: onRoleClick ? 'pointer' : 'default',
              backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
              outline: isSelected ? '2px solid #2563EB' : 'none',
              boxShadow: isSelected ? '0 4px 6px -1px rgba(37, 99, 235, 0.18)' : undefined,
              transition: 'all 0.15s ease'
            }}
            title={`Click to filter by ${cfg.title}`}
          >
            <div className="role-stat-info">
              <div className="role-stat-title-container">
                <span className="role-stat-title">{cfg.title}</span>
              </div>
              <span className="role-stat-value">{cfg.count}</span>
              <span className="role-stat-desc">{cfg.desc}</span>
            </div>
            <div className="role-stat-icon-container">
              {cfg.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StationOverviewCards;
