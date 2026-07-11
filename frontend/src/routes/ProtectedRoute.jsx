// ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Loader message="Verifying secure session..." fullPage={true} />
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the current location they were trying to access
    const state = location.pathname === '/change-password' ? null : { from: location };
    return <Navigate to="/login" state={state} replace />;
  }

  // Force users with mustChangePassword flag set to go to the password change screen
  if (user && user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;
