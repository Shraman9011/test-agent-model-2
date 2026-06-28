import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardLayout — Shared shell for all authenticated dashboards.
 * Renders the top navigation bar and a content area.
 */
export function DashboardLayout(): React.JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-lg">
                  L
                </div>
                <span className="text-xl font-semibold text-gray-900 tracking-tight">LeaveSync</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 text-right">
                <div className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-500">
                  {user?.role.replace('_', ' ')}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child routes will render here */}
        <Outlet />
      </main>
    </div>
  );
}
