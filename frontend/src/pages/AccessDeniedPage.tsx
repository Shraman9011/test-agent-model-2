import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function AccessDeniedPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
      <div className="bg-white px-8 py-10 shadow sm:rounded-lg sm:px-12 flex flex-col items-center max-w-md w-full text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 mb-8">
          You do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 items-center transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
