/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle, Edit2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Filters and Pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  const [leaveTypes, setLeaveTypes] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaveTypes = async (): Promise<void> => {
      try {
        const res = await apiClient.get('/api/leaves/balances');
        if (isMounted) {
          const types = res.data.map((b: any) => b.leave_type);
          setLeaveTypes(types);
        }
      } catch (err) {
        // silently ignore type fetch error
      }
    };
    fetchLeaveTypes();
    return () => { isMounted = false; };
  }, []);

  const fetchHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (leaveTypeFilter) params.append('leave_type', leaveTypeFilter);
      params.append('page', currentPage.toString());
      
      const response = await apiClient.get(`/api/leaves/history?${params.toString()}`);
      
      if (response.data && response.data.results) {
        setRequests(response.data.results);
        const count = response.data.count || 0;
        setTotalPages(Math.ceil(count / 10) || 1);
      } else {
        setRequests(response.data || []);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Unable to fetch your leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, leaveTypeFilter, currentPage]);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Leave Requests</h3>
        
        <div className="flex space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-300 rounded-md shadow-sm px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500"
            aria-label="Filter by Status"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <select 
            value={leaveTypeFilter}
            onChange={(e) => { setLeaveTypeFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-300 rounded-md shadow-sm px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500"
            aria-label="Filter by Leave Type"
          >
            <option value="">All Types</option>
            {leaveTypes.map(t => (
              <option key={t.id} value={t.id.toString()}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {error && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start text-red-600">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-gray-500 flex-1 flex flex-col justify-center items-center min-h-[200px] animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3 w-full max-w-md">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-6 text-center text-gray-500 flex-1 flex flex-col justify-center items-center min-h-[200px]">
          <p>No requests found matching your filters.</p>
        </div>
      ) : (
        <>
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
          
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
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
