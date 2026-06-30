// ChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import '../../styles/auth.css';

const ChangePassword = () => {
  const { changePassword, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!oldPassword) {
      setErrorMsg('Current password is required');
      return;
    }
    if (!newPassword) {
      setErrorMsg('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long');
      return;
    }
    if (newPassword === oldPassword) {
      setErrorMsg('New password cannot be the same as your current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(oldPassword, newPassword, confirmPassword);
    setIsSubmitting(false);

    if (result.success) {
      logout(); // clear session local state
      navigate('/login?changeSuccess=true', { replace: true });
    } else {
      setErrorMsg(result.message || 'Failed to change password. Please verify your current password.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img src="/logo.png" alt="IR Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Change Password</h2>
          <p className="auth-subtitle">Update your account password to secure your portal access</p>
        </div>

        {errorMsg && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="oldPassword">Current Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="oldPassword"
                type="password"
                className="auth-input"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="newPassword"
                type="password"
                className="auth-input"
                placeholder="Enter new password (min. 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Updating...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>

        <button 
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }} 
          className="back-to-login" 
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
