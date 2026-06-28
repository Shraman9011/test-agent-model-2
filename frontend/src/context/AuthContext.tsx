/**
 * AuthContext.tsx — Global authentication state provider.
 *
 * Wraps the entire app with user identity and session management.
 * The JWT token is stored in localStorage under the key 'auth_token'.
 * The user object is stored under 'auth_user' as JSON.
 *
 * Usage:
 *   const { user, login, logout, isLoading } = useAuth();
 *
 * Related tasks:
 *   - Task 3168: login() will be called by the login form after a
 *     successful POST /api/auth/login response.
 *   - Task 3171: RBAC middleware will read user.role to guard routes.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthContextValue, AuthUser } from '../types/auth';

// -------------------------------------------------------------------------- //
// Constants                                                                   //
// -------------------------------------------------------------------------- //

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

// -------------------------------------------------------------------------- //
// Context creation                                                            //
// -------------------------------------------------------------------------- //

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// -------------------------------------------------------------------------- //
// Provider                                                                    //
// -------------------------------------------------------------------------- //

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider — Provides authentication state to the entire component tree.
 *
 * On mount it reads any persisted user/token from localStorage so the session
 * survives a page refresh.  The isLoading flag is true only during that brief
 * hydration window so child components can show a spinner instead of a flash
 * of the login page.
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate state from localStorage on first mount.
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem(USER_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      // Corrupt storage — clear it.
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Persist the authenticated user and JWT token, then update context state.
   * Called by the login page after a successful POST /api/auth/login.
   *
   * @param authenticatedUser - The user object returned by the API.
   * @param token             - The JWT access token.
   * @param refreshToken      - The JWT refresh token.
   */
  const login = useCallback((authenticatedUser: AuthUser, token: string, refreshToken?: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem('auth_refresh', refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  }, []);

  /**
   * Clear the session — removes stored token and user, resets state.
   * The router redirect to /login is handled by ProtectedRoute.
   */
  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('auth_refresh');
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -------------------------------------------------------------------------- //
// Hook                                                                        //
// -------------------------------------------------------------------------- //

/**
 * useAuth — Consume the AuthContext inside any component.
 *
 * @throws If called outside of an <AuthProvider>.
 *
 * @example
 *   const { user, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
