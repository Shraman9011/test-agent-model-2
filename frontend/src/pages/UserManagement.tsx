import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { Modal } from '../components/Modal';
import { EmployeeCreationForm } from '../components/EmployeeCreationForm';
import { EmployeeEditForm } from '../components/EmployeeEditForm';
import { DeactivateEmployeeDialog } from '../components/DeactivateEmployeeDialog';
import { Toast, ToastType } from '../components/Toast';
import { UserPlus, Mail, Briefcase, Edit2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Employee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  phone_number: string;
  user_role: string;
  role: string;
  is_active: boolean;
  manager: number | null;
}

export function UserManagement(): React.JSX.Element {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const fetchEmployees = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/employees/');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to load employees', err);
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const showToast = (message: string, type: ToastType): void => {
    setToast({ message, type });
  };

  const handleCreateSuccess = (): void => {
    setIsCreateModalOpen(false);
    showToast('Employee created successfully!', 'success');
    fetchEmployees();
  };

  const handleEditSuccess = (): void => {
    setEditingEmployee(null);
    showToast('Employee updated successfully!', 'success');
    fetchEmployees();
  };

  const handleDeactivateSuccess = (): void => {
    const isReactivating = deactivatingEmployee && !deactivatingEmployee.is_active;
    setDeactivatingEmployee(null);
    showToast(isReactivating ? 'Employee reactivated successfully!' : 'Employee deactivated successfully!', 'success');
    fetchEmployees();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            A list of all users in the system including their name, role, email, and department.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      System Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        Loading employees...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee) => (
                      <tr 
                        key={employee.id} 
                        className={`transition-colors ${employee.is_active ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60 grayscale'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold ${employee.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-300 text-gray-600'}`}>
                              {employee.first_name[0]}{employee.last_name[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                            {employee.user_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Briefcase className="h-3 w-3 mr-1 text-gray-400" />
                            {employee.role || 'N/A'}
                          </div>
                          {employee.department && (
                            <div className="text-xs text-gray-400 mt-1">{employee.department}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.is_active ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button 
                              onClick={() => setEditingEmployee(employee)}
                              className="text-indigo-600 hover:text-indigo-900 inline-flex items-center focus:outline-none"
                              aria-label={`Edit ${employee.first_name}`}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                            {employee.is_active ? (
                              <button 
                                onClick={() => setDeactivatingEmployee(employee)}
                                className="text-red-600 hover:text-red-900 inline-flex items-center focus:outline-none"
                                aria-label={`Deactivate ${employee.first_name}`}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Deactivate
                              </button>
                            ) : (
                              <button 
                                onClick={() => setDeactivatingEmployee(employee)}
                                className="text-green-600 hover:text-green-900 inline-flex items-center focus:outline-none"
                                aria-label={`Reactivate ${employee.first_name}`}
                              >
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <EmployeeCreationForm 
          onSuccess={handleCreateSuccess} 
          onCancel={() => setIsCreateModalOpen(false)} 
        />
      </Modal>

      <Modal isOpen={editingEmployee !== null} onClose={() => setEditingEmployee(null)}>
        {editingEmployee && (
          <EmployeeEditForm 
            employee={editingEmployee}
            onSuccess={handleEditSuccess} 
            onCancel={() => setEditingEmployee(null)} 
          />
        )}
      </Modal>

      <Modal isOpen={deactivatingEmployee !== null} onClose={() => setDeactivatingEmployee(null)}>
        {deactivatingEmployee && (
          <DeactivateEmployeeDialog 
            employee={deactivatingEmployee}
            onSuccess={handleDeactivateSuccess} 
            onCancel={() => setDeactivatingEmployee(null)} 
          />
        )}
      </Modal>

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
