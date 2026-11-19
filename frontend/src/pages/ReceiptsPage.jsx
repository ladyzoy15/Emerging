import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileImage,
  FileText,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  X,
  RefreshCw,
  Edit2,
  Save
} from 'lucide-react';
import {
  uploadReceipts,
  getReceipts,
  deleteReceipt,
  processReceipt,
  getReceiptFileUrl,
  updateExpense
} from '../services/api';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const [extractionResults, setExtractionResults] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState(null);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load user receipts
  const fetchReceipts = async () => {
    try {
      setLoadingList(true);
      const res = await getReceipts({ per_page: 50 });
      setReceipts(res.data.receipts || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load uploaded receipts' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const validateAndAddFiles = (files) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const valid = [];
    const invalid = [];

    files.forEach((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      if (validTypes.includes(f.type) || ['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
        valid.push(f);
      } else {
        invalid.push(f.name);
      }
    });

    if (invalid.length > 0) {
      setMessage({
        type: 'error',
        text: `Invalid file format for: ${invalid.join(', ')}. Supported formats: JPG, JPEG, PNG, PDF.`
      });
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to backend
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await uploadReceipts(formData);
      setMessage({
        type: 'success',
        text: `Successfully uploaded ${res.data.receipts?.length || selectedFiles.length} receipt(s)!`
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchReceipts();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to upload receipts.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Process Receipts with OCR ("ORGANIZE EXPENSES")
  const handleOrganizeExpenses = async () => {
    const pendingReceipts = receipts.filter(
      (r) => r.processing_status === 'uploaded' || r.processing_status === 'failed'
    );

    if (pendingReceipts.length === 0) {
      setMessage({
        type: 'info',
        text: 'All current receipts are already processed. Upload new receipts to organize.'
      });
      return;
    }

    setProcessing(true);
    setProcessProgress({ current: 0, total: pendingReceipts.length });
    const results = [];

    for (let i = 0; i < pendingReceipts.length; i++) {
      const r = pendingReceipts[i];
      setProcessProgress({ current: i + 1, total: pendingReceipts.length });
      try {
        const res = await processReceipt(r.id);
        results.push({
          receipt_id: r.id,
          filename: r.original_filename,
          data: res.data.extracted_data,
          expense_id: res.data.expense_id,
          success: true
        });
      } catch (err) {
        console.error(`Error processing receipt ${r.id}:`, err);
        results.push({
          receipt_id: r.id,
          filename: r.original_filename,
          error: err.response?.data?.error || 'OCR processing failed',
          success: false
        });
      }
    }

    setExtractionResults(results);
    setProcessing(false);
    setMessage({
      type: 'success',
      text: `Organize Expenses completed! Extracted and categorized ${results.filter((r) => r.success).length} of ${pendingReceipts.length} receipts.`
    });
    fetchReceipts();
  };

  // Delete a receipt
  const handleDeleteReceipt = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? Associated expense records will be detached.`)) {
      return;
    }
    try {
      await deleteReceipt(id);
      setMessage({ type: 'success', text: `Deleted receipt "${filename}"` });
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      setExtractionResults((prev) => prev.filter((r) => r.receipt_id !== id));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to delete receipt' });
    }
  };

  // Inline correction handler for extracted fields
  const handleUpdateExtractionField = (receiptId, field, value) => {
    setExtractionResults((prev) =>
      prev.map((item) => {
        if (item.receipt_id === receiptId && item.data) {
          return {
            ...item,
            data: {
              ...item.data,
              [field]: value
            }
          };
        }
        return item;
      })
    );
  };

  // Save manually corrected extracted data to expense
  const handleSaveCorrection = async (item) => {
    if (!item.expense_id) return;
    try {
      const payload = {
        merchant_name: item.data.merchant_name,
        receipt_date: item.data.receipt_date,
        receipt_number: item.data.receipt_number,
        category: item.data.category,
        total_amount: item.data.total_amount,
        vat_amount: item.data.vat_amount,
        vatable_sales: item.data.vatable_sales,
        vat_exempt_sales: item.data.vat_exempt_sales,
        non_vat_sales: item.data.non_vat_sales,
        verification_status: 'verified' // User explicitly verified it
      };
      await updateExpense(item.expense_id, payload);
      setMessage({ type: 'success', text: `Saved and verified expense for ${item.data.merchant_name || 'receipt'}` });
      // Update local state to verified
      setExtractionResults((prev) =>
        prev.map((r) =>
          r.receipt_id === item.receipt_id
            ? { ...r, data: { ...r.data, verification_status: 'verified' } }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update expense record.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Clock className="w-3 h-3" /> Uploaded
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. UPLOAD SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Upload Receipt Documents</h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop your receipts in JPG, PNG, or PDF format. You can upload multiple files at once.
          </p>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/50 scale-[0.99]'
              : 'border-gray-300 hover:border-[#1B2A4A] bg-gray-50/50 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
          />
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#1B2A4A] mb-4">
            <Upload className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Click to browse or drag and drop receipts here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports JPG, JPEG, PNG, and PDF (Max 10MB per file)
          </p>
        </div>

        {/* Selected Files Staging List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-800">
                Selected for Upload ({selectedFiles.length})
              </h4>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-red-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    {file.type === 'application/pdf' ? (
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <span className="font-medium text-gray-700 truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={() => removeSelectedFile(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleUploadFiles}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#263c63] disabled:opacity-50 transition-colors shadow-sm"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. ORGANIZE EXPENSES ACTION BAR */}
      <div className="bg-gradient-to-r from-[#1B2A4A] to-[#263c63] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" /> AI OCR Automation
          </span>
          <h3 className="text-xl font-bold tracking-tight">Organize Your Receipts</h3>
          <p className="text-sm text-gray-300 mt-1 max-w-xl">
            Extract merchant details, dates, total amounts, and VAT breakdowns automatically. AI assigns accurate accounting categories and prepares your tax records.
          </p>
        </div>

        <button
          onClick={handleOrganizeExpenses}
          disabled={processing || receipts.length === 0}
          className="w-full md:w-auto px-8 py-3.5 bg-white text-[#1B2A4A] font-bold text-sm tracking-wide uppercase rounded-xl hover:bg-gray-100 disabled:opacity-60 transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          {processing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              Processing ({processProgress.current}/{processProgress.total})...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-blue-600" />
              ORGANIZE EXPENSES
            </>
          )}
        </button>
      </div>

      {/* 3. EXTRACTION RESULTS & VERIFICATION SECTION */}
      {extractionResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Extracted Information & Verification</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review data extracted by OCR. Incomplete fields are marked "Needs Review". You can adjust and save directly.
              </p>
            </div>
            <button
              onClick={() => setExtractionResults([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Dismiss Results
            </button>
          </div>

          <div className="space-y-6">
            {extractionResults.map((item) => (
              <div
                key={item.receipt_id}
                className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-sm text-gray-800">{item.filename}</span>
                  </div>
                  <div>
                    {item.data?.verification_status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5" /> Needs Review
                      </span>
                    )}
                  </div>
                </div>

                {item.error ? (
                  <p className="text-sm text-red-600">{item.error}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Merchant Name</label>
                      <input
                        type="text"
                        value={item.data?.merchant_name || ''}
                        placeholder="Needs Review"
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'merchant_name', e.target.value)
                        }
                        className={`w-full p-2 border rounded-lg text-xs ${
                          !item.data?.merchant_name
                            ? 'border-amber-300 bg-amber-50/50 text-amber-900 font-medium'
                            : 'border-gray-200 bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Receipt Date</label>
                      <input
                        type="date"
                        value={item.data?.receipt_date || ''}
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'receipt_date', e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Receipt / Invoice #</label>
                      <input
                        type="text"
                        value={item.data?.receipt_number || ''}
                        placeholder="N/A"
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'receipt_number', e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Assigned Category</label>
                      <input
                        type="text"
                        value={item.data?.category || 'Other'}
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'category', e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Total Amount (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.data?.total_amount ?? ''}
                        placeholder="0.00"
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'total_amount', e.target.value)
                        }
                        className={`w-full p-2 border rounded-lg text-xs font-semibold ${
                          item.data?.total_amount == null
                            ? 'border-amber-300 bg-amber-50/50 text-amber-900'
                            : 'border-gray-200 bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">VAT Amount (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.data?.vat_amount ?? ''}
                        placeholder="0.00"
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'vat_amount', e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">VATable Sales (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.data?.vatable_sales ?? ''}
                        placeholder="0.00"
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'vatable_sales', e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-medium mb-1">VAT-Exempt Sales (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.data?.vat_exempt_sales ?? ''}
                        placeholder="0.00"
                        onChange={(e) =>
                          handleUpdateExtractionField(item.receipt_id, 'vat_exempt_sales', e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSaveCorrection(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save & Verify Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. UPLOADED RECEIPTS REPOSITORY */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Uploaded Receipt Library</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Securely stored original images and PDFs for accounting backup
            </p>
          </div>
          <button
            onClick={fetchReceipts}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingList ? (
          <div className="py-12 flex justify-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1B2A4A]" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <FileImage className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>No receipts uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {receipts.map((rcpt) => {
              const isPdf = rcpt.original_filename.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={rcpt.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Thumbnail / Document Preview */}
                  <div className="h-40 bg-gray-100 relative flex items-center justify-center overflow-hidden border-b border-gray-100 group">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center text-red-500">
                        <FileText className="w-12 h-12" />
                        <span className="text-xs font-bold mt-1">PDF DOCUMENT</span>
                      </div>
                    ) : (
                      <img
                        src={getReceiptFileUrl(rcpt.id)}
                        alt={rcpt.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {/* Hover Quick Action */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a
                        href={getReceiptFileUrl(rcpt.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white text-gray-800 rounded-lg shadow-sm hover:bg-gray-100 text-xs flex items-center gap-1 font-medium"
                      >
                        <Eye className="w-4 h-4" /> View Full
                      </a>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4
                          className="font-medium text-sm text-gray-900 truncate"
                          title={rcpt.original_filename}
                        >
                          {rcpt.original_filename}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(rcpt.upload_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      {getStatusBadge(rcpt.processing_status)}
                      <button
                        onClick={() => handleDeleteReceipt(rcpt.id, rcpt.original_filename)}
                        title="Delete receipt"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
