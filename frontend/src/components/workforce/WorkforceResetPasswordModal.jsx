import React, { useState } from 'react';
import { X, Key, Loader, CheckCircle, Copy, Check } from 'lucide-react';

const WorkforceResetPasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  user = null
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    const result = await onSubmit(user.id);
    setSubmitting(false);

    if (result.success) {
      // The backend returns { defaultPassword: hrms_id } in data
      setSuccessData(result.data || { defaultPassword: user.hrms_id });
    } else {
      setError(result.message || 'Failed to reset password');
    }
  };

  const handleClose = () => {
    // Reset internal state
    setSuccessData(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const handleCopy = () => {
    if (successData?.defaultPassword) {
      navigator.clipboard.writeText(successData.defaultPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid #D7E3EF',
        boxShadow: '0 20px 25px -5px rgba(11, 35, 65, 0.1), 0 10px 10px -5px rgba(11, 35, 65, 0.04)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #EEF2F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color={successData ? '#16A34A' : '#7E22CE'} />
            {successData ? 'Password Reset Successful' : 'Reset User Password'}
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#B91C1C',
              fontSize: '13.5px',
              fontWeight: 500,
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {!successData ? (
            <>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                Are you sure you want to reset the password for{' '}
                <strong style={{ color: '#0F172A' }}>{user.full_name}</strong> (HRMS ID: <code>{user.hrms_id}</code>)?
              </p>

              <p style={{
                margin: '16px 0 0 0',
                fontSize: '13px',
                color: '#7E22CE',
                backgroundColor: '#F3E8FF',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 500,
                lineHeight: 1.5
              }}>
                Notice: This will reset their password to their HRMS ID. They will be forced to set a new password on their next login attempt.
              </p>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                borderTop: '1px solid #EEF2F6',
                paddingTop: '20px'
              }}>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: '#7E22CE',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                <CheckCircle size={48} color="#16A34A" />
                <p style={{ margin: 0, fontSize: '14.5px', color: '#334155', fontWeight: 500 }}>
                  Password has been successfully reset for {user.full_name}.
                </p>
              </div>

              <div style={{
                margin: '20px 0',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Temporary/Default Password
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                    {successData.defaultPassword}
                  </code>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: copied ? '#16A34A' : '#475569',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D2D6DC',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', textAlign: 'center', lineHeight: 1.5 }}>
                Please share this temporary password with the user. They will be prompted to update it immediately upon login.
              </p>

              {/* Close Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '24px',
                borderTop: '1px solid #EEF2F6',
                paddingTop: '20px'
              }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '10px 32px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default WorkforceResetPasswordModal;
