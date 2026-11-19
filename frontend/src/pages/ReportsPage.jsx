import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Info
} from 'lucide-react';
import { getTaxSummary, exportTaxSummary, exportExpenses } from '../services/api';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloadingSummary, setDownloadingSummary] = useState(false);
  const [downloadingExpenses, setDownloadingExpenses] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await getTaxSummary(params);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate tax summary data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportTaxSummary = async () => {
    setDownloadingSummary(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await exportTaxSummary(params);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReceiptAI_Tax_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to export Tax Summary');
    } finally {
      setDownloadingSummary(false);
    }
  };

  const handleExportExpenses = async () => {
    setDownloadingExpenses(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await exportExpenses(params);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReceiptAI_Full_Expense_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to export expenses');
    } finally {
      setDownloadingExpenses(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const {
    total_expenses = 0,
    total_vat = 0,
    vatable_sales = 0,
    vat_exempt_sales = 0,
    non_vat_sales = 0,
    receipt_count = 0
  } = data || {};

  return (
    <div className="space-y-8">
      {/* Header and Filter */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tax Preparation Summary</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of recorded VATable, VAT-exempt, and non-VAT purchases for accounting
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-gray-500 font-medium">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-gray-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-gray-500 font-medium">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-gray-800 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchSummary}
            className="px-4 py-2 bg-[#1B2A4A] text-white rounded-xl text-xs font-semibold hover:bg-navy-700 transition-colors"
          >
            Apply
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setTimeout(fetchSummary, 0);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tax Metric Cards */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1B2A4A] mb-2" />
          <p className="text-sm font-medium">Calculating tax breakdown...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Total Recorded Expenses */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Recorded Expenses
              </span>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(total_expenses)}</p>
              <p className="text-xs text-gray-400 mt-1">Gross expenses recorded in database</p>
            </div>
          </div>

          {/* Total VAT Recorded */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total VAT Recorded
              </span>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-indigo-900">{formatCurrency(total_vat)}</p>
              <p className="text-xs text-gray-400 mt-1">Input VAT from verified & scanned receipts</p>
            </div>
          </div>

          {/* Number of Receipts */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Processed Receipts
              </span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-emerald-900">{receipt_count}</p>
              <p className="text-xs text-gray-400 mt-1">Supporting receipt documents uploaded</p>
            </div>
          </div>

          {/* VATable Sales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                VATable Purchases
              </span>
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(vatable_sales)}</p>
              <p className="text-xs text-gray-400 mt-1">Net amount subject to 12% standard VAT</p>
            </div>
          </div>

          {/* VAT-Exempt Sales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                VAT-Exempt Purchases
              </span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(vat_exempt_sales)}</p>
              <p className="text-xs text-gray-400 mt-1">Purchases legally exempt from VAT</p>
            </div>
          </div>

          {/* Non-VAT Sales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Non-VAT / Zero-Rated
              </span>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(non_vat_sales)}</p>
              <p className="text-xs text-gray-400 mt-1">Purchases without VAT or registered non-VAT</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Action Center */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Export Accounting Files</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Download organized XLSX files compatible with Microsoft Excel, Google Sheets, or accountant software.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTaxSummary}
            disabled={downloadingSummary}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B2A4A] text-white rounded-xl text-sm font-semibold hover:bg-[#263c63] disabled:opacity-50 transition-colors shadow-sm"
          >
            {downloadingSummary ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Tax Summary
          </button>

          <button
            onClick={handleExportExpenses}
            disabled={downloadingExpenses}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {downloadingExpenses ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export All Records
          </button>
        </div>
      </div>

      {/* Mandatory Regulatory / Tax Disclaimer */}
      <div className="bg-blue-50/70 border-l-4 border-blue-600 p-5 rounded-r-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold text-sm">Official Regulatory & Compliance Notice</p>
          <p>
            This system is intended to organize accounting records and assist business owners and freelancers with tax preparation.
            <strong> It does not claim automatic BIR compliance, official BIR accreditation, or automatic tax filing.</strong>
          </p>
          <p>
            Always preserve the original physical or digital receipt images, and consult a qualified Certified Public Accountant (CPA) or tax professional for statutory declarations and official tax returns.
          </p>
        </div>
      </div>
    </div>
  );
}
