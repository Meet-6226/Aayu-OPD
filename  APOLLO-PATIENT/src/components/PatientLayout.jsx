import React from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, Bell, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

export default function PatientLayout() {
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { unreadCount } = useNotifications(authUser?.uid);

  const getInitials = () => {
    if (authUser?.initials) return authUser.initials;
    if (authUser?.name) {
      return authUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return 'PS';
  };

  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount > 0 },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-text-medium font-sans flex flex-col relative">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 lg:h-16 bg-white border-b border-gray-100 z-50">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-full flex items-center justify-between">

          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-teal to-[#10b981] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-[13px]">A</span>
            </div>
            <span className="font-display font-bold text-[17px] text-primary-teal tracking-tight">
              Apollo <span className="text-[#10b981]">OPD</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            {[
              { to: '/home', label: 'Home' },
              { to: '/doctors', label: 'Find Doctors' },
              { to: '/appointments', label: 'My Appointments' },
              { to: '/notifications', label: 'Notifications' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-primary-teal bg-primary-teal/6'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary-teal" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-3">
            {/* Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>

            {/* Avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-teal/20 to-[#10b981]/20 flex items-center justify-center border border-primary-teal/15 hover:border-primary-teal/40 transition-all"
            >
              <span className="text-[11px] font-bold text-primary-teal">{getInitials()}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── BOTTOM NAV (Mobile only) ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 shadow-[0_-1px_0_0_rgba(0,0,0,0.04)] lg:hidden">
        <div className="grid grid-cols-4 max-w-[440px] mx-auto h-full px-2">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 ${
                  isActive ? 'text-primary-teal' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-primary-teal/10' : ''
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] transition-all duration-200 ${
                        isActive ? 'stroke-[2.5]' : 'stroke-[1.7]'
                      }`}
                    />
                    {badge && (
                      <span className="absolute top-0 right-1 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium leading-none transition-all ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-grow pt-14 lg:pt-16 pb-[72px] lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
