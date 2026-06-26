import React from 'react';
import { LogOut, AlertCircle } from 'lucide-react';

const ExitExamModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-container" style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '480px',
        width: '90%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#EA580C' }}>
          <AlertCircle size={28} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Save and Exit Assessment?</h3>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          Are you sure you want to exit the assessment? Your current progress (including saved answers) has been synchronized and saved to the cloud. 
          You can resume this attempt anytime later from your landing dashboard.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-premium-secondary" onClick={onClose}>
            Resume Assessment
          </button>
          <button
            className="btn-premium-danger"
            onClick={onConfirm}
          >
            <LogOut size={16} />
            <span>Save & Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitExamModal;
