import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireCompany = false }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (requireCompany) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (!payload || !payload.company) return <Navigate to="/" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      return <Navigate to="/" replace />;
    }
  }
  return children;
};

export default ProtectedRoute;
