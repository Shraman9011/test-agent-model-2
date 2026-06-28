import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { LeaveBalance } from './LeaveBalances';

interface ApplyLeaveFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApplyLeaveForm({ onSuccess, onCancel }: ApplyLeaveFormProps): React.JSX.Element {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [reason, setReason] = useState('');
  
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchTypes = async (): Promise<void> => {
      try {
        const res = await apiClient.get('/api/leaves/balances');
        if (isMounted) setBalances(res.data);
      } catch (err) {
        if (isMounted) setError("Failed to load leave types.");
      } finally {
        if (isMounted) setLoadingTypes(false);
      }
    };
    fetchTypes();
    return () => { isMounted = false; };
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!leaveType) errors.leave_type = 'Leave type is required';
    if (!startDate) errors.start_date = 'Start date is required';
    if (!endDate) errors.end_date = 'End date is required';
    if (!totalDays || isNaN(Number(totalDays)) || Number(totalDays) <= 0) {
      errors.total_days = 'Valid total days is required';
    }
    if (!reason.trim()) errors.reason = 'Reason is required';

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.end_date = 'End date cannot be before start date';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      await apiClient.post('/api/leaves/', {
        leave_type: parseInt(leaveType),
        start_date: startDate,
        end_date: endDate,
        total_days: Number(totalDays),
        reason
      });
      setSuccess(true);
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      if (errorObj.response && errorObj.response.data) {
        const data = errorObj.response.data;
        if (Array.isArray(data) && data.length > 0) {
          setError(data[0]);
        } else if (typeof data === 'object') {
          if (data.error) setError(data.error);
          else if (data.non_field_errors) setError(data.non_field_errors[0]);
          else {
             const fErrors: Record<string, string> = {};
             Object.keys(data).forEach(key => {
                fErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
             });
             setFieldErrors(fErrors);
             setError("Please correct the errors below.");
          }
        } else {
          setError("Failed to submit leave request.");
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-700 animate-in fade-in">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-medium">Request Submitted Successfully</h3>
        <p className="mt-2 text-sm text-green-600">Your leave request has been sent for approval.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl" data-testid="apply-leave-form">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for Leave</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-start text-sm border border-red-200" role="alert">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
        <select
          id="leaveType"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.leave_type ? 'border-red-300' : 'border-gray-300'}`}
          disabled={loadingTypes}
        >
          <option value="">Select Leave Type...</option>
          {balances.map(b => (
             <option key={b.leave_type.id} value={b.leave_type.id}>{b.leave_type.name} ({parseFloat(b.remaining_days)} days remaining)</option>
          ))}
        </select>
        {fieldErrors.leave_type && <p className="mt-1 text-sm text-red-600">{fieldErrors.leave_type}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.start_date ? 'border-red-300' : 'border-gray-300'}`}
          />
          {fieldErrors.start_date && <p className="mt-1 text-sm text-red-600">{fieldErrors.start_date}</p>}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.end_date ? 'border-red-300' : 'border-gray-300'}`}
          />
          {fieldErrors.end_date && <p className="mt-1 text-sm text-red-600">{fieldErrors.end_date}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="totalDays" className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          id="totalDays"
          value={totalDays}
          onChange={(e) => setTotalDays(e.target.value)}
          placeholder="e.g. 2"
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.total_days ? 'border-red-300' : 'border-gray-300'}`}
        />
        {fieldErrors.total_days && <p className="mt-1 text-sm text-red-600">{fieldErrors.total_days}</p>}
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <textarea
          id="reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.reason ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="Please briefly explain the reason for your leave."
        />
        {fieldErrors.reason && <p className="mt-1 text-sm text-red-600">{fieldErrors.reason}</p>}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Apply Leave'}
        </button>
      </div>
    </form>
  );
}
