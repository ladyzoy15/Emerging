import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileImage,
  Receipt,
  AlertCircle,
  Upload,
  ArrowRight,
  TrendingUp,
  Tag,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Coins
} from 'lucide-react';
import { getDashboardSummary } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardSummary();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 flex flex-col items-center shadow-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-400 mb-3" />
          <p className="text-sm font-medium text-white/80">Calculating your financial metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 backdrop-blur-xl border border-red-400/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
        <p className="font-semibold text-red-200">{error}</p>
        <button
          onClick={fetchSummary}
          className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-xl text-sm font-semibold hover:shadow-xl hover:shadow-yellow-500/20 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    total_monthly_expenses = 0,
    total_receipts = 0,
    total_transactions = 0,
    pending_review = 0,
    monthly_expenses = [],
    recent_transactions = [],
    category_breakdown = []
  } = data || {};

  const maxMonthVal = Math.max(...monthly_expenses.map((m) => m.total || 0), 1);
  const maxCategoryVal = Math.max(...category_breakdown.map((c) => c.total || 0), 1);

  return (
    <div className="space-y-6 font-poppins">
      {/* Top Banner with Quick Action */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📊</span> Financial Overview &amp; Analytics
          </h2>
          <p className="text-sm text-white/70 mt-0.5">
            Real-time receipt processing, line item extraction, and expense breakdown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/receipts"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:shadow-xl hover:shadow-yellow-500/25 transition-all shadow-lg"
          >
            <Upload className="w-4 h-4" />
            Scan / Upload Receipt
          </Link>
          <button
            onClick={fetchSummary}
            title="Refresh Data"
            className="p-2.5 bg-white/20 backdrop-blur border border-white/30 text-white/80 hover:text-white hover:bg-white/30 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Monthly Expenses */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl flex items-start justify-between group hover:bg-white/15 transition-all hover:shadow-blue-500/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Total Expenses
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {formatCurrency(total_monthly_expenses)}
            </p>
            <p className="mt-1 text-xs text-white/50 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Current billing month
            </p>
          </div>
          <div className="p-3 bg-blue-500/20 backdrop-blur text-blue-300 rounded-xl border border-blue-400/20">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Total Receipts Uploaded */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl flex items-start justify-between group hover:bg-white/15 transition-all hover:shadow-emerald-500/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Receipt Documents
            </p>
            <p className="mt-2 text-2xl font-black text-white">{total_receipts}</p>
            <p className="mt-1 text-xs text-white/50 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Stored in database
            </p>
          </div>
          <div className="p-3 bg-emerald-500/20 backdrop-blur text-emerald-300 rounded-xl border border-emerald-400/20">
            <FileImage className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl flex items-start justify-between group hover:bg-white/15 transition-all hover:shadow-purple-500/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Transactions
            </p>
            <p className="mt-2 text-2xl font-black text-white">{total_transactions}</p>
            <p className="mt-1 text-xs text-white/50 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              Recorded expenses
            </p>
          </div>
          <div className="p-3 bg-purple-500/20 backdrop-blur text-purple-300 rounded-xl border border-purple-400/20">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Receipts Pending Review */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl flex items-start justify-between group hover:bg-white/15 transition-all hover:shadow-amber-500/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Needs Review
            </p>
            <p className="mt-2 text-2xl font-black text-amber-300">{pending_review}</p>
            <p className="mt-1 text-xs text-white/50 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Requires verification
            </p>
          </div>
          <div className="p-3 bg-amber-500/20 backdrop-blur text-amber-300 rounded-xl border border-amber-400/20">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Monthly Summary Bar Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expense Summary Chart */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white text-base">Monthly Expense Trend</h3>
            </div>
            <span className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-white/70">
              Past 6 Months
            </span>
          </div>

          {monthly_expenses.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-white/40 text-sm">
              No expense data recorded yet.
            </div>
          ) : (
            <div className="h-60 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-white/10">
              {monthly_expenses.map((m, idx) => {
                const heightPercent = Math.max(Math.round(((m.total || 0) / maxMonthVal) * 100), 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-semibold text-yellow-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₱{Number(m.total || 0).toLocaleString()}
                    </span>
                    <div className="w-full max-w-[48px] bg-white/5 rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-yellow-500 group-hover:from-blue-500 group-hover:to-yellow-400 rounded-t-md transition-all duration-500 shadow-lg shadow-blue-500/20"
                      />
                    </div>
                    <span className="text-xs text-white/50 mt-2 font-medium truncate w-full text-center">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white text-base">Expense Categories</h3>
          </div>

          {category_breakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
              No categorized expenses yet.
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {category_breakdown.map((cat, idx) => {
                const percent = Math.round(((cat.total || 0) / maxCategoryVal) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/70 truncate max-w-[150px]">{cat.category}</span>
                      <span className="text-yellow-300 font-semibold">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Recent Transactions</h3>
          <Link
            to="/expenses"
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors"
          >
            View All Expenses
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">
            No recent transactions. Upload or scan a receipt to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Merchant</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount (₱)</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-white/70">
                      {tx.receipt_date || '—'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white whitespace-nowrap">
                      {tx.merchant_name || 'Unnamed Merchant'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-white/80">
                        {tx.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-yellow-300 whitespace-nowrap">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur ${
                          tx.verification_status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : tx.verification_status === 'needs_review'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-white/10 text-white/60 border border-white/20'
                        }`}
                      >
                        {tx.verification_status === 'verified'
                          ? 'Verified'
                          : tx.verification_status === 'needs_review'
                          ? 'Needs Review'
                          : 'Unverified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
