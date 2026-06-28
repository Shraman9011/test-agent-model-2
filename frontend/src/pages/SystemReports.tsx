import React from 'react';
import { FileText, Download, Clock } from 'lucide-react';

export function SystemReports(): React.JSX.Element {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-indigo-500" />
            System Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Export organization-wide leave data and audit logs.
          </p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden p-12 text-center border-t-4 border-indigo-500">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
          <Clock className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Reports Module Under Development</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          The comprehensive reporting module is currently being built in a subsequent feature iteration. 
          Soon you will be able to export organization-wide leave balances, audit logs, and utilization metrics in CSV and PDF formats.
        </p>
        
        <button 
          disabled
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-400 cursor-not-allowed"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Sample Report
        </button>
      </div>
    </div>
  );
}
