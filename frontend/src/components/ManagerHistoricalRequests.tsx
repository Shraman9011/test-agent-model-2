import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { PendingLeaveRequest } from './ManagerPendingRequests'; // reusing the type for now

interface HistoricalLeaveRequest extends Omit<PendingLeaveRequest, 'status'> {
  status: 'APPROVED' | 'REJECTED';
  reviewed_at: string;
  rejection_reason?: string;
  manager_comments?: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HistoricalLeaveRequest[];
}

export function ManagerHistoricalRequests(): React.JSX.Element {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<PaginatedResponse>(`/api/v1/manager/leave-requests/history?page=${page}`);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load historical requests. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [page]);

  const handleNextPage = (): void => {
    if (data?.next) setPage(p => p + 1);
  };

  const handlePrevPage = (): void => {
    if (data?.previous) setPage(p => Math.max(1, p - 1));
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 flex flex-col items-center justify-center text-red-600 mt-6">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const renderStatusBadge = (status: string): React.JSX.Element => {
    if (status === 'APPROVED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Historical Requests</h3>
      </div>
      
      {loading && !data ? (
        <div className="p-6 space-y-4" data-testid="historical-requests-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : data?.results.length === 0 ? (
        <div className="p-12 text-center" data-testid="empty-state">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No History</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't reviewed any requests yet.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-200" data-testid="historical-requests-list">
            {data?.results.map(req => (
              <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
                    <h4 className="text-base font-semibold text-gray-900">
                      {req.employee.first_name} {req.employee.last_name}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {req.leave_type.name}
                    </span>
                    <span className="sm:hidden ml-auto">
                      {renderStatusBadge(req.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    <span className="font-medium text-gray-700">{req.start_date}</span> to <span className="font-medium text-gray-700">{req.end_date}</span>
                    <span className="mx-2">•</span>
                    <span>{req.total_days} day{Number(req.total_days) !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Reason: {req.reason}
                  </p>
                  {req.status === 'REJECTED' && req.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1 font-medium">
                      Rejection Reason: {req.rejection_reason}
                    </p>
                  )}
                  {req.status === 'APPROVED' && req.manager_comments && (
                    <p className="text-sm text-gray-600 mt-1">
                      Manager Note: {req.manager_comments}
                    </p>
                  )}
                </div>
                <div className="hidden sm:block shrink-0">
                  {renderStatusBadge(req.status)}
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {data && data.count > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between" data-testid="pagination-controls">
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{page}</span>
              </p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={!data.previous || loading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!data.next || loading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
