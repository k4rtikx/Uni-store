import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../context/useAuth';

/**
 * ProtectedRoute Component
 * Strictly guards authenticated routes against unauthorized access:
 * 1. Waits for authentication state check to complete (avoids premature redirect)
 * 2. Safely redirects unauthenticated visitors to /login preserving target route in state
 * 3. Uses replace to prevent circular history loops
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Verifying Campus Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
