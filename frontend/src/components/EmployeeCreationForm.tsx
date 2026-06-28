import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface EmployeeCreationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface EmployeeOption {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export function EmployeeCreationForm({ onSuccess, onCancel }: EmployeeCreationFormProps): React.JSX.Element {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    department: '',
    phone_number: '',
    user_role: 'EMPLOYEE',
    role: '', // Job title
    manager: '',
  });

  const [managers, setManagers] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch active employees to populate the manager dropdown
  useEffect(() => {
    const fetchManagers = async (): Promise<void> => {
      try {
        const response = await apiClient.get('/api/v1/employees/');
        // Assume API returns a list of employees. Filter active only if needed, 
        // though /api/v1/employees/ might return all. 
        setManagers(response.data);
      } catch (err) {
        console.error('Failed to load managers', err);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (!formData.first_name || !formData.last_name || !formData.user_role) {
      setError('Name and Role fields are required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        manager: formData.manager ? parseInt(formData.manager, 10) : null,
      };
      await apiClient.post('/api/v1/employees/', payload);
      onSuccess();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { email?: string[], detail?: string, error?: string } } };
      const errMsg = apiError.response?.data?.email?.[0] 
        || apiError.response?.data?.detail 
        || apiError.response?.data?.error
        || 'An error occurred while creating the employee.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Add New Employee</h2>
      </div>
      
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              id="first_name"
              type="text"
              name="first_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              id="last_name"
              type="text"
              name="last_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            id="email"
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user_role" className="block text-sm font-medium text-gray-700 mb-1">System Role *</label>
            <select
              id="user_role"
              name="user_role"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.user_role}
              onChange={handleChange}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Job Title / Role</label>
            <input
              id="role"
              type="text"
              name="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.role}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              id="department"
              type="text"
              name="department"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.department}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              id="phone_number"
              type="tel"
              name="phone_number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">Assigned Manager</label>
          <select
            id="manager"
            name="manager"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.manager}
            onChange={handleChange}
          >
            <option value="">None</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 mt-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
