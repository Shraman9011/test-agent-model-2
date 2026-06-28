import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { LeaveBalanceAdjustmentForm } from '../components/LeaveBalanceAdjustmentForm';
import { AuditLogTable } from '../components/AuditLogTable';
import { ArrowLeft, User } from 'lucide-react';
import { Toast, ToastType } from '../components/Toast';

interface EmployeeDetail {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  is_active: boolean;
}

export function EmployeeProfile(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const fetchEmployee = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/employees/${id}/`);
      setEmployee(response.data);
    } catch (err) {
      console.error('Failed to load employee', err);
      setToast({ message: 'Failed to load employee details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleAdjustmentSuccess = (): void => {
    setToast({ message: 'Leave balance adjusted successfully.', type: 'success' });
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading employee profile...</div>;
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/dashboard/admin/users')} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
        </button>
        <div className="p-8 text-center text-red-500">Employee not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard/admin/users')} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <User className="h-6 w-6 mr-2 text-indigo-500" />
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {employee.role || 'No Job Title'} &middot; {employee.department || 'No Department'} &middot; {employee.email}
            </p>
          </div>
        </div>
        {!employee.is_active && (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
            Inactive
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <LeaveBalanceAdjustmentForm 
            employeeId={employee.id} 
            onSuccess={handleAdjustmentSuccess} 
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <AuditLogTable 
            employeeId={employee.id} 
            key={refreshKey} 
          />
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
