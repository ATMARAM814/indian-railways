// Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import '../styles/auth.css';

const Unauthorized = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (isAuthenticated && user) {
      // Go to their proper dashboard
      switch (user.role) {
        case 'PM': navigate('/dashboard/pm', { replace: true }); break;
        case 'TM': navigate('/dashboard/tm', { replace: true }); break;
        case 'SM': 
        case 'SS': 
        case 'Cabin Master':
        case 'CABIN MASTER':
          navigate('/dashboard/sm', { replace: true }); break;
        case 'SHM':
        case 'SHUNTING MASTER':
        case 'Shunting Master':
          navigate('/dashboard/shunting-master', { replace: true }); break;
        case 'SMS':
        case 'STATION MASTER SUPERVISOR':
        case 'Station Master Supervisor':
        case 'Station Master Supervisior':
        case 'Station Master Supervisio':
          navigate('/dashboard/station-master-supervisor', { replace: true }); break;
        case 'TI': navigate('/dashboard/ti', { replace: true }); break;
        case 'AOM': navigate('/dashboard/aom', { replace: true }); break;
        case 'SUPER_ADMIN': navigate('/dashboard/super-admin', { replace: true }); break;
        default: navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--error)', marginBottom: '20px' }}>
          <ShieldAlert size={64} />
        </div>
        
        <h2 className="auth-title" style={{ fontSize: '22px' }}>Access Denied</h2>
        <p className="auth-desc" style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>
          You do not have the required role permissions to view this dashboard page. If you believe this is an error, please contact your division administrator.
        </p>

        <button 
          onClick={handleBack} 
          className="auth-btn"
          style={{ width: '100%', maxWidth: '240px' }}
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
