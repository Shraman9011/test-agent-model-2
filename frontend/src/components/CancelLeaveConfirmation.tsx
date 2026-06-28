import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { LeaveRequest } from './LeaveHistory';

interface CancelLeaveConfirmationProps {
  leaveRequest: LeaveRequest;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CancelLeaveConfirmation({ leaveRequest, onSuccess, onCancel }: CancelLeaveConfirmationProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/leaves/${leaveRequest.id}/cancel/`);
      setSuccess(true);
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      if (errorObj.response && errorObj.response.data && errorObj.response.data.error) {
        setError(errorObj.response.data.error);
      } else {
        setError("Failed to cancel leave request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-700 animate-in fade-in" data-testid="cancel-success">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-medium">Request Cancelled Successfully</h3>
        <p className="mt-2 text-sm text-green-600">The leave request has been cancelled and balances restored.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200" data-testid="cancel-leave-confirmation">
      <div className="flex flex-col items-center text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cancel Leave Request</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to cancel your leave request from <span className="font-semibold text-gray-700">{leaveRequest.start_date}</span> to <span className="font-semibold text-gray-700">{leaveRequest.end_date}</span>? This action cannot be undone.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-start text-sm border border-red-200 mb-4">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-center space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={loading}
          >
            Keep Request
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Cancelling...' : 'Yes, Cancel Request'}
        </button>
      </div>
    </div>
  );
}
