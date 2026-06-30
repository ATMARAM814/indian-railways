// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Phone, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import '../../styles/auth.css';

const ResetPassword = () => {
  const { forgotPasswordVerifyReset } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate phone number from navigation state
  useEffect(() => {
    if (location.state && location.state.phone) {
      setPhone(location.state.phone);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone) {
      setErrorMsg('Mobile number is required');
      return;
    }
    if (!otp) {
      setErrorMsg('OTP code is required');
      return;
    }
    if (otp.length < 4) {
      setErrorMsg('OTP must be a valid code');
      return;
    }
    if (!newPassword) {
      setErrorMsg('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPasswordVerifyReset(phone, otp, newPassword, confirmPassword);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/login?resetSuccess=true', { replace: true });
    } else {
      setErrorMsg(result.message || 'OTP verification failed or has expired');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img src="/logo.png" alt="IR Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Verify OTP code and create a new secure password</p>
        </div>

        {errorMsg && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Mobile Number</label>
            <div className="input-container">
              <Phone size={18} className="input-icon" />
              <input
                id="phone"
                type="text"
                maxLength={10}
                className="auth-input"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="otp">OTP Code</label>
            <div className="input-container">
              <KeyRound size={18} className="input-icon" />
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="auth-input"
                placeholder="Enter verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
                autoComplete="one-time-code"
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
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="Confirm your new password"
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
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <Link to="/login" className="back-to-login">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
