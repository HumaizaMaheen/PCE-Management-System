import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [testLink, setTestLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = await forgotPassword(email);
      setSuccess(true);
      if (data.resetLink) {
        setTestLink(data.resetLink);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FA] px-4 font-inter">
      <div className="max-w-md w-full bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-3">
            <span className="material-icons text-2xl">lock_reset</span>
          </div>
          <h2 className="text-2xl font-bold font-poppins text-primary">Forgot Password</h2>
          <p className="text-xs text-gray-500 text-center mt-1">
            Enter your registered email and we'll log a password reset link for you.
          </p>
        </div>

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
              <span>If your email exists in our records, a reset link has been logged on the backend console.</span>
            </div>

            {testLink && (
              <div className="bg-[#FFF8E1] border border-[#FFE082] text-[#B78103] p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="material-icons text-sm">build</span>
                  <span>Development Mode: Reset Link Generated</span>
                </div>
                <p className="text-[11px] break-all select-all font-mono bg-white/60 p-2 rounded border border-[#FFF8E1] cursor-pointer">
                  {testLink}
                </p>
                <div className="pt-2 text-center">
                  <a 
                    href={testLink}
                    className="inline-block bg-accent hover:bg-accent-dark text-white text-xs font-poppins font-medium px-4 py-2 rounded transition-all duration-200"
                  >
                    Go to Reset Password
                  </a>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <a href="/login" className="text-primary hover:text-primary-light font-poppins text-xs font-medium inline-flex items-center gap-1">
                <span className="material-icons text-xs">arrow_back</span>
                Back to Login
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5 font-poppins">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm">email</span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@pce.org.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F9FBFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-poppins font-medium text-sm py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75"
            >
              {loading ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <a href="/login" className="text-primary hover:text-primary-light font-poppins text-xs font-medium inline-flex items-center gap-1">
                <span className="material-icons text-xs">arrow_back</span>
                Back to Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
