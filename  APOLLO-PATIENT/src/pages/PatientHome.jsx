import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Clock, FileText, X, Star, ChevronRight, Gift, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDoctors } from '../hooks/useDoctors';
import { useAppointments } from '../hooks/useAppointments';

// Avatar color palette — 6 muted colors based on name initial
const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { bg: 'bg-rose-100',   text: 'text-rose-700'   },
  { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
];

const getAvatarColor = (name = '') => {
  const code = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code];
};

const getDoctorInitials = (name) => {
  if (!name) return 'DR';
  const clean = name.replace(/^Dr\.\s+/i, '').trim();
  return clean.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const departments = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology',
  'Neurology', 'ENT', 'Gynecology', 'Pediatrics',
];

export default function PatientHome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('General Medicine');
  const [showReminders, setShowReminders] = useState(true);
  const navigate = useNavigate();

  const { doctors, loading: doctorsLoading, fetchAllDoctors } = useDoctors();
  const { upcoming, fetchAppointments, loading: apptsLoading } = useAppointments();

  useEffect(() => { fetchAllDoctors(); }, [fetchAllDoctors]);
  useEffect(() => {
    if (user?.uid) fetchAppointments(user.uid);
  }, [user?.uid, fetchAppointments]);

  const getFilteredDoctors = () => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return doctors.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.department || '').toLowerCase().includes(q) ||
        (d.qualifications || '').toLowerCase().includes(q)
      );
    }
    return doctors.filter(d => d.department === activeChip);
  };

  const filteredDoctors = getFilteredDoctors();

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 pb-12">

      {/* ── GREETING ROW ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mt-7 mb-7">
        <div>
          <p className="text-sm text-gray-400 font-medium">
            {getGreeting()},
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
            {user?.name?.split(' ')[0] || 'Priya'} 👋
          </h1>
        </div>
        {/* ABHA badge — only if linked */}
        {user?.abhaId && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ABHA Linked
          </div>
        )}
      </div>

      {/* ── UPCOMING APPOINTMENT BANNER (if exists) ───────────────── */}
      {!apptsLoading && upcoming.length > 0 && (
        <Link
          to={`/appointment/${upcoming[0].id}`}
          className="block mb-7 group"
        >
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-primary-teal/40 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4">
              {/* Left accent + avatar */}
              <div className="shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-[13px] font-bold text-teal-700">
                  {getDoctorInitials(upcoming[0].doctorName)}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-primary-teal uppercase tracking-wider">
                  Upcoming Visit
                </p>
                <p className="text-[14px] font-semibold text-gray-900 mt-0.5">
                  {upcoming[0].doctorName}
                  <span className="text-gray-400 font-normal"> · {upcoming[0].department}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {upcoming[0].appointmentDate} at {upcoming[0].appointmentTime}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full capitalize">
                {upcoming[0].status}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          </div>
        </Link>
      )}

      {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search doctors, specialties..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full max-w-lg bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── TWO COLUMN GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT COLUMN ─ Doctor List ──────────────────────────── */}
        <div className="lg:col-span-2 order-2 lg:order-1">

          {/* Department tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => { setActiveChip(dept); setSearchQuery(''); }}
                className={`shrink-0 text-[12.5px] px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 ${
                  activeChip === dept && !searchQuery
                    ? 'bg-primary-teal text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-teal/40 hover:text-primary-teal'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Section heading */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-gray-800">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : activeChip
              }
            </h2>
            <Link
              to="/doctors"
              className="text-[12.5px] font-medium text-primary-teal hover:text-primary-dark flex items-center gap-0.5 transition-colors"
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Doctor list — row style */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {doctorsLoading ? (
              /* Skeleton */
              <div className="divide-y divide-gray-50">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded w-36" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : filteredDoctors.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {filteredDoctors.map((doc) => {
                  const { bg, text } = getAvatarColor(doc.name);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/doctor/${doc.id}`)}
                      className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    >
                      {/* Avatar circle */}
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-[12px] font-bold ${text}`}>
                          {doc.initials || getDoctorInitials(doc.name)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 truncate leading-snug">
                          {doc.name}
                        </p>
                        <p className="text-[12px] text-gray-500 truncate mt-0.5">
                          {doc.department}
                          {doc.experienceYears ? ` · ${doc.experienceYears} yrs` : ''}
                        </p>
                      </div>

                      {/* Rating */}
                      {doc.rating && (
                        <div className="flex items-center gap-1 text-[12px] text-amber-600 shrink-0">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="font-medium">{doc.rating}</span>
                        </div>
                      )}

                      {/* Fee */}
                      <div className="hidden sm:block text-right shrink-0">
                        <p className="text-[13px] font-bold text-gray-900">₹{doc.consultationFee}</p>
                        <p className={`text-[10px] font-medium mt-0.5 ${doc.isAvailable ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {doc.isAvailable ? 'Available' : 'By appt.'}
                        </p>
                      </div>

                      {/* Book button — shows on hover */}
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/doctor/${doc.id}#book`); }}
                        className="shrink-0 text-[12px] font-semibold text-primary-teal border border-primary-teal/30 px-3 py-1.5 rounded-lg hover:bg-primary-teal hover:text-white transition-all duration-150 opacity-0 group-hover:opacity-100"
                      >
                        Book
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center text-sm text-gray-400">
                No doctors found. Try a different search.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN — Sidebar ─────────────────────────────── */}
        <div className="lg:col-span-1 order-1 lg:order-2 space-y-4 lg:sticky lg:top-20 self-start">

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
              Quick Actions
            </p>
            <div className="divide-y divide-gray-50">
              {[
                { to: '/doctors', icon: Calendar, label: 'Book Appointment', sub: 'Find & reserve a slot' },
                { to: '/appointments', icon: Clock, label: 'My Appointments', sub: 'View upcoming & past' },
                { to: '/profile', icon: FileText, label: 'Health Profile', sub: 'Records & ABHA ID' },
              ].map(({ to, icon: Icon, label, sub }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-teal/8 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800">{label}</p>
                    <p className="text-[11px] text-gray-400">{sub}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* WhatsApp Opt-in card (only if not opted in) */}
          {showReminders && !user?.whatsappOptedIn && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 relative">
              <button
                onClick={() => setShowReminders(false)}
                className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L0 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">WhatsApp Reminders</p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">
                    Get instant confirmations + GPS travel reminders.
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Gift className="h-3 w-3 text-amber-500" />
                    <span className="text-[11px] font-semibold text-amber-600">10% off next visit</span>
                  </div>
                </div>
              </div>
              <a
                href="https://wa.me/14155238886?text=I%20want%20to%20receive%20appointment%20reminders%20on%20WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 w-full py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[12px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                Enable Reminders
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 py-2">
            {[
              { label: 'ABDM Secure' },
              { label: 'HIPAA Compliant' },
              { label: 'Zero Spam' },
            ].map(({ label }) => (
              <span key={label} className="text-[10px] text-gray-400 font-medium">
                · {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
