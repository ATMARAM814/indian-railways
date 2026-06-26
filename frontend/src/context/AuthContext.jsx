// AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');
    return !(savedToken && savedUser);
  });

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Restore session on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = sessionStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data && res.data.success) {
            const userData = res.data.data.user || res.data.data;
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Token invalid or session broken
            logout();
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          // Only clear the session if the failure was an explicit 401 Unauthorized.
          // This keeps the user logged in across normal page reloads or transient offline issues.
          if (error.response && error.response.status === 401) {
            logout();
          }
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (hrmsId, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { hrmsId, password });
      
      if (res.data && res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        
        sessionStorage.setItem('token', receivedToken);
        sessionStorage.setItem('user', JSON.stringify(receivedUser));
        
        setToken(receivedToken);
        setUser(receivedUser);
        
        return { success: true, user: receivedUser };
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Network error occurred';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data && res.data.success) {
        const userData = res.data.data.user || res.data.data;
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      const res = await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      if (res.data && res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Failed to change password' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const forgotPasswordSendOtp = async (phone) => {
    try {
      const res = await apiClient.post('/auth/forgot-password/send-otp', { phone });
      if (res.data && res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Failed to send OTP' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const forgotPasswordVerifyReset = async (phone, otp, newPassword, confirmPassword) => {
    try {
      const res = await apiClient.post('/auth/forgot-password/verify-reset', {
        phone,
        otp,
        newPassword,
        confirmPassword,
      });
      if (res.data && res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Failed to reset password' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        fetchMe,
        changePassword,
        forgotPasswordSendOtp,
        forgotPasswordVerifyReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
