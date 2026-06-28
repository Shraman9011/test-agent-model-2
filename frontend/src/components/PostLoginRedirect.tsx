import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME_ROUTES } from '../types/auth';

/**
 * PostLoginRedirect — Automatically routes authenticated users to their
 * respective dashboard based on their role.
 * 
 * If unauthenticated, they are sent to /login.
 */
export function PostLoginRedirect(): React.JSX.Element {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROLE_HOME_ROUTES[user.role]} replace />;
}
