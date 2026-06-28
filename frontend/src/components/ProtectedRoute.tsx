/**
 * ProtectedRoute.tsx — Role-aware route guard component.
 *
 * Behaviour:
 *   1. While auth state is loading → show a full-screen spinner.
 *   2. If the user is not authenticated → redirect to /login.
 *   3. If allowedRoles is provided and the user's role is not in the list →
 *      redirect to their own role-appropriate home (prevents horizontal
 *      privilege escalation, e.g. an Employee accessing /dashboard/admin).
 *   4. Otherwise → render the child route element.
 *
 * Usage (in AppRouter):
 *   <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'HR_ADMIN']} />}>
 *     <Route path="/dashboard/manager" element={<ManagerDashboard />} />
 *   </Route>
 *
 * Related tasks:
 *   - Task 3171: RBAC middleware — will add permission checks here once
 *     fine-grained permission classes are implemented on the backend.
 *   - Task 3172: React router guards — this component IS the router guard.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';


// -------------------------------------------------------------------------- //
// Loading spinner                                                             //
// -------------------------------------------------------------------------- //

/**
 * Full-screen loading spinner shown while auth state is being hydrated
 * from localStorage on the first render.
 */
function AuthLoadingSpinner(): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-slate-900"
      role="status"
      aria-label="Loading authentication state"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------- //
// ProtectedRoute                                                              //
// -------------------------------------------------------------------------- //

interface ProtectedRouteProps {
  /**
   * Optional whitelist of roles allowed to access this route subtree.
   * If omitted, any authenticated user is allowed through.
   */
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute — Guards a set of nested routes behind authentication
 * and optional role requirements.
 *
 * @param allowedRoles - Roles permitted to access the nested routes.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Hydrating — show spinner to avoid flash of login page.
  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  // 2. Not authenticated — send to login, preserving intended destination.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role not permitted — redirect to access denied page.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  // 4. Authenticated and authorised — render nested route.
  return <Outlet />;
}
