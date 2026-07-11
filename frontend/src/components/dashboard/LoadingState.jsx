// LoadingState.jsx
import React from 'react';
import Loader from '../common/Loader';

const LoadingState = ({ message = 'Loading dashboard details...' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', width: '100%' }}>
      <Loader message={message} size="md" />
    </div>
  );
};

export default LoadingState;
