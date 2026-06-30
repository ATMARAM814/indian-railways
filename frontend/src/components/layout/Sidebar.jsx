// Sidebar.jsx
import React, { useRef, useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getWorkforcePresence } from '../../services/workforce.service';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  FileText, 
  CheckSquare, 
  ShieldAlert, 
  BookOpen, 
  LogOut,
  Building,
  History,
  FileCheck,
  User,
  ChevronDown,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const menuRef = useRef(null);
  
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(
    window.location.pathname.startsWith('/admin/question-bank') || window.location.pathname === '/question-bank'
  );
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (user) {
      getWorkforcePresence()
        .then(res => {
          if (res.success) {
            setPresence(res.data);
          }
        })
        .catch(err => console.error('Failed to load workforce presence', err));
    }
  }, [user]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem('sidebar-scroll-pos');
    if (savedScrollPos && menuRef.current) {
      const target = parseInt(savedScrollPos, 10);
      let count = 0;
      const restore = () => {
        if (menuRef.current) {
          menuRef.current.scrollTop = target;
          if (menuRef.current.scrollTop !== target && count < 10) {
            count++;
            setTimeout(restore, 50);
          }
        }
      };
      restore();
    }
  }, []);

  const handleScroll = (e) => {
    sessionStorage.setItem('sidebar-scroll-pos', e.currentTarget.scrollTop);
  };

  if (!user) return null;

  const role = user.role;

  const hasRole = (roleToCheck) => {
    if (!presence) return true; // Show by default while loading
    const list = presence.map(r => r.toUpperCase());
    let check = roleToCheck.toUpperCase();
    if (check === 'SHUNTING MASTER' || check === 'SHUNTING MASTERS') {
      return list.includes('SHUNTING MASTER') || list.includes('SHUNTING MASTERS') || list.includes('SHM');
    }
    if (check === 'POINTSMEN' || check === 'POINTSMAN') {
      return list.includes('PM') || list.includes('POINTSMAN') || list.includes('POINTSMEN');
    }
    if (check === 'STATION MASTERS' || check === 'STATION MASTER') {
      return list.includes('SM') || list.includes('STATION MASTER') || list.includes('STATION MASTERS');
    }
    if (check === 'TRAIN MANAGERS' || check === 'TRAIN MANAGER') {
      return list.includes('TM') || list.includes('TRAIN MANAGER') || list.includes('TRAIN MANAGERS');
    }
    if (check === 'CABIN MASTERS' || check === 'CABIN MASTER') {
      return list.includes('CABIN MASTER') || list.includes('CABIN MASTERS') || list.includes('CM');
    }
    if (check === 'STATION MASTERS INCHARGE' || check === 'STATION MASTER INCHARGE' || check === 'SS') {
      return list.includes('SS') || list.includes('STATION MASTERS INCHARGE') || list.includes('STATION MASTER INCHARGE') || list.includes('STATION SUPERINTENDENT') || list.includes('STATION SUPERINTENDENTS');
    }
    if (check === 'SM SUPERVISORS' || check === 'STATION MASTER SUPERVISOR' || check === 'SMS') {
      return list.includes('SMS') || list.includes('STATION MASTER SUPERVISOR') || list.includes('STATION MASTER SUPERVISORS') || list.includes('SM SUPERVISOR') || list.includes('SM SUPERVISORS') || list.includes('STATION MASTER SUPERVISIOR') || list.includes('STATION MASTER SUPERVISIO');
    }
    if (check === 'TRAFFIC INSPECTORS' || check === 'TRAFFIC INSPECTOR' || check === 'TI') {
      return list.includes('TI') || list.includes('TRAFFIC INSPECTOR') || list.includes('TRAFFIC INSPECTORS');
    }
    return list.includes(check);
  };

  // Define sidebar menu configurations per role
  const getSidebarLinks = () => {
    const main = [];
    const workforce = [];

    // Main links
    main.push({ name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> });
    
    const isCandidateRole = ['PM', 'TM', 'SHM', 'SHUNTING MASTER', 'Shunting Master'].includes(role);
    if (isCandidateRole) {
      main.push({ name: 'My Assessments', path: '/my-assessment', icon: <ClipboardCheck size={18} /> });
    } else if (role === 'SM' || role === 'SS' || ['Cabin Master', 'CABIN MASTER'].includes(role)) {
      main.push({ name: 'My Assessments', path: '/my-assessment', icon: <ClipboardCheck size={18} /> });
      main.push({ name: 'Assessments', path: '/assessments', icon: <ClipboardCheck size={18} /> });
      if (hasRole('TM')) {
        main.push({ name: 'Approvals', path: '/approvals', icon: <CheckSquare size={18} /> });
      }
      main.push({ name: 'Reports', path: '/reports', icon: <FileText size={18} /> });
      
      if (hasRole('PM')) {
        workforce.push({ name: 'Pointsmen', path: '/workforce/pointsmen', icon: <Users size={18} /> });
      }
      if (hasRole('TM')) {
        workforce.push({ name: 'Train Managers', path: '/workforce/train-managers', icon: <Users size={18} /> });
      }
      if (hasRole('Shunting Master')) {
        workforce.push({ name: 'Shunting Masters', path: '/workforce/shunting-masters', icon: <Users size={18} /> });
      }
    } else if (role === 'TI' || ['Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio'].includes(role)) {
      if (role === 'TI') {
        main.push({ name: 'Stations', path: '/stations', icon: <Building size={18} /> });
        main.push({ name: 'Counselling', path: '/counseling', icon: <GraduationCap size={18} /> });
      }
      main.push({ name: 'My Assessments', path: '/my-assessment', icon: <ClipboardCheck size={18} /> });
      main.push({ name: 'Assessments', path: '/assessments', icon: <ClipboardCheck size={18} /> });
      main.push({ name: 'Approvals', path: '/approvals', icon: <CheckSquare size={18} /> });
      main.push({ name: 'Reports', path: '/reports', icon: <FileText size={18} /> });
      
      if (hasRole('PM')) {
        workforce.push({ name: 'Pointsmen', path: '/workforce/pointsmen', icon: <Users size={18} /> });
      }
      if (hasRole('SM')) {
        workforce.push({ name: 'Station Masters', path: '/workforce/station-masters', icon: <Users size={18} /> });
      }
      if (hasRole('TM')) {
        workforce.push({ name: 'Train Managers', path: '/workforce/train-managers', icon: <Users size={18} /> });
      }
      if (hasRole('Cabin Master')) {
        workforce.push({ name: 'Cabin Masters', path: '/workforce/cabin-master', icon: <Users size={18} /> });
      }
      if (hasRole('Shunting Master')) {
        workforce.push({ name: 'Shunting Masters', path: '/workforce/shunting-masters', icon: <Users size={18} /> });
      }
    } else if (role === 'AOM') {
      main.push({ name: 'Division', path: '/division', icon: <Building size={18} /> });
      main.push({ name: 'Counselling', path: '/counseling', icon: <GraduationCap size={18} /> });
      main.push({ name: 'My Assessments', path: '/my-assessment', icon: <ClipboardCheck size={18} /> });
      main.push({ name: 'Assessments', path: '/assessments', icon: <ClipboardCheck size={18} /> });
      main.push({ name: 'Approvals', path: '/approvals', icon: <CheckSquare size={18} /> });
      main.push({ name: 'Reports', path: '/reports', icon: <FileText size={18} /> });
      
      if (hasRole('PM')) {
        workforce.push({ name: 'Pointsmen', path: '/workforce/pointsmen', icon: <Users size={18} /> });
      }
      if (hasRole('SM')) {
        workforce.push({ name: 'Station Masters', path: '/workforce/station-masters', icon: <Users size={18} /> });
      }
      if (hasRole('TM')) {
        workforce.push({ name: 'Train Managers', path: '/workforce/train-managers', icon: <Users size={18} /> });
      }
      if (hasRole('Station Master Supervisor')) {
        workforce.push({ name: 'SM Supervisors', path: '/workforce/station-master-supervisors', icon: <Users size={18} /> });
      }
      if (hasRole('Cabin Master')) {
        workforce.push({ name: 'Cabin Masters', path: '/workforce/cabin-master', icon: <Users size={18} /> });
      }
      if (hasRole('Shunting Master')) {
        workforce.push({ name: 'Shunting Masters', path: '/workforce/shunting-masters', icon: <Users size={18} /> });
      }
      if (hasRole('SS')) {
        workforce.push({ name: 'SM Incharges', path: '/workforce/station-masters-incharge', icon: <Users size={18} /> });
      }
      if (hasRole('TI')) {
        workforce.push({ name: 'Traffic Inspectors', path: '/workforce/traffic-inspectors', icon: <Users size={18} /> });
      }
    } else if (role === 'SUPER_ADMIN') {
      main.push({ name: 'Division', path: '/division', icon: <Building size={18} /> });
      main.push({ name: 'Counselling', path: '/counseling', icon: <GraduationCap size={18} /> });
      main.push({ name: 'Approvals', path: '/approvals', icon: <CheckSquare size={18} /> });
      main.push({ name: 'Reports', path: '/reports', icon: <FileText size={18} /> });
      main.push({ name: 'Audit Logs', path: '/audit-logs', icon: <History size={18} /> });
      main.push({ name: 'Question Bank', path: '/question-bank', icon: <BookOpen size={18} /> });
      
      if (hasRole('PM')) {
        workforce.push({ name: 'Pointsmen', path: '/workforce/pointsmen', icon: <Users size={18} /> });
      }
      if (hasRole('SM')) {
        workforce.push({ name: 'Station Masters', path: '/workforce/station-masters', icon: <Users size={18} /> });
      }
      if (hasRole('TM')) {
        workforce.push({ name: 'Train Managers', path: '/workforce/train-managers', icon: <Users size={18} /> });
      }
      if (hasRole('Station Master Supervisor')) {
        workforce.push({ name: 'SM Supervisors', path: '/workforce/station-master-supervisors', icon: <Users size={18} /> });
      }
      if (hasRole('Cabin Master')) {
        workforce.push({ name: 'Cabin Masters', path: '/workforce/cabin-master', icon: <Users size={18} /> });
      }
      if (hasRole('Shunting Master')) {
        workforce.push({ name: 'Shunting Masters', path: '/workforce/shunting-masters', icon: <Users size={18} /> });
      }
      if (hasRole('SS')) {
        workforce.push({ name: 'SM Incharges', path: '/workforce/station-masters-incharge', icon: <Users size={18} /> });
      }
      if (hasRole('TI')) {
        workforce.push({ name: 'Traffic Inspectors', path: '/workforce/traffic-inspectors', icon: <Users size={18} /> });
      }
      workforce.push({ name: 'AOM Users', path: '/workforce/aom-users', icon: <Users size={18} /> });
    }

    // My Profile should appear exactly above Workforce Management
    if (role !== 'SUPER_ADMIN') {
      main.push({ name: 'PME & REF Status', path: '/pme-ref-status', icon: <FileCheck size={18} /> });
    }
    main.push({ name: 'My Profile', path: '/profile', icon: <User size={18} /> });

    return { main, workforce };
  };

  const { main: mainLinks, workforce: workforceLinks } = getSidebarLinks();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="sidebar-logo-text">IRES Portal</span>
        </div>

        <nav className="sidebar-menu" ref={menuRef} onScroll={handleScroll}>
          {mainLinks.map((item) => {
            if (item.name === 'Question Bank') {
              const isSubActive = window.location.pathname.startsWith('/admin/question-bank');
              return (
                <div key={item.name} className="sidebar-group">
                  <button
                    onClick={() => setIsQuestionBankOpen(!isQuestionBankOpen)}
                    className={`sidebar-link ${isSubActive ? 'active' : ''}`}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {isQuestionBankOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {isQuestionBankOpen && (
                    <div className="sidebar-sub-menu" style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <NavLink
                        to="/admin/question-bank/upload"
                        className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                        <span>Upload Questions</span>
                      </NavLink>
                      <NavLink
                        to="/admin/question-bank/history"
                        className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                        <span>Upload History</span>
                      </NavLink>
                      <NavLink
                        to="/admin/question-bank/questions"
                        className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                        <span>Manage Questions</span>
                      </NavLink>
                    </div>
                  )}
                </div>
              );
            }

            const isCustomActive = 
              (item.path === '/dashboard' && window.location.pathname.startsWith('/dashboard')) ||
              (item.path === '/stations' && window.location.pathname.startsWith('/stations')) ||
              (item.path === '/division' && (window.location.pathname.startsWith('/stations') || window.location.pathname === '/division'));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive || isCustomActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {workforceLinks.length > 0 && (
            <>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'rgba(255, 255, 255, 0.4)',
                padding: '20px 16px 8px 16px',
              }}>
                Workforce Management
              </div>
              {workforceLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user-info" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', cursor: 'pointer' }}>
            <span className="sidebar-username">{user.fullName || user.full_name || 'Railway Staff'}</span>
            <span className="sidebar-role-badge">{role === 'SS' ? 'SM Incharge' : role.replace('_', ' ')}</span>
          </Link>

          <button className="sidebar-logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
