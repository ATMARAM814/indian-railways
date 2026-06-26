// EmptyState.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EmptyState = ({ title, message }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 32px',
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
      border: '1px dashed #CBD5E1',
      borderRadius: '16px'
    }}>
      <div style={{
        color: '#DC2626',
        backgroundColor: '#FEF2F2',
        padding: '16px',
        borderRadius: '50%',
        marginBottom: '16px',
        display: 'inline-flex'
      }}>
        <AlertCircle size={32} />
      </div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
        {title || 'No Records Found'}
      </h3>
      <p style={{ margin: 0, fontSize: '14px', color: '#64748B', maxWidth: '400px', lineHeight: 1.5 }}>
        {message || 'The requested resource or intelligence metrics are not available.'}
      </p>
    </div>
  );
};
export default EmptyState;
