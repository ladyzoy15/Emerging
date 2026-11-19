import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  RefreshCw,
  Plus,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  getExpenses,
  updateExpense,
  deleteExpense,
  exportExpenses,
  getCategories
} from '../services/api';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([
    'Food and Meals',
    'Transportation',
    'Office Supplies',
    'Utilities',
    'Equipment',
    'Professional Services',
    'Other'
  ]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('receipt_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchExpenseList = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await getExpenses(params);
      setExpenses(res.data.expenses || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to load expense records.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCats = async () => {
    try {
      const res = await getCategories();
      if (res.data?.categories) {
        setCategories(res.data.categories.map((c) => (typeof c === 'string' ? c : c.category_name)));
      }
    } catch (err) {
      console.warn('Could not load categories list:', err);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  useEffect(() => {
    fetchExpenseList();
  }, [page, perPage, selectedCategory, dateFrom, dateTo, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenseList();
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await exportExpenses(params);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resibo_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setNotification({ type: 'success', text: 'Expenses exported to Excel successfully!' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to export expenses.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await deleteExpense(id);
      setNotification({ type: 'success', text: 'Expense record deleted.' });
      fetchExpenseList();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to delete expense record.' });
    }
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setEditFormData({
      merchant_name: exp.merchant_name || '',
      receipt_number: exp.receipt_number || '',
      receipt_date: exp.receipt_date || '',
      category: exp.category || 'Other',
      total_amount: exp.total_amount || 0,
      vat_amount: exp.vat_amount || 0,
      vatable_sales: exp.vatable_sales || 0,
      vat_exempt_sales: exp.vat_exempt_sales || 0,
      non_vat_sales: exp.non_vat_sales || 0,
      verification_status: exp.verification_status || 'unverified'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;
    try {
      await updateExpense(editingExpense.id, editFormData);
      setNotification({ type: 'success', text: 'Expense updated successfully!' });
      setEditingExpense(null);
      fetchExpenseList();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to save updates.' });
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl backdrop-blur-xl flex items-center justify-between text-sm shadow-2xl ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
              : 'bg-red-500/20 text-red-200 border border-red-400/30'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Action Header */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by merchant or keyword..."
              className="w-full pl-10 pr-24 py-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:bg-white/25"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
            >
              Search
            </button>
          </form>

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-emerald-500/20 disabled:opacity-50 transition-all shadow-lg"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export to Excel
          </button>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <label className="block text-white/60 font-medium mb-1">Filter Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs text-gray-800 focus:ring-1 focus:ring-yellow-400/50"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/60 font-medium mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs text-gray-800"
            />
          </div>

          <div>
            <label className="block text-white/60 font-medium mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs text-gray-800"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="w-full py-2 bg-white/20 backdrop-blur border border-white/30 text-white/80 rounded-xl hover:bg-white/30 hover:text-white font-medium transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/50 border-b border-white/10 select-none">
              <tr>
                <th
                  onClick={() => toggleSort('receipt_date')}
                  className="px-6 py-3.5 font-semibold cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Receipt Date
                    {sortBy === 'receipt_date' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3.5 font-semibold">Merchant</th>
                <th className="px-6 py-3.5 font-semibold">Category</th>
                <th
                  onClick={() => toggleSort('total_amount')}
                  className="px-6 py-3.5 font-semibold text-right cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount (₱)
                    {sortBy === 'total_amount' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3.5 font-semibold text-right">12% VAT</th>
                <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-yellow-400" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                    No expense records found matching the criteria.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white/70 font-medium">
                      {exp.receipt_date || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{exp.merchant_name || '—'}</div>
                      {exp.receipt_number && (
                        <div className="text-xs text-white/40">#{exp.receipt_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-white/80">
                        {exp.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-yellow-300">
                      {formatCurrency(exp.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-white/50 font-medium">
                      {formatCurrency(exp.vat_amount)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur ${
                          exp.verification_status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : exp.verification_status === 'needs_review'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-white/10 text-white/60 border border-white/20'
                        }`}
                      >
                        {exp.verification_status === 'verified'
                          ? 'Verified'
                          : exp.verification_status === 'needs_review'
                          ? 'Needs Review'
                          : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="Edit Record"
                          className="p-1.5 text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete Record"
                          className="p-1.5 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>
            Showing {expenses.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
            {Math.min(page * perPage, totalCount)} of {totalCount} records
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl hover:bg-white/30 disabled:opacity-40 text-white/70 transition-all"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-medium text-white/70">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl hover:bg-white/30 disabled:opacity-40 text-white/70 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base">✏️ Edit Expense Record</h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1">Merchant Name</label>
                <input
                  type="text"
                  value={editFormData.merchant_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, merchant_name: e.target.value })
                  }
                  className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={editFormData.receipt_date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, receipt_date: e.target.value })
                    }
                    className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1">Receipt / Invoice #</label>
                  <input
                    type="text"
                    value={editFormData.receipt_number}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, receipt_number: e.target.value })
                    }
                    className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, category: e.target.value })
                    }
                    className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-gray-800"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1">Verification Status</label>
                  <select
                    value={editFormData.verification_status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, verification_status: e.target.value })
                    }
                    className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-gray-800"
                  >
                    <option value="verified">Verified</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 font-medium mb-1">Total Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.total_amount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, total_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm font-semibold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1">12% VAT Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vat_amount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vat_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-white/60 font-medium mb-1">VATable Sales</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vatable_sales}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vatable_sales: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1">VAT-Exempt</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vat_exempt_sales}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vat_exempt_sales: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-medium mb-1">Non-VAT</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.non_vat_sales}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, non_vat_sales: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/30 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-xl text-xs font-bold hover:shadow-xl hover:shadow-yellow-500/20 shadow-lg transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
