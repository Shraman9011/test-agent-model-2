import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, AuthUser } from '../types/auth';

/**
 * Temporary Login Page to test Task 3173 post-login redirect.
 * Task 3169 will replace this with the real UI and actual API calls.
 */
export function LoginPage(): React.JSX.Element {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('EMPLOYEE');

  const handleMockLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    
    // Create a mock user based on the selected role
    const mockUser: AuthUser = {
      id: 1,
      email: `${selectedRole.toLowerCase()}@example.com`,
      firstName: 'Mock',
      lastName: 'User',
      role: selectedRole,
      department: 'Engineering'
    };

    // Perform login (this will update context and trigger redirect via ProtectedRoute)
    login(mockUser, 'mock-jwt-token-123');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
          L
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">LeaveSync</h2>
        <p className="mt-2 text-sm text-gray-600">
          (Temporary Login Page for testing redirects)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleMockLogin}>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Select Role to Test Redirect
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR_ADMIN">HR Admin</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Mock Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
