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
  const [deletingId, setDeletingId] = useState(null);
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
      setNotification({ type: 'error', text: 'Failed to load expense records' });
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
  }, [page, sortBy, sortOrder, selectedCategory, dateFrom, dateTo]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenseList();
  };

  // Sort toggle
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = {};
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
      a.download = `ReceiptAI_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setNotification({ type: 'success', text: 'Excel report downloaded successfully!' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to export expenses to Excel' });
    } finally {
      setIsExporting(false);
    }
  };

  // Edit Expense
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
      verification_status: exp.verification_status || 'verified'
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateExpense(editingExpense.id, editFormData);
      setNotification({ type: 'success', text: 'Expense updated successfully!' });
      setEditingExpense(null);
      fetchExpenseList();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to update expense' });
    }
  };

  // Delete Expense
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await deleteExpense(id);
      setNotification({ type: 'success', text: 'Expense record deleted.' });
      fetchExpenseList();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Failed to delete expense' });
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by merchant name or keyword..."
              className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1 bg-[#1B2A4A] text-white rounded-lg text-xs font-medium hover:bg-navy-700"
            >
              Search
            </button>
          </form>

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
          <div>
            <label className="block text-gray-500 font-medium mb-1">Filter Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1B2A4A]"
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
            <label className="block text-gray-500 font-medium mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-gray-500 font-medium mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
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
              className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 select-none">
              <tr>
                <th
                  onClick={() => toggleSort('receipt_date')}
                  className="px-6 py-3.5 font-semibold cursor-pointer hover:bg-gray-100"
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
                  className="px-6 py-3.5 font-semibold text-right cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {sortBy === 'total_amount' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3.5 font-semibold text-right">VAT</th>
                <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B2A4A]" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No expense records matching the criteria.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                      {exp.receipt_date || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{exp.merchant_name || '—'}</div>
                      {exp.receipt_number && (
                        <div className="text-xs text-gray-400">#{exp.receipt_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {exp.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-gray-900">
                      {formatCurrency(exp.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-gray-500 font-medium">
                      {formatCurrency(exp.vat_amount)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          exp.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : exp.verification_status === 'needs_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
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
                          title="Edit Expense"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete Expense"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing {expenses.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
            {Math.min(page * perPage, totalCount)} of {totalCount} records
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Edit Expense Record</h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Merchant Name</label>
                <input
                  type="text"
                  value={editFormData.merchant_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, merchant_name: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={editFormData.receipt_date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, receipt_date: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={editFormData.receipt_number}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, receipt_number: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, category: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Verification Status</label>
                  <select
                    value={editFormData.verification_status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, verification_status: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="verified">Verified</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Total Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.total_amount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, total_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">VAT Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vat_amount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vat_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">VATable Sales</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vatable_sales}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vatable_sales: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">VAT-Exempt</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vat_exempt_sales}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vat_exempt_sales: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Non-VAT</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.non_vat_sales}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, non_vat_sales: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1B2A4A] text-white rounded-lg text-xs font-semibold hover:bg-navy-700 shadow-sm"
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
