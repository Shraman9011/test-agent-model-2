import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { PendingLeaveRequest } from './ManagerPendingRequests';

interface RejectLeaveConfirmationProps {
  leaveRequest: PendingLeaveRequest;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RejectLeaveConfirmation({ leaveRequest, onSuccess, onCancel }: RejectLeaveConfirmationProps): React.JSX.Element {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    if (!reason.trim()) {
      setValidationError('A rejection reason is required.');
      return;
    }
    setValidationError(null);
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/v1/manager/leave-requests/${leaveRequest.id}/reject`, {
        rejection_reason: reason.trim()
      });
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
        setError("Failed to reject leave request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 animate-in fade-in" data-testid="reject-success">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium">Request Rejected Successfully</h3>
        <p className="mt-2 text-sm text-red-600">Decision saved and employee notified via email.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200" data-testid="reject-leave-confirmation">
      <div className="flex flex-col items-center text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reject Leave Request</h3>
        <p className="text-sm text-gray-500 mb-6">
          You are about to reject a leave request from <span className="font-semibold text-gray-700">{leaveRequest.employee.first_name} {leaveRequest.employee.last_name}</span>.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="rejection_reason" className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="rejection_reason"
          rows={3}
          className={`shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border ${validationError ? 'border-red-300' : 'border-gray-300'} rounded-md p-2`}
          placeholder="Please provide a reason for rejection..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (e.target.value.trim()) {
              setValidationError(null);
            }
          }}
          required
        />
        {validationError && (
          <p className="mt-2 text-sm text-red-600">{validationError}</p>
        )}
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
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Rejecting...' : 'Confirm Rejection'}
        </button>
      </div>
    </div>
  );
}
