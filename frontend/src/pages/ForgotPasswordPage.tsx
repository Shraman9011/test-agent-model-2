import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // POST to backend API
      await apiClient.post('/api/auth/password-reset', { email });
      // Generic success message regardless of actual email existence
      setIsSuccess(true);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errObj = err as any;
      // Always show success to prevent email enumeration attacks,
      // but if the network fails completely, we can show an error.
      if (errObj.response && errObj.response.status >= 400 && errObj.response.status < 500) {
         // It's safer to always show success for 400/404 as well
         setIsSuccess(true);
      } else {
         setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
        <div className="bg-white px-8 py-10 shadow sm:rounded-lg sm:px-12 flex flex-col items-center max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-6" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-8">
            If an account exists for {email}, you will receive a password reset link shortly.
          </p>
          <Link
            to="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
      <div className="bg-white px-8 py-10 shadow sm:rounded-lg sm:px-12 max-w-md w-full">
        <div className="text-center mb-8">
          <Mail className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Sending link...' : 'Send reset link'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 text-sm">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
