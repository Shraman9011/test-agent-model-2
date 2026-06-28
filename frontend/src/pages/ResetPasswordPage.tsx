import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordPage(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complexity rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const isComplex = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = password !== '' && password === confirmPassword;

  useEffect(() => {
    if (!token || !uid) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token, uid]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!token || !uid) return;

    if (!isComplex) {
      setError('Password does not meet the complexity requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/api/auth/password-reset/confirm', { uid, token, new_password: password });
      // Redirect to login on success (we assume the login page handles success toast natively or we can pass state)
      navigate('/login', { state: { message: 'Password has been reset successfully. Please log in.' } });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      if (errorObj.response && errorObj.response.data && errorObj.response.data.error) {
        setError(errorObj.response.data.error);
      } else {
        setError('Failed to reset password. The token may be expired or invalid.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ComplexityIndicator = ({ met, text }: { met: boolean; text: string }): React.JSX.Element => (
    <div className={`flex items-center text-xs mt-1 ${met ? 'text-green-600' : 'text-gray-500'}`}>
      <span className={`mr-2 h-2 w-2 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`}></span>
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
      <div className="bg-white px-8 py-10 shadow sm:rounded-lg sm:px-12 max-w-md w-full">
        <div className="text-center mb-8">
          <KeyRound className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new, strong password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={!token || !uid}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ComplexityIndicator met={hasMinLength} text="At least 8 characters" />
              <ComplexityIndicator met={hasUppercase} text="One uppercase letter" />
              <ComplexityIndicator met={hasLowercase} text="One lowercase letter" />
              <ComplexityIndicator met={hasNumber} text="One number" />
              <ComplexityIndicator met={hasSpecial} text="One special character" />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={!token || !uid}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                   confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
              />
            </div>
            {confirmPassword && !passwordsMatch && (
               <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={!token || !uid || isSubmitting || !isComplex || !passwordsMatch}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                !token || !uid || isSubmitting || !isComplex || !passwordsMatch
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
