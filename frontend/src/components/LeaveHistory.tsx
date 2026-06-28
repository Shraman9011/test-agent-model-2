import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle, Edit2, XCircle } from 'lucide-react';
import { Modal } from './Modal';
import { EditLeaveForm } from './EditLeaveForm';
import { CancelLeaveConfirmation } from './CancelLeaveConfirmation';

export interface LeaveRequest {
  id: number;
  leave_type: { id: number; name: string };
  start_date: string;
  end_date: string;
  total_days: string | number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  applied_at: string;
  manager_comments?: string;
  rejection_reason?: string;
}

interface LeaveHistoryProps {
  onStateChange?: () => void;
}

export function LeaveHistory({ onStateChange }: LeaveHistoryProps = {}): React.JSX.Element {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState<LeaveRequest | null>(null);

  const fetchHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/leaves/history');
      setRequests(response.data);
    } catch (err) {
      setError('Unable to fetch your leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleEditSuccess = (): void => {
    setEditingRequest(null);
    fetchHistory();
    if (onStateChange) onStateChange();
  };

  const handleCancelSuccess = (): void => {
    setCancellingRequest(null);
    fetchHistory();
    if (onStateChange) onStateChange();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full animate-pulse p-6">
         <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
         <div className="space-y-3">
           <div className="h-10 bg-gray-200 rounded"></div>
           <div className="h-10 bg-gray-200 rounded"></div>
         </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start text-red-600 h-full">
        <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Leave Requests</h3>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-6 text-center text-gray-500 flex-1 flex flex-col justify-center items-center min-h-[200px]">
          <p>No recent requests to display.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => {
                const isFutureRequest = new Date(req.start_date) > new Date();
                const canCancel = req.status === 'PENDING' || (req.status === 'APPROVED' && isFutureRequest);
                
                return (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {req.leave_type.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.start_date} to {req.end_date} <span className="text-xs text-gray-400 block">{req.total_days} days</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      req.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      {req.status === 'PENDING' ? (
                        <button 
                          onClick={() => setEditingRequest(req)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          aria-label="Edit Request"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      ) : (
                        <span className="text-gray-300 inline-flex items-center" title="Only pending requests can be edited">
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </span>
                      )}
                      
                      {canCancel ? (
                        <button 
                          onClick={() => setCancellingRequest(req)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          aria-label="Cancel Request"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-gray-300 inline-flex items-center" title="Request cannot be cancelled">
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={editingRequest !== null} onClose={() => setEditingRequest(null)}>
        {editingRequest && (
          <EditLeaveForm 
            leaveRequest={editingRequest} 
            onSuccess={handleEditSuccess} 
            onCancel={() => setEditingRequest(null)} 
          />
        )}
      </Modal>

      <Modal isOpen={cancellingRequest !== null} onClose={() => setCancellingRequest(null)}>
        {cancellingRequest && (
          <CancelLeaveConfirmation 
            leaveRequest={cancellingRequest} 
            onSuccess={handleCancelSuccess} 
            onCancel={() => setCancellingRequest(null)} 
          />
        )}
      </Modal>
    </div>
  );
}
