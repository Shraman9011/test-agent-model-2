import React, { useState, useEffect } from 'react';
import { apiClient, adjustLeaveBalance } from '../api/client';
import { AlertCircle } from 'lucide-react';

interface LeaveType {
  id: number;
  name: string;
}

interface LeaveBalanceAdjustmentFormProps {
  employeeId: number;
  onSuccess: () => void;
}

export function LeaveBalanceAdjustmentForm({ employeeId, onSuccess }: LeaveBalanceAdjustmentFormProps): React.JSX.Element {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    adjustment_amount: '',
    reason: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLeaveTypes = async (): Promise<void> => {
      try {
        const response = await apiClient.get('/api/v1/leave-policies/') as { data: { is_active: boolean; leave_type: number; leave_type_name: string }[] };
        // We extract leave types from active policies
        const activeTypes = response.data
          .filter((p) => p.is_active)
          .map((p) => ({
            id: p.leave_type,
            name: p.leave_type_name
          }));
        setLeaveTypes(activeTypes);
        if (activeTypes.length > 0) {
          setFormData(prev => ({ ...prev, leave_type_id: activeTypes[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load leave types', err);
      }
    };
    fetchLeaveTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    
    if (!formData.reason.trim()) {
      setError('A reason must be provided for the adjustment.');
      return;
    }

    if (!formData.leave_type_id || !formData.adjustment_amount) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await adjustLeaveBalance({
        employee_id: employeeId,
        leave_type_id: parseInt(formData.leave_type_id),
        adjustment_amount: parseFloat(formData.adjustment_amount),
        reason: formData.reason.trim()
      });
      setFormData(prev => ({ ...prev, adjustment_amount: '', reason: '' }));
      onSuccess();
    } catch (err: unknown) {
      console.error('Adjustment failed', err);
      // Ensure we safely cast error or use default
      const errorObj = err as { response?: { data?: { error?: string; reason?: string[] } } };
      setError(errorObj.response?.data?.error || errorObj.response?.data?.reason?.[0] || 'Failed to adjust balance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Adjust Leave Balance</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manually add or subtract leave days.
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700">Leave Type</label>
            <select
              id="leave_type"
              name="leave_type"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.leave_type_id}
              onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
              required
            >
              {leaveTypes.map(lt => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="adjustment_amount" className="block text-sm font-medium text-gray-700">
              Adjustment Amount (Days)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                name="adjustment_amount"
                id="adjustment_amount"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                placeholder="e.g. 1.5 or -2.0"
                step="0.5"
                value={formData.adjustment_amount}
                onChange={(e) => setFormData({ ...formData, adjustment_amount: e.target.value })}
                required
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">Use negative values to deduct days.</p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              placeholder="Provide a required reason for this adjustment..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !formData.reason.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adjusting...' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
