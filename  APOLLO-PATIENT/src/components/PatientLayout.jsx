import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Bell, User, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

import BrandLogo from './BrandLogo';
import MedicalOnboardingModal from './MedicalOnboardingModal';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { doc, updateDoc } from 'firebase/firestore';

export default function PatientLayout() {
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { unreadCount } = useNotifications(authUser?.uid);

  // Show medical onboarding once per patient (first login)
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    const done = localStorage.getItem('nidaan_onboarding_done');
    if (!done) setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = async (profile) => {
    setShowOnboarding(false);
    if (!profile) return;
    try {
      const patientId = authUser?.uid || authUser?.id || (authUser?.phoneNumber ? authUser.phoneNumber.replace(/\D/g, '') : null);
      if (patientId) {
        const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
        await updateDoc(patientRef, {
          medicalHistory: {
            chronicConditions: profile.chronic_conditions || [],
            chronicConditionsCustom: profile.chronic_conditions_custom_details || '',
            currentMedications: profile.current_medications || '',
            allergies: profile.allergies || [],
            allergiesCustom: profile.allergies_custom_details || '',
            bloodGroup: profile.blood_group || '',
            bloodGroupCustom: profile.blood_group_custom_details || '',
            currentSymptoms: profile.current_symptoms || [],
            currentSymptomsCustom: profile.current_symptoms_custom_details || '',
            lifestyle: profile.lifestyle || '',
            lifestyleCustom: profile.lifestyle_custom_details || '',
            familyHistory: profile.family_history || [],
            familyHistoryCustom: profile.family_history_custom_details || '',
            medicalReport: profile.medical_report || null,
            completedAt: profile.completedAt
          },
          bloodGroup: profile.blood_group || '',
          updatedAt: new Date()
        });
        console.log('[PatientLayout] Saved medical history to database for:', patientId);
      }
    } catch (err) {
      console.error('[PatientLayout] Failed to save medical history to DB:', err);
    }
  };

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
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount > 0 },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans flex flex-col relative antialiased">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 lg:h-16 bg-white border-b border-[#E2E8F0] z-50 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          {/* Logo */}
          <Link to="/home" className="shrink-0">
            <BrandLogo variant="inline" height={28} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            {[
              { to: '/home', label: 'Dashboard' },
              { to: '/doctors', label: 'Doctors' },
              { to: '/appointments', label: 'Appointments' },
              { to: '/reports', label: 'Reports' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative px-3.5 py-1.5 text-xs font-semibold rounded-[8px] transition-all duration-150 ${
                    isActive
                      ? 'text-[#0F172A] bg-[#F1F5F9] font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative p-2 rounded-[8px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[#E11D48]" />
              )}
            </Link>

            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center hover:border-[#CBD5E1] transition-all"
            >
              <span className="text-xs font-bold text-[#475569]">{getInitials()}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── BOTTOM NAV (Mobile only) ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E8F0] z-50 lg:hidden shadow-lg">
        <div className="flex items-center justify-around max-w-[440px] mx-auto h-full px-3">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center h-full px-2 text-decoration-none"
            >
            {({ isActive }) => (
                <div className="relative flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`h-[18px] w-[18px] transition-colors duration-150 ${
                        isActive ? 'text-[#0f766e]' : 'text-[#94A3B8]'
                      }`}
                    />
                    {badge && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#E11D48]" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 leading-none transition-colors ${
                      isActive ? 'font-bold text-[#0f766e]' : 'font-medium text-[#94A3B8]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-grow pt-14 lg:pt-16 pb-[72px] lg:pb-0 bg-[#F8FAFC]">
        <Outlet />
      </main>

      {/* ── Medical Onboarding Modal (first login only) ─────────────── */}
      <AnimatePresence>
        {showOnboarding && (
          <MedicalOnboardingModal onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
