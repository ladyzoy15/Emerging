import React from 'react';
import { User, Shield, Info, Database, Server, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || { name: 'Demo User', email: 'demo@receiptai.com' };
    } catch {
      return { name: 'Demo User', email: 'demo@receiptai.com' };
    }
  })();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Account Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">User Profile</h3>
            <p className="text-xs text-gray-500">Your registered ReceiptAI credentials and profile details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Full Name
            </label>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 font-medium">
              {user.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Email Address
            </label>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 font-medium">
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">System Architecture & Tech Stack</h3>
            <p className="text-xs text-gray-500">ReceiptAI enterprise configuration specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1">Frontend Service</span>
            <p className="text-gray-600">React 18 + Vite</p>
            <p className="text-gray-400 mt-0.5">Port 5173, Tailwind CSS</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1">Backend REST API</span>
            <p className="text-gray-600">Python Flask 3.0</p>
            <p className="text-gray-400 mt-0.5">Port 5000, Tesseract OCR, SQLAlchemy</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1">Relational Database</span>
            <p className="text-gray-600">MySQL 8.0</p>
            <p className="text-gray-400 mt-0.5">Port 3306, Persistent Docker Volumes</p>
          </div>
        </div>
      </div>

      {/* Compliance & Legal Disclaimer Notice */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <Shield className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-bold text-gray-900">Tax & Regulatory Notice</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          ReceiptAI is an expense automation, document organization, and OCR extraction tool designed to help businesses, bookkeepers, and freelancers prepare records for accounting. This application does not claim official BIR accreditation, automatic BIR compliance, or direct electronic filing. All OCR-extracted records should be verified before submission to tax authorities.
        </p>
      </div>
    </div>
  );
}
