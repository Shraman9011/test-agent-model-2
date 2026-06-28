import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle } from 'lucide-react';

export interface LeaveType {
  id: number;
  name: string;
  description: string;
  max_days_per_year: string;
}

export interface LeaveBalance {
  id: number;
  leave_type: LeaveType;
  year: number;
  allocated_days: string;
  used_days: string;
  pending_days: string;
  remaining_days: string;
}

export function LeaveBalances(): React.JSX.Element {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBalances = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/leaves/balances');
        if (isMounted) {
          setBalances(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to fetch your leave balances. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchBalances();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div data-testid="skeleton-loader" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start text-red-600">
        <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
        <p>No leave balances found for the current year.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {balances.map((balance) => {
        const remaining = parseFloat(balance.remaining_days);
        const allocated = parseFloat(balance.allocated_days);
        const percentage = allocated > 0 ? (remaining / allocated) * 100 : 0;
        
        let colorClass = 'bg-blue-600';
        if (percentage <= 20) colorClass = 'bg-red-600';
        else if (percentage <= 50) colorClass = 'bg-amber-500';
        else if (percentage >= 80) colorClass = 'bg-green-500';

        return (
          <div key={balance.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{balance.leave_type.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">
              {remaining} <span className="text-lg text-gray-500 font-normal">days left</span>
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${colorClass}`} 
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{parseFloat(balance.used_days) + parseFloat(balance.pending_days)} used/pending</span>
              <span>{allocated} total</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
