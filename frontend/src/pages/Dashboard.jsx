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
  RefreshCw
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
      setError('Failed to load dashboard metrics. Please ensure the backend is connected.');
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1B2A4A] mb-3" />
        <p className="text-sm font-medium">Loading financial metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchSummary}
          className="mt-4 px-4 py-2 bg-[#1B2A4A] text-white rounded-lg text-sm hover:bg-navy-700"
        >
          Retry
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

  // Find max monthly expense for chart scaling
  const maxMonthVal = Math.max(...monthly_expenses.map((m) => m.total || 0), 1);
  const maxCategoryVal = Math.max(...category_breakdown.map((c) => c.total || 0), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Action */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Financial Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time receipt processing and expense tracking summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/receipts"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#263c63] transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Receipt
          </Link>
          <button
            onClick={fetchSummary}
            title="Refresh Data"
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Monthly Expenses */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Monthly Expenses
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(total_monthly_expenses)}
            </p>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Current billing month
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Receipts Uploaded */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Receipts Uploaded
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{total_receipts}</p>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              Preserved in database
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileImage className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Transactions
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{total_transactions}</p>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-purple-500" />
              Recorded expense rows
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Receipts Pending Review */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending Review
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{pending_review}</p>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Requires manual verification
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Monthly Summary Bar Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expense Summary Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1B2A4A]" />
              <h3 className="font-bold text-gray-900 text-base">Monthly Expense Trend</h3>
            </div>
            <span className="text-xs font-medium text-gray-400">Past 6 Months</span>
          </div>

          {monthly_expenses.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No historical expense data recorded yet.
            </div>
          ) : (
            <div className="h-60 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-gray-100">
              {monthly_expenses.map((m, idx) => {
                const heightPercent = Math.max(Math.round(((m.total || 0) / maxMonthVal) * 100), 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-semibold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₱{Number(m.total || 0).toLocaleString()}
                    </span>
                    <div className="w-full max-w-[48px] bg-gray-100 rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#1B2A4A] group-hover:bg-[#335084] rounded-t-md transition-all duration-500"
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2 font-medium truncate w-full text-center">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-[#1B2A4A]" />
            <h3 className="font-bold text-gray-900 text-base">Category Breakdown</h3>
          </div>

          {category_breakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No expenses categorized yet.
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {category_breakdown.map((cat, idx) => {
                const percent = Math.round(((cat.total || 0) / maxCategoryVal) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700 truncate max-w-[150px]">{cat.category}</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1B2A4A] h-2 rounded-full transition-all duration-500"
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-base">Recent Transactions</h3>
          <Link
            to="/expenses"
            className="text-xs font-semibold text-[#1B2A4A] hover:text-blue-700 flex items-center gap-1"
          >
            View All Expenses
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No recent transactions found. Upload receipts to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Merchant</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-gray-700">
                      {tx.receipt_date || '—'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {tx.merchant_name || 'Unnamed Merchant'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tx.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : tx.verification_status === 'needs_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
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
