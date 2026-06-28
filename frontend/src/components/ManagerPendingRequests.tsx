import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from './Modal';
import { ApproveLeaveConfirmation } from './ApproveLeaveConfirmation';
import { RejectLeaveConfirmation } from './RejectLeaveConfirmation';

export interface PendingLeaveRequest {
  id: number;
  employee: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  leave_type: { id: number; name: string };
  start_date: string;
  end_date: string;
  total_days: string | number;
  reason: string;
  status: 'PENDING';
  applied_at: string;
}

export function ManagerPendingRequests(): React.JSX.Element {
  const [requests, setRequests] = useState<PendingLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PendingLeaveRequest | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const handleApproveSuccess = (): void => {
    if (selectedRequest) {
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
    }
  };

  const handleRejectSuccess = (): void => {
    if (selectedRequest) {
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRequests = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/api/v1/manager/leave-requests/pending');
        if (isMounted) {
          setRequests(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load pending requests. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchRequests();
    return () => { isMounted = false; };
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 flex flex-col items-center justify-center text-red-600">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="pending-requests-skeleton">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-24 bg-amber-100 rounded-full animate-pulse"></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          {requests.length} Action{requests.length !== 1 ? 's' : ''} Needed
        </span>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-12 text-center" data-testid="empty-state">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="mt-1 text-sm text-gray-500">There are no pending leave requests to review.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200" data-testid="pending-requests-list">
          {requests.map(req => (
            <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
                  <h4 className="text-base font-semibold text-gray-900">
                    {req.employee.first_name} {req.employee.last_name}
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {req.leave_type.name}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  <span className="font-medium text-gray-700">{req.start_date}</span> to <span className="font-medium text-gray-700">{req.end_date}</span>
                  <span className="mx-2">•</span>
                  <span>{req.total_days} day{Number(req.total_days) !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 italic">&quot;{req.reason}&quot;</p>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(req);
                    setIsRejectModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  aria-label={`Reject request from ${req.employee.first_name}`}
                >
                  <XCircle className="w-4 h-4 mr-1 text-red-500" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(req);
                    setIsApproveModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  aria-label={`Approve request from ${req.employee.first_name}`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isApproveModalOpen} onClose={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }}>
        {selectedRequest && (
          <ApproveLeaveConfirmation
            leaveRequest={selectedRequest}
            onSuccess={handleApproveSuccess}
            onCancel={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }}
          />
        )}
      </Modal>

      <Modal isOpen={isRejectModalOpen} onClose={() => { setIsRejectModalOpen(false); setSelectedRequest(null); }}>
        {selectedRequest && (
          <RejectLeaveConfirmation
            leaveRequest={selectedRequest}
            onSuccess={handleRejectSuccess}
            onCancel={() => { setIsRejectModalOpen(false); setSelectedRequest(null); }}
          />
        )}
      </Modal>
    </div>
  );
}
