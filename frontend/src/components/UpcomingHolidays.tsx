import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AlertCircle, Calendar } from 'lucide-react';

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description: string;
}

export function UpcomingHolidays(): React.JSX.Element {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHolidays = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/holidays');
        if (isMounted) {
          // Ensure they are sorted chronologically just in case the backend didn't sort them
          const sorted = response.data.sort((a: Holiday, b: Holiday) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setHolidays(sorted);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load upcoming holidays.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchHolidays();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
          Upcoming Holidays
        </h3>
      </div>
      <div className="p-6 flex-1 overflow-y-auto max-h-96">
        {loading ? (
          <div data-testid="holiday-skeleton" className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start text-red-600">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No upcoming company holidays remaining for this year.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {holidays.map((holiday) => {
              const holidayDate = new Date(holiday.date);
              const month = holidayDate.toLocaleString('default', { month: 'short' });
              const day = holidayDate.getDate();
              
              return (
                <li key={holiday.id} className="py-4 flex items-center first:pt-0 last:pb-0">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-700 rounded-lg mr-4 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase">{month}</span>
                    <span className="text-lg font-bold leading-none">{day}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{holiday.name}</h4>
                    {holiday.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{holiday.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
