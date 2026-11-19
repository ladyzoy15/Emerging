import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Coins
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
      setError('Unable to calculate tax summary data.');
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
      a.download = `Resibo_Tax_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to export Tax Summary.');
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
      a.download = `Resibo_Full_Expense_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to export expenses.');
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
    <div className="space-y-8 font-poppins">
      {/* Header and Filter */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📊</span> Tax &amp; Financial Summary
          </h2>
          <p className="text-sm text-white/70 mt-0.5">
            Breakdown of VATable, VAT-exempt, and non-VAT transactions in Philippine Peso (₱)
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur border border-white/30 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-white/60 font-medium">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-gray-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur border border-white/30 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-white/60 font-medium">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-gray-800 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchSummary}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-xl text-xs font-bold hover:shadow-xl hover:shadow-yellow-500/20 transition-all shadow-lg"
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
              className="px-3 py-2 bg-white/20 backdrop-blur border border-white/30 text-white/80 rounded-xl text-xs font-medium hover:bg-white/30 hover:text-white transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tax Metric Cards */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 inline-flex flex-col items-center shadow-2xl">
            <RefreshCw className="w-8 h-8 animate-spin text-yellow-400 mb-2" />
            <p className="text-sm font-medium text-white/70">Calculating tax breakdown...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Total Recorded Expenses */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between group hover:bg-white/15 transition-all hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Total Expenses
              </span>
              <div className="p-2.5 bg-blue-500/20 backdrop-blur text-blue-300 rounded-xl border border-blue-400/20">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-white">{formatCurrency(total_expenses)}</p>
              <p className="text-xs text-white/40 mt-1">Gross expenses recorded in database</p>
            </div>
          </div>

          {/* Total VAT Recorded */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between group hover:bg-white/15 transition-all hover:shadow-indigo-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Total 12% Input VAT
              </span>
              <div className="p-2.5 bg-indigo-500/20 backdrop-blur text-indigo-300 rounded-xl border border-indigo-400/20">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-indigo-300">{formatCurrency(total_vat)}</p>
              <p className="text-xs text-white/40 mt-1">Input VAT from verified receipt records</p>
            </div>
          </div>

          {/* Number of Receipts */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between group hover:bg-white/15 transition-all hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Processed Receipts
              </span>
              <div className="p-2.5 bg-emerald-500/20 backdrop-blur text-emerald-300 rounded-xl border border-emerald-400/20">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-emerald-300">{receipt_count}</p>
              <p className="text-xs text-white/40 mt-1">Receipt documents analyzed</p>
            </div>
          </div>

          {/* VATable Sales */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between group hover:bg-white/15 transition-all hover:shadow-sky-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                VATable Purchases
              </span>
              <div className="p-2.5 bg-sky-500/20 backdrop-blur text-sky-300 rounded-xl border border-sky-400/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{formatCurrency(vatable_sales)}</p>
              <p className="text-xs text-white/40 mt-1">Net amount subject to 12% standard VAT</p>
            </div>
          </div>

          {/* VAT-Exempt Sales */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between group hover:bg-white/15 transition-all hover:shadow-amber-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                VAT-Exempt Purchases
              </span>
              <div className="p-2.5 bg-amber-500/20 backdrop-blur text-amber-300 rounded-xl border border-amber-400/20">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{formatCurrency(vat_exempt_sales)}</p>
              <p className="text-xs text-white/40 mt-1">Purchases legally exempt from VAT</p>
            </div>
          </div>

          {/* Non-VAT Sales */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between group hover:bg-white/15 transition-all hover:shadow-purple-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Non-VAT / Zero-Rated
              </span>
              <div className="p-2.5 bg-purple-500/20 backdrop-blur text-purple-300 rounded-xl border border-purple-400/20">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{formatCurrency(non_vat_sales)}</p>
              <p className="text-xs text-white/40 mt-1">Purchases without VAT or non-VAT registered</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Action Center */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-base">Download Accounting Reports</h3>
          <p className="text-xs text-white/60 mt-0.5">
            Download XLSX spreadsheets compatible with Microsoft Excel, Google Sheets, or accounting software.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTaxSummary}
            disabled={downloadingSummary}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-yellow-500/20 disabled:opacity-50 transition-all shadow-lg"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-emerald-500/20 disabled:opacity-50 transition-all shadow-lg"
          >
            {downloadingExpenses ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export All Expenses
          </button>
        </div>
      </div>

      {/* Regulatory / Compliance Notice */}
      <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-5 shadow-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-200/80 space-y-1">
          <p className="font-bold text-sm text-blue-200">Compliance &amp; Advisory Notice</p>
          <p>
            This system helps organize receipt documentation and assist in tax preparation for businesses and freelancers.
            <strong> It is an internal ledger tool and does not replace official tax filings.</strong>
          </p>
          <p>
            Always maintain your physical or original electronic receipts, and consult with a licensed Certified Public Accountant (CPA) for statutory tax declarations.
          </p>
        </div>
      </div>
    </div>
  );
}
