import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LeaveBalances } from '../components/LeaveBalances';
import { UpcomingHolidays } from '../components/UpcomingHolidays';

export function EmployeeDashboard(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}. Here is your leave summary.</p>
      </div>

      <LeaveBalances />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Leave Requests</h3>
          </div>
          <div className="p-6 text-center text-gray-500 flex-1">
            <p>No recent requests to display.</p>
            {/* Table will go here later */}
          </div>
        </div>

        <UpcomingHolidays />
      </div>
    </div>
  );
}
