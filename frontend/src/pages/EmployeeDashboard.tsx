import React from 'react';
import { useAuth } from '../context/AuthContext';

export function EmployeeDashboard(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}. Here is your leave summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards for future data integration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Annual Leave Balance</h3>
          <p className="text-3xl font-bold text-gray-900">12 <span className="text-lg text-gray-500 font-normal">days</span></p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sick Leave Balance</h3>
          <p className="text-3xl font-bold text-gray-900">5 <span className="text-lg text-gray-500 font-normal">days</span></p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-amber-600">1</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Leave Requests</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>No recent requests to display.</p>
          {/* Table will go here later */}
        </div>
      </div>
    </div>
  );
}
