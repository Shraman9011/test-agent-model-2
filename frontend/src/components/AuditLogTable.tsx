import React, { useState, useEffect, useCallback } from 'react';
import { getLeaveAdjustmentLogs } from '../api/client';
import { Clock } from 'lucide-react';

interface AuditLog {
  id: number;
  leave_type: number;
  adjustment_amount: string;
  previous_balance: string;
  new_balance: string;
  reason: string;
  timestamp: string;
  employee: number;
}

interface AuditLogTableProps {
  employeeId: number;
}

export function AuditLogTable({ employeeId }: AuditLogTableProps): React.JSX.Element {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLeaveAdjustmentLogs(employeeId);
      // Ensure it's an array (handles pagination if exists)
      const data = response.results || response;
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            Adjustment History
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Audit log of manual leave balance adjustments.
          </p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-b border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balances
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        Loading history...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 flex flex-col items-center">
                        <Clock className="h-8 w-8 text-gray-300 mb-2" />
                        No adjustment history found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleDateString()}
                          <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.leave_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={parseFloat(log.adjustment_amount) >= 0 ? "text-green-600" : "text-red-600"}>
                            {parseFloat(log.adjustment_amount) > 0 ? '+' : ''}{parseFloat(log.adjustment_amount).toString()} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="line-through mr-1">{parseFloat(log.previous_balance).toString()}</span> &rarr; <span className="ml-1 font-medium text-gray-900">{parseFloat(log.new_balance).toString()}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.reason}>
                          {log.reason}
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
    </div>
  );
}
