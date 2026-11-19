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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200/80">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#1B2A4A] text-white flex items-center justify-center rounded-xl shadow-md">
            <ScanLine className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">Create an Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Start scanning receipts and organizing expenses with ReceiptAI
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white transition-colors"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white transition-colors"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#1B2A4A] hover:bg-[#263c63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B2A4A] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#1B2A4A] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
