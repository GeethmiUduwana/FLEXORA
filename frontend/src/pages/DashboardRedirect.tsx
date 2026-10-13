import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.PLATFORM_ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    case UserRole.BUSINESS_OWNER:
      return <Navigate to="/business/dashboard" replace />;
    case UserRole.MANAGER:
      return <Navigate to="/manager/dashboard" replace />;
    case UserRole.STAFF:
      return <Navigate to="/staff/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
