import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      setError('Invalid or missing parameters. Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(password, email, token);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FA] px-4 font-inter">
      <div className="max-w-md w-full bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-3">
            <span className="material-icons text-2xl">password</span>
          </div>
          <h2 className="text-2xl font-bold font-poppins text-primary">Reset Password</h2>
          <p className="text-xs text-gray-500 text-center mt-1">
            Choose a strong new password for your account.
          </p>
        </div>

        {(!token || !email) && !success && (
          <div className="bg-danger/5 border border-danger/20 text-danger text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="material-icons text-sm">warning</span>
            <span>Invalid reset URL. Please request a new forgot password link.</span>
          </div>
        )}

        {error && (
          <div className="bg-danger/5 border border-danger/20 text-danger text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="material-icons text-sm">error</span>
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="bg-success/5 border border-success/20 text-success text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="material-icons text-sm">check_circle</span>
              <span>Your password has been reset successfully! Redirecting you to login...</span>
            </div>
            <div className="text-center pt-2">
              <Link to="/login" className="text-primary font-poppins text-xs font-semibold">
                Click here if you are not redirected
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pass" className="block text-xs font-semibold text-gray-600 mb-1.5 font-poppins">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm">lock</span>
                <input
                  id="pass"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F9FBFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPass" className="block text-xs font-semibold text-gray-600 mb-1.5 font-poppins">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm">lock</span>
                <input
                  id="confirmPass"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F9FBFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token || !email}
              className="w-full bg-primary hover:bg-primary-light text-white font-poppins font-medium text-sm py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span>Resetting...</span>
              ) : (
                <>
                  <span>Reset Password</span>
                  <span className="material-icons text-sm">check</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-primary hover:text-primary-light font-poppins text-xs font-medium inline-flex items-center gap-1">
                <span className="material-icons text-xs">arrow_back</span>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
