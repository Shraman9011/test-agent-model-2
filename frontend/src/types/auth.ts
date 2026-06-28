/**
 * auth.ts — Shared authentication and RBAC type definitions.
 *
 * UserRole values must match the backend users.models.UserRole choices:
 *   EMPLOYEE | MANAGER | HR_ADMIN
 *
 * These types are used throughout the app:
 *   - AuthContext (global auth state)
 *   - ProtectedRoute (guards)
 *   - Dashboard shell layouts (role-based content)
 */

/** The three roles supported by the HR Leave Management System. */
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

/** Authenticated user payload stored in AuthContext. */
export interface AuthUser {
  /** Numeric PK from users_user table. */
  id: number;
  /** Login email address. */
  email: string;
  /** User's first name. */
  firstName: string;
  /** User's last name. */
  lastName: string;
  /** RBAC role — determines which dashboard the user sees. */
  role: UserRole;
  /** Organisational department (optional). */
  department?: string;
}

/** Shape of the global AuthContext value. */
export interface AuthContextValue {
  /** The currently authenticated user, or null if not logged in. */
  user: AuthUser | null;
  /** True while the session is being resolved (e.g. on first load). */
  isLoading: boolean;
  /**
   * Programmatically log the user in and store their session.
   * Called by the login form after a successful API response.
   *
   * @param user - The authenticated user object.
   * @param token - The JWT access token returned by the backend.
   * @param refreshToken - The JWT refresh token returned by the backend.
   */
  login: (user: AuthUser, token: string, refreshToken?: string) => void;
  /** Log the user out, clear the stored token, and redirect to /login. */
  logout: () => void;
}

/**
 * Maps each UserRole to the app route the user should be redirected to
 * immediately after a successful login.
 *
 * Used by: PostLoginRedirect, ProtectedRoute
 *
 * TODO (Task 3168): Update these paths once the full dashboard pages are built.
 */
export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  EMPLOYEE: '/dashboard/employee',
  MANAGER: '/dashboard/manager',
  HR_ADMIN: '/dashboard/admin',
};
