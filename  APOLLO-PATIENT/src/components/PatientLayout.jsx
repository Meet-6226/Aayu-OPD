import React from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, Bell, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

export default function PatientLayout() {
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { unreadCount } = useNotifications(authUser?.uid);

  // Extract initials for the avatar circle
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

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f4fcfb] via-[#f8fafc] to-[#f1fcfb] text-text-medium font-sans flex flex-col relative overflow-hidden">
      {/* Dynamic blurred mesh gradient circles in background */}
      <div className="absolute top-24 -left-32 w-96 h-96 rounded-full bg-primary-teal/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-24 right-10 w-[450px] h-[450px] rounded-full bg-[#10b981]/5 blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-primary-teal/3 blur-[100px] pointer-events-none z-0"></div>
      {/* HEADER (Fixed top, all pages) */}
      <header className="fixed top-0 left-0 right-0 h-14 lg:h-16 bg-white/80 backdrop-blur-md border-b border-border-custom/50 z-50">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-full flex items-center justify-between">
          {/* Left Logo */}
          <Link to="/home" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-teal to-[#10b981] flex items-center justify-center shrink-0 shadow-md shadow-primary-teal/15 transition-transform duration-300 group-hover:rotate-12">
              <span className="text-white font-bold text-[14px]">A</span>
            </div>
            <span className="font-display font-bold text-[18px] text-primary-teal tracking-tight">
              Apollo <span className="text-[#10b981]">OPD</span>
            </span>
          </Link>

          {/* Center (Desktop only, 1024px+) */}
          <nav className="hidden lg:flex items-center space-x-8 h-full">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `text-[14px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary-teal' : 'text-text-light hover:text-text-dark'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                `text-[14px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary-teal' : 'text-text-light hover:text-text-dark'
                }`
              }
            >
              Find Doctors
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                `text-[14px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary-teal' : 'text-text-light hover:text-text-dark'
                }`
              }
            >
              My Appointments
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `text-[14px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary-teal' : 'text-text-light hover:text-text-dark'
                }`
              }
            >
              Notifications
            </NavLink>
          </nav>

          {/* Right Group */}
          <div className="flex items-center space-x-4">
            <span className="hidden lg:inline-block text-[14px] text-text-medium">
              {authUser?.name || 'Priya Sharma'}
            </span>
            
            {/* Bell Icon with red unread notification dot */}
            <Link to="/notifications" className="relative p-1 text-text-light hover:text-text-dark transition-colors duration-200">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>

            {/* Avatar Circle */}
            <Link to="/profile" className="w-8 h-8 rounded-full bg-light-teal flex items-center justify-center shrink-0 border border-transparent hover:border-primary-teal/20 transition-all">
              <span className="text-[12px] font-semibold text-primary-teal">{getInitials()}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* BOTTOM NAVIGATION (Mobile only, hidden on desktop 1024px+) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#f3f4f6] z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="grid grid-cols-4 max-w-[420px] mx-auto h-full">
          {/* Home Tab */}
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full border-t-2 transition-all ${
                isActive ? 'border-primary-teal text-primary-teal' : 'border-transparent text-text-light'
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </NavLink>

          {/* Appointments Tab */}
          <NavLink
            to="/appointments"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full border-t-2 transition-all ${
                isActive ? 'border-primary-teal text-primary-teal' : 'border-transparent text-text-light'
              }`
            }
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Appointments</span>
          </NavLink>

          {/* Notifications Tab */}
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full border-t-2 transition-all ${
                isActive ? 'border-primary-teal text-primary-teal' : 'border-transparent text-text-light'
              }`
            }
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">Notifications</span>
          </NavLink>

          {/* Profile Tab */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full border-t-2 transition-all ${
                isActive ? 'border-primary-teal text-primary-teal' : 'border-transparent text-text-light'
              }`
            }
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow pt-14 lg:pt-16 pb-[72px] lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
