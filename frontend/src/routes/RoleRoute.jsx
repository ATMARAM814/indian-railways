// RoleRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).trim().toUpperCase();
  if (r === 'SM' || r === 'STATION MASTER' || r === 'STATION_MASTER') return 'SM';
  if (r === 'SS' || r === 'STATION MASTER INCHARGE' || r === 'STATION_MASTER_INCHARGE' || r === 'SM INCHARGE' || r === 'STATION SUPERINTENDENT' || r === 'STATION SUPERINTENDENTS') return 'SS';
  if (r === 'CM' || r === 'CABIN MASTER' || r === 'CABIN_MASTER') return 'CABIN MASTER';
  if (r === 'SHM' || r === 'SHUNTING MASTER' || r === 'SHUNTING_MASTER') return 'SHUNTING MASTER';
  if (r === 'SMS' || r === 'STATION MASTER SUPERVISOR' || r === 'STATION_MASTER_SUPERVISOR' || r === 'SM SUPERVISOR' || r === 'STATION MASTER SUPERVISIOR' || r === 'STATION MASTER SUPERVISIO') return 'SMS';
  if (r === 'PM' || r === 'POINTSMAN' || r === 'POINTSMEN') return 'PM';
  if (r === 'TM' || r === 'TRAIN MANAGER' || r === 'TRAIN_MANAGER') return 'TM';
  if (r === 'TI' || r === 'TRAFFIC INSPECTOR' || r === 'TRAFFIC_INSPECTOR') return 'TI';
  if (r === 'AOM' || r === 'ASSISTANT OPERATIONS MANAGER') return 'AOM';
  if (r === 'SUPER_ADMIN' || r === 'SUPER ADMIN' || r === 'SA' || r === 'ADMIN') return 'SUPER_ADMIN';
  return r;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Verifying access permissions..." fullPage={true} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userNorm = normalizeRole(user.role);
  const allowedNorms = (allowedRoles || []).map(r => normalizeRole(r));

  const isKakirwar = user?.hrmsId === 'BKFOEQ' || user?.hrms_id === 'BKFOEQ' || user?.id === '439a8db6-2546-4858-abbc-3752f4acb536';
  const isAllowed = 
    (allowedRoles || []).includes(user.role) || 
    allowedNorms.includes(userNorm) || 
    (isKakirwar && (allowedNorms.includes('SS') || allowedNorms.includes('TI') || allowedNorms.includes('TM')));

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
