// ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import '../../styles/auth.css';

const ForgotPassword = () => {
  const { forgotPasswordSendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMsg('Mobile number is required');
      return;
    }

    // Basic 10 digit regex check
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPasswordSendOtp(trimmedPhone);
    setIsSubmitting(false);

    if (result.success) {
      // Pass the phone number to the next screen using React Router state
      navigate('/reset-password', { state: { phone: trimmedPhone } });
    } else {
      setErrorMsg(result.message || 'Mobile number not registered or server error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <div className="ir-logo-block">IR</div>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your registered mobile number to receive a verification OTP</p>
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
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
                autoComplete="tel"
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
                Sending OTP...
              </>
            ) : (
              'Send OTP'
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

export default ForgotPassword;
