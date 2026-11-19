import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  Video,
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
  Save,
  Plus,
  Coins,
  Store,
  MapPin,
  Calendar,
  Receipt as ReceiptIcon,
  ShoppingBag,
  CreditCard,
  Percent,
  SwitchCamera,
  ArrowRight,
  Check
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
  const [uploadingAndProcessing, setUploadingAndProcessing] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Active Receipt Details Modal / Drawer
  const [activeReceiptDetails, setActiveReceiptDetails] = useState(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Camera Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Format currency in Philippine Peso
  const formatPeso = (val) => {
    const num = Number(val) || 0;
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Load user receipts
  const fetchReceipts = async () => {
    try {
      setLoadingList(true);
      const res = await getReceipts({ per_page: 50 });
      setReceipts(res.data.receipts || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load receipts. Please try again.' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    return () => {
      stopCamera();
    };
  }, []);

  // --- CAMERA SCANNER CONTROLS ---
  const startCamera = async (facing = cameraFacing) => {
    setCameraError(null);
    setCapturedPreview(null);
    setCameraActive(true);

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in your browser.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
    setCapturedPreview(null);
    setCameraError(null);
  };

  const toggleCameraFacing = () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `receipt_scan_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPreview({ file, previewUrl });
      },
      'image/jpeg',
      0.95
    );
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.play();
    }
  };

  // --- AUTOMATIC UPLOAD & IMMEDIATE PROCESSING ---
  // When a user selects a file or confirms a scan, immediately upload, run OCR, and open Receipt Details!
  const processAndShowReceiptDetails = async (fileToProcess, localPreviewUrl = null) => {
    setUploadingAndProcessing(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('files', fileToProcess);

    try {
      // 1. Upload receipt
      const uploadRes = await uploadReceipts(formData);
      const uploadedReceipt = uploadRes.data.receipts?.[0];

      if (!uploadedReceipt || !uploadedReceipt.id) {
        throw new Error('Upload succeeded but receipt record is missing.');
      }

      // 2. Immediately run OCR extraction
      const processRes = await processReceipt(uploadedReceipt.id);
      const extractedData = processRes.data.extracted_data || {};
      const expenseId = processRes.data.expense_id;

      // 3. Immediately display the "Receipt Details" card/modal
      setActiveReceiptDetails({
        receipt_id: uploadedReceipt.id,
        expense_id: expenseId,
        filename: uploadedReceipt.original_filename,
        imageUrl: localPreviewUrl || getReceiptFileUrl(uploadedReceipt.id),
        data: extractedData
      });

      setMessage({
        type: 'success',
        text: `Receipt successfully scanned & extracted! Showing details for ${extractedData.merchant_name || 'Receipt'}.`
      });

      // Refresh background list
      fetchReceipts();
    } catch (err) {
      console.error('Error during auto upload and extraction:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to process receipt. Please try again.'
      });
    } finally {
      setUploadingAndProcessing(false);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // When camera photo is confirmed -> immediately process & open details!
  const confirmCapturedPhoto = async () => {
    if (capturedPreview && capturedPreview.file) {
      const file = capturedPreview.file;
      const preview = capturedPreview.previewUrl;
      stopCamera();
      await processAndShowReceiptDetails(file, preview);
    }
  };

  // --- FILE SELECTION & DRAG/DROP ---
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
      const file = e.dataTransfer.files[0];
      const preview = URL.createObjectURL(file);
      processAndShowReceiptDetails(file, preview);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      processAndShowReceiptDetails(file, preview);
    }
  };

  // View existing receipt details from library
  const handleViewReceipt = async (rcpt) => {
    try {
      setUploadingAndProcessing(true);
      const res = await processReceipt(rcpt.id);
      setActiveReceiptDetails({
        receipt_id: rcpt.id,
        expense_id: res.data.expense_id,
        filename: rcpt.original_filename,
        imageUrl: getReceiptFileUrl(rcpt.id),
        data: res.data.extracted_data || {}
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load receipt details.' });
    } finally {
      setUploadingAndProcessing(false);
    }
  };

  // Delete a receipt
  const handleDeleteReceipt = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }
    try {
      await deleteReceipt(id);
      setMessage({ type: 'success', text: `Deleted receipt "${filename}"` });
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      if (activeReceiptDetails?.receipt_id === id) {
        setActiveReceiptDetails(null);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to delete receipt.' });
    }
  };

  // Active details field updater
  const handleUpdateActiveField = (field, value) => {
    setActiveReceiptDetails((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          [field]: value
        }
      };
    });
  };

  // Line item handlers
  const handleUpdateLineItem = (index, field, value) => {
    setActiveReceiptDetails((prev) => {
      if (!prev || !prev.data?.items) return prev;
      const newItems = [...prev.data.items];
      const item = { ...newItems[index], [field]: value };

      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : Number(item.quantity || 1);
        const price = field === 'unit_price' ? Number(value) : Number(item.unit_price || 0);
        item.amount = Number((qty * price).toFixed(2));
      }

      newItems[index] = item;
      const newTotal = newItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
      return {
        ...prev,
        data: {
          ...prev.data,
          items: newItems,
          total_amount: Number(newTotal.toFixed(2)),
          subtotal: Number(newTotal.toFixed(2))
        }
      };
    });
  };

  const handleAddLineItem = () => {
    setActiveReceiptDetails((prev) => {
      if (!prev) return prev;
      const currentItems = prev.data?.items || [];
      const newItem = {
        description: 'New Item',
        quantity: 1,
        unit_price: 50.0,
        amount: 50.0
      };
      const updated = [...currentItems, newItem];
      const newTotal = updated.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
      return {
        ...prev,
        data: {
          ...prev.data,
          items: updated,
          total_amount: Number(newTotal.toFixed(2))
        }
      };
    });
  };

  const handleRemoveLineItem = (index) => {
    setActiveReceiptDetails((prev) => {
      if (!prev || !prev.data?.items) return prev;
      const updated = prev.data.items.filter((_, idx) => idx !== index);
      const newTotal = updated.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
      return {
        ...prev,
        data: {
          ...prev.data,
          items: updated,
          total_amount: Number(newTotal.toFixed(2))
        }
      };
    });
  };

  // Save active receipt details
  const handleSaveActiveReceipt = async () => {
    if (!activeReceiptDetails?.expense_id) return;
    setIsSavingDetails(true);
    try {
      const d = activeReceiptDetails.data;
      const payload = {
        merchant_name: d.merchant_name,
        receipt_date: d.receipt_date,
        receipt_number: d.receipt_number,
        category: d.category,
        total_amount: d.total_amount,
        vat_amount: d.vat_amount,
        vatable_sales: d.vatable_sales,
        vat_exempt_sales: d.vat_exempt_sales,
        non_vat_sales: d.non_vat_sales,
        verification_status: 'verified'
      };
      await updateExpense(activeReceiptDetails.expense_id, payload);
      setMessage({
        type: 'success',
        text: `Saved & verified receipt for ${d.merchant_name || 'Receipt'}!`
      });
      setActiveReceiptDetails((prev) => ({
        ...prev,
        data: { ...prev.data, verification_status: 'verified' }
      }));
      fetchReceipts();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save updated receipt record.' });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Processed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> Processing...
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30 backdrop-blur-md">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/20 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-blue-300" /> Uploaded
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 font-poppins pb-12">
      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm backdrop-blur-xl border transition-all duration-300 shadow-xl ${
            message.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40'
              : message.type === 'error'
              ? 'bg-rose-950/40 text-rose-200 border-rose-500/40'
              : 'bg-blue-950/40 text-blue-200 border-blue-500/40'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER BANNER / TOP ACTIONS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C3547]/85 via-[#163a54]/85 to-[#D97706]/75 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 shadow-2xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <span>🧾</span> Resibo • AI Scanner &amp; Extractor <span>⭐</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Scan &amp; Upload Receipts
            </h1>
            <p className="text-sm text-gray-200 leading-relaxed">
              Upload or scan your receipt to <strong className="text-amber-300">instantly view all receipt details</strong>: items, quantities, VAT breakdown, discounts, change, and totals in Philippine Peso (₱).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 shadow-lg shadow-amber-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-5 h-5 text-slate-950" />
              {cameraActive ? 'Close Camera' : 'Scan with Camera'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="w-5 h-5 text-amber-300" />
              Upload Image/PDF
            </button>
          </div>
        </div>
      </div>

      {/* LIVE CAMERA MODAL / SCANNER */}
      {cameraActive && (
        <div className="rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-amber-400/40 p-6 shadow-2xl space-y-4 text-white animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  Live Camera Scanner
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-xs text-gray-400">
                  Align your receipt inside the viewfinder box
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleCameraFacing}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 transition-colors"
                title="Switch Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button
                onClick={stopCamera}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-gray-200 hover:text-rose-200 border border-white/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {cameraError ? (
            <div className="p-8 text-center bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
              <p className="font-semibold text-sm">{cameraError}</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[4/3] max-h-[500px] flex items-center justify-center">
              {!capturedPreview ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-4 bg-amber-500/5">
                    <div className="flex justify-between text-xs font-mono font-bold text-amber-300 bg-black/60 px-2.5 py-1 rounded backdrop-blur self-start">
                      <span>[RESIBO] RECEIPT VIEWFINDER</span>
                    </div>
                    {/* Glowing scanner line animation */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-pulse" />
                    <div className="text-center text-xs text-amber-200/80 bg-black/50 py-1 rounded backdrop-blur">
                      Ensure good lighting and all text is legible
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={capturedPreview.previewUrl}
                    alt="Captured receipt"
                    className="max-h-[500px] w-auto object-contain"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-600/90 text-white text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Photo Captured!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera Buttons */}
          {!cameraError && (
            <div className="flex items-center justify-center gap-4 pt-2">
              {!capturedPreview ? (
                <button
                  onClick={capturePhoto}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-base bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xl shadow-amber-500/30 transition-transform active:scale-95"
                >
                  <Camera className="w-6 h-6" /> Capture Receipt
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={retakePhoto}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake Photo
                  </button>
                  <button
                    onClick={confirmCapturedPhoto}
                    disabled={uploadingAndProcessing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
                  >
                    {uploadingAndProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Use &amp; Extract Details
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DRAG-AND-DROP UPLOAD ZONE */}
      <div className="rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-400/30">
                <Upload className="w-5 h-5" />
              </span>
              Drop or Upload Receipt
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mt-1">
              Select or drop a receipt image (JPG, PNG) or PDF. Details will automatically extract and open immediately!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startCamera()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900/10 dark:bg-white/10 hover:bg-amber-500/20 text-slate-800 dark:text-white border border-slate-300 dark:border-white/20 transition-all"
            >
              <Camera className="w-4 h-4 text-amber-500" />
              Open Camera Scanner
            </button>
          </div>
        </div>

        {/* Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[0.99] shadow-inner'
              : 'border-slate-300 dark:border-white/20 hover:border-amber-500 bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
          />
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center mb-4 transform hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            Click to browse or drop your receipt here
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Supports JPG, JPEG, PNG, and PDF (Receipt Details appear instantly)
          </p>
        </div>

        {uploadingAndProcessing && (
          <div className="p-6 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center gap-3 text-amber-500 font-bold text-sm animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Uploading &amp; Extracting Receipt Details with AI...
          </div>
        )}
      </div>

      {/* --- RECEIPT DETAILS SECTION (JUST LIKE USER SCREENSHOT) --- */}
      {activeReceiptDetails && (
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-2 border-amber-400/50 shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-400/30">
                <ReceiptIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  Receipt Details
                  <span className="text-xs font-bold text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30">
                    Live Extracted
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  {activeReceiptDetails.filename} • {activeReceiptDetails.data?.receipt_number || 'Official Receipt'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeReceiptDetails.data?.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                  <CheckCircle className="w-4 h-4" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <AlertCircle className="w-4 h-4" /> Ready for Review
                </span>
              )}
              <button
                onClick={() => setActiveReceiptDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white/10 transition-colors"
                title="Close Details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT: RECEIPT IMAGE PREVIEW + RECEIPT DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Receipt Document Preview (Phone-like viewport like the screenshot) */}
            <div className="lg:col-span-5 bg-slate-950/40 rounded-3xl p-4 border border-white/10 flex flex-col items-center">
              <div className="w-full relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center min-h-[380px] max-h-[500px]">
                {activeReceiptDetails.filename?.toLowerCase().endsWith('.pdf') ? (
                  <div className="flex flex-col items-center justify-center p-8 text-rose-400">
                    <FileText className="w-16 h-16 mb-2" />
                    <span className="text-sm font-bold">PDF Receipt Document</span>
                  </div>
                ) : (
                  <img
                    src={activeReceiptDetails.imageUrl}
                    alt="Receipt Preview"
                    className="w-full h-auto max-h-[480px] object-contain rounded-xl"
                  />
                )}
              </div>
              <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Original Document</span>
                <a
                  href={activeReceiptDetails.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Full Image
                </a>
              </div>
            </div>

            {/* Right Column: Receipt Details Form & Breakdown (Structured like user image) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Core Information Cards */}
              <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Receipt Name / Merchant */}
                  <div>
                    <label className="text-slate-500 dark:text-gray-400 font-bold block mb-1">
                      Receipt Name / Merchant
                    </label>
                    <input
                      type="text"
                      value={activeReceiptDetails.data?.merchant_name || ''}
                      onChange={(e) => handleUpdateActiveField('merchant_name', e.target.value)}
                      placeholder="e.g. Jollibee, Petron, etc."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-slate-500 dark:text-gray-400 font-bold block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={activeReceiptDetails.data?.category || 'Food and Meals'}
                      onChange={(e) => handleUpdateActiveField('category', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-slate-500 dark:text-gray-400 font-bold block mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={activeReceiptDetails.data?.receipt_date || ''}
                      onChange={(e) => handleUpdateActiveField('receipt_date', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm"
                    />
                  </div>

                  {/* Amount in Philippine Peso (₱) */}
                  <div>
                    <label className="text-slate-500 dark:text-gray-400 font-bold block mb-1">
                      Total Amount (₱)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={activeReceiptDetails.data?.total_amount ?? ''}
                        onChange={(e) => handleUpdateActiveField('total_amount', e.target.value)}
                        className="w-full p-2.5 rounded-xl border-2 border-amber-500 bg-white dark:bg-slate-800 text-amber-500 font-mono font-black text-base"
                      />
                    </div>
                  </div>

                  {/* Invoice / Receipt # */}
                  <div>
                    <label className="text-slate-500 dark:text-gray-400 font-bold block mb-1">
                      Receipt / Invoice #
                    </label>
                    <input
                      type="text"
                      value={activeReceiptDetails.data?.receipt_number || ''}
                      onChange={(e) => handleUpdateActiveField('receipt_number', e.target.value)}
                      placeholder="OR-000000"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  {/* BIR TIN */}
                  <div>
                    <label className="text-slate-500 dark:text-gray-400 font-bold block mb-1">
                      BIR TIN #
                    </label>
                    <input
                      type="text"
                      value={activeReceiptDetails.data?.merchant_tin || ''}
                      onChange={(e) => handleUpdateActiveField('merchant_tin', e.target.value)}
                      placeholder="TIN: 000-000-000-000"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table (Description, Qty, Unit Price, Amount) */}
              <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    Line Items Description ({(activeReceiptDetails.data?.items || []).length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-400/30 hover:bg-amber-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 font-bold uppercase">
                      <tr>
                        <th className="p-2.5 w-14 text-center">Qty</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 w-24 text-right">Price (₱)</th>
                        <th className="p-2.5 w-24 text-right">Total (₱)</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {(activeReceiptDetails.data?.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-amber-500/5">
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity || 1}
                              onChange={(e) => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                              className="w-12 text-center p-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={it.description || ''}
                              onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                              className="w-full p-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={it.unit_price ?? ''}
                              onChange={(e) => handleUpdateLineItem(idx, 'unit_price', e.target.value)}
                              className="w-20 text-right p-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-amber-500">
                            {formatPeso(it.amount)}
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VAT & Financial Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* VAT Breakdown */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Tax / VAT Breakdown (₱)
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-gray-400">VATable Sales:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={activeReceiptDetails.data?.vatable_sales ?? ''}
                      onChange={(e) => handleUpdateActiveField('vatable_sales', e.target.value)}
                      className="w-24 text-right p-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-gray-400">12% VAT:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={activeReceiptDetails.data?.vat_amount ?? ''}
                      onChange={(e) => handleUpdateActiveField('vat_amount', e.target.value)}
                      className="w-24 text-right p-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Payment & Sukli */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Payment &amp; Sukli (Change)
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-gray-400">Method:</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">
                      {activeReceiptDetails.data?.payment_method || 'Cash'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-gray-400">Change Due:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatPeso(activeReceiptDetails.data?.change_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save & Confirm Action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setActiveReceiptDetails(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-white/20 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveActiveReceipt}
                  disabled={isSavingDetails}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
                >
                  {isSavingDetails ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save &amp; Verify Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOADED RECEIPTS LIBRARY */}
      <div className="rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-400/30">
                <ReceiptIcon className="w-5 h-5" />
              </span>
              Receipt Library
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Click on any receipt below to view its extracted details
            </p>
          </div>
          <button
            onClick={fetchReceipts}
            className="p-3 text-slate-600 dark:text-gray-300 hover:text-amber-500 hover:bg-white/10 rounded-2xl border border-transparent hover:border-white/20 transition-all"
            title="Refresh Library"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loadingList ? (
          <div className="py-16 flex flex-col items-center justify-center text-amber-500 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
              Loading receipts...
            </p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-gray-400 text-sm">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-500 mb-3">
              <ReceiptIcon className="w-8 h-8" />
            </div>
            <p className="font-bold text-slate-700 dark:text-gray-200">No receipts yet.</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
              Upload a receipt or scan using your camera above to see instant details.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {receipts.map((rcpt) => {
              const isPdf = rcpt.original_filename.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={rcpt.id}
                  onClick={() => handleViewReceipt(rcpt)}
                  className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="h-44 bg-slate-100 dark:bg-black/30 relative flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-white/10">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center text-rose-500">
                        <FileText className="w-14 h-14" />
                        <span className="text-xs font-extrabold mt-1 tracking-wider">PDF DOCUMENT</span>
                      </div>
                    ) : (
                      <img
                        src={getReceiptFileUrl(rcpt.id)}
                        alt={rcpt.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}

                    {/* Quick View Details Badge on hover */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                      <span className="px-4 py-2 bg-amber-400 text-slate-950 rounded-xl shadow-lg text-xs flex items-center gap-1.5 font-bold">
                        <Eye className="w-4 h-4" /> View Receipt Details
                      </span>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4
                        className="font-bold text-sm text-slate-900 dark:text-white truncate"
                        title={rcpt.original_filename}
                      >
                        {rcpt.original_filename}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        Uploaded: {new Date(rcpt.upload_date).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                      {getStatusBadge(rcpt.processing_status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReceipt(rcpt.id, rcpt.original_filename);
                        }}
                        title="Delete Receipt"
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
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
