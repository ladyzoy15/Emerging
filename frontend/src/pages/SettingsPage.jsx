import React from 'react';
import { User, Shield, Info, Database, Server, Smartphone, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || { name: 'Demo User', email: 'demo@receiptai.com' };
    } catch {
      return { name: 'Demo User', email: 'demo@receiptai.com' };
    }
  })();

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-poppins">
      {/* Account Settings */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-blue-500/20 backdrop-blur text-blue-300 rounded-xl border border-blue-400/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">User Profile</h3>
            <p className="text-xs text-white/60">Registered Resibo account credentials and details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
              Full Name
            </label>
            <div className="p-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-gray-800 font-medium">
              {user.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
              Email Address
            </label>
            <div className="p-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-gray-800 font-medium">
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-purple-500/20 backdrop-blur text-purple-300 rounded-xl border border-purple-400/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">System Architecture &amp; Tech Stack</h3>
            <p className="text-xs text-white/60">Resibo application and processing specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/15 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-white">Frontend</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              React 18 + Vite with Tailwind CSS, Lucide Icons, and Glassmorphism design system.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/15 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white">Backend</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              Python Flask 3 API with OCR engine, receipt line items parser, and JWT authentication.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/15 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Database</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              MySQL 8.0 with SQLAlchemy ORM, indexed for rapid expense searches and analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
