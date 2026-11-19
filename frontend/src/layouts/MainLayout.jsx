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
    return item ? item.name : 'Resibo';
  };

  return (
    <div className="flex h-screen bg-pinoy-gradient text-gray-800 font-poppins antialiased overflow-hidden">
      {/* ========== Sidebar - Desktop ========== */}
      <aside className="hidden md:flex flex-col w-64 glass-dark bg-sidebar-gradient text-white select-none z-20 relative overflow-hidden">
        {/* Sun rays decorative background */}
        <div className="absolute inset-0 sun-rays opacity-30 pointer-events-none" />
        {/* Star pattern overlay */}
        <div className="absolute inset-0 star-pattern opacity-20 pointer-events-none" />

        {/* ---- Logo / Brand ---- */}
        <div className="relative flex items-center gap-3 px-5 h-20 border-b border-white/10">
          <div className="relative p-2.5 bg-gradient-to-br from-pinoy-gold/30 to-pinoy-sun-yellow/20 rounded-xl border border-pinoy-gold/20 shadow-glow-sm animate-pulse-soft">
            <span className="text-2xl" role="img" aria-label="receipt">🧾</span>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wide text-white text-glow flex items-center gap-1.5">
              Resibo
              <span className="text-sm animate-float">⭐</span>
            </h1>
            <p className="text-[10px] text-pinoy-gold/80 font-medium tracking-widest uppercase">
              Smart Expense Tracker
            </p>
          </div>
        </div>

        {/* ---- Navigation ---- */}
        <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-glass">
          <p className="px-3 mb-3 text-[10px] font-semibold tracking-widest uppercase text-pinoy-gold/50">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-glass ${
                  isActive
                    ? 'bg-white/15 text-white shadow-glass-sm border border-white/10 shadow-glow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white hover:shadow-glow-sm border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-pinoy-gold/20 text-pinoy-sun-yellow shadow-glow-sm'
                    : 'text-gray-400 group-hover:text-pinoy-gold group-hover:bg-pinoy-gold/10'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pinoy-gold shadow-glow-sm animate-pulse-soft" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ---- Decorative Filipino Accent ---- */}
        <div className="relative px-4 py-2.5 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-white/30">
            <span>🌴</span>
            <span>🇵🇭</span>
            <span className="animate-float-delay-1">⭐</span>
            <span>🇵🇭</span>
            <span>🌴</span>
          </div>
        </div>

        {/* ---- User Profile & Logout ---- */}
        <div className="relative p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pinoy-gold/40 to-pinoy-sun-yellow/20 text-pinoy-sun-yellow flex items-center justify-center font-semibold text-sm border border-pinoy-gold/30 shadow-glow-sm">
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
              className="p-2 text-gray-400 hover:text-pinoy-red hover:bg-pinoy-red/10 rounded-lg transition-glass"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========== Mobile Drawer ========== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full glass-dark bg-sidebar-gradient text-white z-50 animate-slide-in-left overflow-hidden">
            {/* Sun rays decoration */}
            <div className="absolute inset-0 sun-rays opacity-20 pointer-events-none" />
            <div className="absolute inset-0 star-pattern opacity-10 pointer-events-none" />

            {/* Mobile header */}
            <div className="relative flex items-center justify-between px-5 h-16 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xl">🧾</span>
                <span className="font-bold text-lg text-glow">Resibo ⭐</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-glass"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile nav */}
            <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-glass">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-glass ${
                      isActive
                        ? 'bg-white/15 text-white border border-white/10 shadow-glow-sm'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      isActive
                        ? 'bg-pinoy-gold/20 text-pinoy-sun-yellow'
                        : 'text-gray-400 group-hover:text-pinoy-gold'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pinoy-gold animate-pulse-soft" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Decorative */}
            <div className="relative px-4 py-2 text-center text-xs text-white/25">
              🌴 🇵🇭 ⭐ 🇵🇭 🌴
            </div>

            {/* Mobile user/logout */}
            <div className="relative p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pinoy-gold/40 to-pinoy-sun-yellow/20 text-pinoy-sun-yellow flex items-center justify-center font-semibold text-sm border border-pinoy-gold/30">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-pinoy-red hover:bg-pinoy-red/10 rounded-lg transition-glass">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Main Content Area ========== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Glass */}
        <header className="h-16 glass border-b border-white/10 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-white/70 hover:text-white focus:outline-none p-1.5 rounded-lg hover:bg-white/10 transition-glass"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-white tracking-tight text-glow-white">
              {getPageTitle()}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="hidden sm:inline text-xs font-medium bg-white/10 px-3 py-1 rounded-full border border-white/10">
              🇵🇭 Administrator
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pinoy-gold/30 to-pinoy-sun-yellow/20 flex items-center justify-center border border-pinoy-gold/20 shadow-glow-sm">
              <UserIcon className="w-4 h-4 text-pinoy-sun-yellow" />
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-content-gradient scrollbar-glass">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
