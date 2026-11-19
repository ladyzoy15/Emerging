import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanLine, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { register } from '../services/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C3547] via-[#1A5276] to-[#FFC107] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-poppins">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-white/10 text-6xl select-none pointer-events-none animate-pulse">☀️</div>
      <div className="absolute top-1/4 right-16 text-white/10 text-4xl select-none pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-20 left-20 text-white/10 text-5xl select-none pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}>⭐</div>
      <div className="absolute bottom-1/3 right-10 text-white/10 text-3xl select-none pointer-events-none animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>

      {/* Glassmorphism card */}
      <div className="max-w-md w-full space-y-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 relative z-10">
        {/* Logo & Branding */}
        <div className="text-center">
          <div className="text-5xl mb-2">🧾</div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Resibo
          </h2>
          <div className="flex justify-center items-center gap-1 mt-1 text-yellow-400 text-lg">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
          <p className="mt-3 text-sm text-white/80">
            Create an account to start scanning receipts and tracking expenses
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl flex items-center gap-2 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-white/50 transition-all"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-white/50 transition-all"
                placeholder="you@company.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-white/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-white/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-[#0C3547] bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-60 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Login link */}
        <div className="text-center pt-2">
          <p className="text-sm text-white/70">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-yellow-300 hover:text-yellow-200 underline transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
