// ErrorState.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorState = ({ message = 'Failed to load dashboard data. Please try again.', onRetry }) => {
  return (
    <div className="error-wrapper">
      <div style={{ color: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.08)', padding: '16px', borderRadius: '50%' }}>
        <AlertTriangle size={32} />
      </div>
      <h3 className="error-title">Database Sync Error</h3>
      <p className="error-desc">{message}</p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            marginTop: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0B2341',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1F3B5F'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0B2341'}
        >
          <RefreshCw size={14} /> Retry Sync
        </button>
      )}
    </div>
  );
};

export default ErrorState;
