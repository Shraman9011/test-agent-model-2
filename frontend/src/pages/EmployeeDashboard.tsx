import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LeaveBalances } from '../components/LeaveBalances';
import { UpcomingHolidays } from '../components/UpcomingHolidays';
import { ApplyLeaveForm } from '../components/ApplyLeaveForm';
import { Modal } from '../components/Modal';
import { LeaveHistory } from '../components/LeaveHistory';
import { useState } from 'react';

export function EmployeeDashboard(): React.JSX.Element {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLeaveApplied = (): void => {
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}. Here is your leave summary.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-1.5 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Apply for Leave
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ApplyLeaveForm 
          onSuccess={handleLeaveApplied} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <LeaveBalances key={`balances-${refreshKey}`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveHistory key={`history-${refreshKey}`} onStateChange={() => setRefreshKey(prev => prev + 1)} />
        <UpcomingHolidays />
      </div>
    </div>
  );
}
