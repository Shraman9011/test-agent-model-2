import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200';
  const Icon = type === 'success' ? CheckCircle : XCircle;
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 mb-4 border rounded-lg shadow-sm animate-in slide-in-from-bottom-5 ${bgColor}`} role="alert">
      <Icon className={`w-5 h-5 mr-3 ${iconColor}`} />
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        type="button" 
        className="ml-4 -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-black/5 inline-flex h-8 w-8 text-current" 
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
