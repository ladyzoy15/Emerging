import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileImage,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ScanLine,
  User as UserIcon
} from 'lucide-react';

export default function MainLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || { name: 'User', email: '' };
    } catch {
      return { name: 'User', email: '' };
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Receipts', path: '/receipts', icon: FileImage },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === location.pathname);
    return item ? item.name : 'ReceiptAI';
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800 font-sans antialiased overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1B2A4A] text-white select-none z-20">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-white">ReceiptAI</h1>
            <p className="text-xs text-gray-400">Expense Automation</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-[#15223c]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-semibold text-sm border border-blue-400/20">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1B2A4A] text-white z-50">
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ScanLine className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-lg">ReceiptAI</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-white/15 text-white' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 bg-[#15223c] flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 tracking-tight">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="hidden sm:inline">Role: Administrator</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <UserIcon className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
