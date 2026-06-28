import React from 'react';
import { useAuth } from '../context/AuthContext';

export function AdminDashboard(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Configuration Panel</h1>
        <p className="text-gray-500 mt-1">HR Admin privileges active for {user?.firstName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-t-4 border-t-indigo-500">
          <h3 className="text-lg font-medium text-gray-900 mb-1">User Management</h3>
          <p className="text-sm text-gray-500 mb-4">Add, edit, or disable employee accounts and assign roles.</p>
          <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">Manage Users &rarr;</button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-t-4 border-t-indigo-500">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Leave Policies</h3>
          <p className="text-sm text-gray-500 mb-4">Configure leave types, accrual rules, and public holidays.</p>
          <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">Configure Policies &rarr;</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-t-4 border-t-indigo-500">
          <h3 className="text-lg font-medium text-gray-900 mb-1">System Reports</h3>
          <p className="text-sm text-gray-500 mb-4">Export organization-wide leave data and audit logs.</p>
          <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">View Reports &rarr;</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent System Activity</h3>
        </div>
        <div className="p-6">
          <ul className="divide-y divide-gray-200 -my-6">
            {/* Placeholders for activity log */}
            <li className="py-4 flex gap-4">
              <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">System initialization completed</p>
                <p className="text-xs text-gray-500">Today at 09:00 AM</p>
              </div>
            </li>
            <li className="py-4 flex gap-4">
              <div className="w-2 h-2 mt-2 bg-indigo-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Test users seeded into database</p>
                <p className="text-xs text-gray-500">Yesterday at 14:30 PM</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
