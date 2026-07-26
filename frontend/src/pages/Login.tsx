import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      await login(email, password, rememberMe);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-inter bg-background">
      {/* Left Column: Branding / Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/10 rounded-full translate-x-24 -translate-y-24"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full -translate-x-24 translate-y-24"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white text-primary rounded-lg flex items-center justify-center font-bold font-poppins text-lg shadow-sm">
            PCE
          </div>
          <div>
            <h1 className="text-base font-bold font-poppins leading-tight text-white">Pakistan Chamber of Education</h1>
            <p className="text-[10px] text-[#A3D2C6] font-medium tracking-wide uppercase">Division Bahawalpur</p>
          </div>
        </div>

        {/* Hero Message */}
        <div className="space-y-6 max-w-md relative z-10">
          <h2 className="text-4xl font-extrabold font-poppins leading-tight">
            Chamber Management & Finance Portal
          </h2>
          <p className="text-sm text-[#A3D2C6] leading-relaxed">
            Access the official ERP workspace. Verify member credentials, review outstanding monthly challans, manage documents, and audit ledger entries.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#A3D2C6] pt-2">
            <div className="flex items-center gap-1">
              <span className="material-icons text-sm text-accent">verified</span>
              <span>Secure JWT</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-sm text-accent">gpp_good</span>
              <span>RBAC Protected</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-sm text-accent">account_balance</span>
              <span>Audit Ready</span>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="text-[11px] text-[#A3D2C6] relative z-10">
          &copy; {new Date().getFullYear()} Pakistan Chamber of Education (PCE). All rights reserved.
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-left">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold font-poppins text-lg shadow-sm">
                PCE
              </div>
              <div>
                <h1 className="text-sm font-bold font-poppins text-primary leading-tight">Pakistan Chamber of Education</h1>
                <p className="text-[9px] text-gray-500 font-medium tracking-wide uppercase">Division Bahawalpur</p>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold font-poppins text-[#333333]">Sign In</h2>
            <p className="text-sm text-gray-500 mt-2">Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div className="bg-danger/5 border border-danger/20 text-danger text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="material-icons text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-600 font-poppins">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-light font-medium font-poppins">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm">lock</span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F9FBFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-xs text-gray-600 font-medium">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-poppins font-medium text-sm py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-icons text-sm">login</span>
                </>
              )}
            </button>
          </form>

          {/* Test Accounts Tip */}
          <div className="bg-[#F0F4F2] border border-primary/10 p-4 rounded-lg text-xs space-y-1.5 text-primary-dark">
            <div className="font-semibold flex items-center gap-1">
              <span className="material-icons text-sm">lightbulb</span>
              <span>Dev Credentials:</span>
            </div>
            <div>
              <strong>Super Admin</strong>: <code>admin@pce.org.pk</code> / <code>AdminPCE@2026</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
