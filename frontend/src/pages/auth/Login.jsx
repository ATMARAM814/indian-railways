// Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../../styles/auth.css';

const Login = () => {
  const { login, isAuthenticated, user, loading } = useAuth();
  const [hrmsId, setHrmsId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Parse location messages (like password changed successfully or expired session)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('resetSuccess') === 'true') {
      setSuccessMsg('Password reset successfully. Please login with your new password.');
    } else if (queryParams.get('changeSuccess') === 'true') {
      setSuccessMsg('Password changed successfully. Please login again.');
    } else if (queryParams.get('expired') === 'true') {
      setApiError('Your session has expired. Please login again.');
    }
  }, [location]);

  function getRoleRedirectPath(role) {
    switch (role) {
      case 'PM':
      case 'TNC':
        return '/dashboard/pm';
      case 'TM':
        return '/dashboard/tm';
      case 'Cabin Master':
      case 'CABIN MASTER':
        return '/dashboard/sm';
      case 'SHM':
      case 'SHUNTING MASTER':
      case 'Shunting Master':
        return '/dashboard/shunting-master';
      case 'SS':
      case 'SM':
        return '/dashboard/sm';
      case 'SMS':
      case 'STATION MASTER SUPERVISOR':
      case 'Station Master Supervisor':
      case 'Station Master Supervisior':
      case 'Station Master Supervisio':
        return '/dashboard/station-master-supervisor';
      case 'TI': return '/dashboard/ti';
      case 'AOM': return '/dashboard/aom';
      case 'SUPER_ADMIN': return '/dashboard/super-admin';
      default: return '/unauthorized';
    }
  }

  const isPathAllowedForRole = (path, role) => {
    if (!path || path === '/' || path === '/login' || path === '/unauthorized' || path === '/change-password') {
      return true;
    }
    const r = (role || '').toUpperCase();
    
    // Dashboard routes
    if (path.startsWith('/dashboard/pm')) {
      return ['PM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/dashboard/tm')) {
      return r === 'TM';
    }
    if (path.startsWith('/dashboard/shunting-master')) {
      return ['SHM', 'SHUNTING MASTER', 'Shunting Master'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/dashboard/sm')) {
      return ['SM', 'SS', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/dashboard/station-master-supervisor')) {
      return ['SMS', 'STATION MASTER SUPERVISOR', 'Station Master Supervisor', 'Station Master Supervisior', 'Station Master Supervisio'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/dashboard/ti')) {
      return r === 'TI';
    }
    if (path.startsWith('/dashboard/aom')) {
      return r === 'AOM';
    }
    if (path.startsWith('/dashboard/super-admin')) {
      return r === 'SUPER_ADMIN';
    }
    
    // Scoped sub-routes
    if (path.startsWith('/assessments')) {
      return ['PM', 'SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/my-assessment')) {
      return ['PM', 'SM', 'TM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER', 'SHM', 'SHUNTING MASTER', 'Shunting Master', 'TI', 'AOM'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/reports')) {
      return ['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/division')) {
      return ['AOM', 'SUPER_ADMIN'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/stations')) {
      if (path.match(/^\/stations\/[^/]+$/)) {
        return ['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR'].map(x => x.toUpperCase()).includes(r);
      }
      return r === 'TI';
    }
    if (path.startsWith('/approvals')) {
      return ['SM', 'SS', 'TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Station Master Supervisior', 'Station Master Supervisio', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/audit-logs')) {
      return r === 'SUPER_ADMIN';
    }
    if (path.startsWith('/admin/question-bank') || path.startsWith('/question-bank')) {
      return r === 'SUPER_ADMIN';
    }
    
    // Workforce routes
    if (path.startsWith('/workforce/pointsmen')) {
      return ['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/station-masters-incharge')) {
      return ['AOM', 'SUPER_ADMIN'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/station-masters')) {
      return ['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/train-managers')) {
      return ['SM', 'SS', 'TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/station-master-supervisors')) {
      return ['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/cabin-master')) {
      return ['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/shunting-masters')) {
      return ['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/traffic-inspectors')) {
      return ['AOM', 'SUPER_ADMIN'].map(x => x.toUpperCase()).includes(r);
    }
    if (path.startsWith('/workforce/aom-users')) {
      return r === 'SUPER_ADMIN';
    }
    if (path.startsWith('/workforce/profile/')) {
      return ['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER'].map(x => x.toUpperCase()).includes(r);
    }
    
    return true;
  };

  // Handle redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        let from = getRoleRedirectPath(user.role);
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setApiError('');
    setSuccessMsg('');

    if (!hrmsId.trim()) {
      setFormError('HRMS ID is required');
      return;
    }
    if (!password) {
      setFormError('Password is required');
      return;
    }

    setIsSubmitting(true);
    const result = await login(hrmsId.trim().toUpperCase(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setApiError(result.message || 'Invalid HRMS ID or password');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <div className="ir-logo-block">IR</div>
        </div>
        
        <div className="auth-header">
          <h2 className="auth-title">Railway Evaluation System</h2>
          <p className="auth-subtitle">Internal evaluation & assessments portal</p>
        </div>

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            <span>{successMsg}</span>
          </div>
        )}

        {apiError && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="hrmsId">HRMS ID</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                id="hrmsId"
                type="text"
                className={`auth-input ${formError && !hrmsId ? 'input-error' : ''}`}
                placeholder="Enter your HRMS ID"
                value={hrmsId}
                onChange={(e) => setHrmsId(e.target.value)}
                disabled={isSubmitting}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${formError && !password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #64748B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {formError && (
            <div className="error-text">
              {formError}
            </div>
          )}

          <Link to="/forgot-password" className="forgot-password-link">
            Forgot password?
          </Link>

          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Verifying...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
