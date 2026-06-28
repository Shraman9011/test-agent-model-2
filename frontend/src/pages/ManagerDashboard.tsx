import React from 'react';
import { useAuth } from '../context/AuthContext';

export function ManagerDashboard(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {user?.firstName}. You are managing the {user?.department || 'Operations'} team.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button type="button" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors">
            Review Pending Leaves
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Team Action Required</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-indigo-600">3</p>
            <p className="text-sm text-gray-500 mb-1">requests awaiting your approval</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Team Members on Leave Today</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-gray-900">1</p>
            <p className="text-sm text-gray-500 mb-1">out of 12 employees</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Action Needed
          </span>
        </div>
        <div className="p-6 text-center text-gray-500 py-12">
          <p>The pending requests table will be implemented here.</p>
        </div>
      </div>
    </div>
  );
}
