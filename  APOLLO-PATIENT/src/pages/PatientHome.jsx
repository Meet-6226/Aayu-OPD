import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  FileText,
  X,
  Star,
  ChevronRight,
  Gift,
  ArrowRight,
  Activity,
  Heart,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  PhoneCall,
  User,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDoctors } from '../hooks/useDoctors';
import { useAppointments } from '../hooks/useAppointments';

// Avatar color palette — 6 muted colors based on name initial
const AVATAR_COLORS = [
  { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  { bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { bg: 'bg-emerald-100',text: 'text-emerald-700'},
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

const specialtyCategories = [
  { name: 'General Medicine', count: '14 Doctors', icon: Stethoscope, color: 'bg-teal-50 text-teal-600' },
  { name: 'Cardiology',       count: '8 Doctors',  icon: Heart,       color: 'bg-rose-50 text-rose-600' },
  { name: 'Orthopedics',      count: '10 Doctors', icon: Activity,    color: 'bg-amber-50 text-amber-600' },
  { name: 'Dermatology',      count: '6 Doctors',  icon: Sparkles,    color: 'bg-purple-50 text-purple-600' },
  { name: 'Neurology',        count: '5 Doctors',  icon: Activity,    color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Pediatrics',       count: '7 Doctors',  icon: Heart,       color: 'bg-emerald-50 text-emerald-600' },
];

export default function PatientHome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [showReminders, setShowReminders] = useState(true);
  const navigate = useNavigate();

  const { doctors, loading: doctorsLoading, fetchAllDoctors } = useDoctors();
  const { upcoming, fetchAppointments, loading: apptsLoading } = useAppointments();

  useEffect(() => { fetchAllDoctors(); }, [fetchAllDoctors]);
  useEffect(() => {
    const patientId = user?.uid || user?.id || (user?.phoneNumber ? user.phoneNumber.replace(/\D/g, '') : null) || (user?.email ? user.email.replace(/[^a-zA-Z0-9_-]/g, '') : null) || 'patient_priya_demo';
    fetchAppointments(patientId);
  }, [user, fetchAppointments]);

  const getFilteredDoctors = () => {
    let result = doctors;
    if (activeChip !== 'All') {
      result = result.filter(d => d.department === activeChip);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.department || '').toLowerCase().includes(q) ||
        (d.qualifications || '').toLowerCase().includes(q)
      );
    }
    return result;
  };

  const filteredDoctors = getFilteredDoctors();

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">

      {/* ── 1. HERO GREETING & HEALTH DASHBOARD BANNER ──────────────── */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Welcome Text */}
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 border border-white/10 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Apollo Hospitals · OPD Live Portal</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Priya'} 👋
            </h1>

            <p className="text-xs md:text-sm text-teal-100/80 leading-relaxed max-w-xl">
              Book expert doctor consultations, view live OPD queue status, manage ABHA digital health records, and receive instant WhatsApp appointment updates.
            </p>

            {/* ABHA Badge */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ABHA ID: 91-8273-9182-10
              </div>
              <span className="text-xs text-teal-200/60">Verified Patient Profile</span>
            </div>
          </div>

          {/* Quick Vitals Summary Box */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">My Health Vitals</span>
              <span className="text-[10px] text-gray-300 bg-white/10 px-2 py-0.5 rounded">Synced Today</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] text-teal-200 uppercase font-semibold">Blood Pressure</p>
                <p className="text-sm font-bold text-white mt-0.5">120/80</p>
                <p className="text-[9px] text-emerald-400 font-medium">Normal</p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] text-teal-200 uppercase font-semibold">Heart Rate</p>
                <p className="text-sm font-bold text-white mt-0.5">72 bpm</p>
                <p className="text-[9px] text-emerald-400 font-medium">Optimal</p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] text-teal-200 uppercase font-semibold">Blood Group</p>
                <p className="text-sm font-bold text-white mt-0.5">O Positive</p>
                <p className="text-[9px] text-teal-300 font-medium">ABDM Sync</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. UPCOMING VISIT HIGHLIGHT BANNER (If Active) ───────────── */}
      {!apptsLoading && upcoming.length > 0 && (
        <Link
          to={`/appointment/${upcoming[0].id}`}
          className="block group"
        >
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-emerald-600/20">
                {getDoctorInitials(upcoming[0].doctorName)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Confirmed Visit Today
                  </span>
                  <span className="text-xs text-gray-500 font-medium">OPD Room 302</span>
                </div>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {upcoming[0].doctorName}
                  <span className="text-sm font-normal text-gray-500"> · {upcoming[0].department}</span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  {upcoming[0].appointmentDate} at {upcoming[0].appointmentTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl group-hover:bg-emerald-700 transition-colors shadow">
                View Queue Token &rarr;
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* ── 3. SPECIALTY CATEGORIES QUICK ACCESS ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 font-display">
            Browse OPD Specialties
          </h2>
          <span className="text-xs text-gray-500 font-medium">Top Apollo Departments</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {specialtyCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeChip === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveChip(isSelected ? 'All' : cat.name);
                  setSearchQuery('');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-primary-teal text-white border-primary-teal shadow-md shadow-teal-500/20'
                    : 'bg-white border-gray-200 hover:border-primary-teal/40 hover:shadow-sm text-gray-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-white/20 text-white' : cat.color
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <p className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {cat.name}
                  </p>
                  <p className={`text-[10.5px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>
                    {cat.count}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. TWO-COLUMN MAIN CONTENT GRID ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT 8 COLS: Search & Doctor List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search bar & filter pills */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or qualification..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 transition-all"
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

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
              <button
                onClick={() => setActiveChip('All')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeChip === 'All'
                    ? 'bg-primary-teal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Specialists ({doctors.length})
              </button>
              {['General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology', 'Neurology', 'ENT', 'Gynecology'].map(dept => (
                <button
                  key={dept}
                  onClick={() => setActiveChip(dept)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                    activeChip === dept
                      ? 'bg-primary-teal text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 font-display">
              {searchQuery ? `Search Results (${filteredDoctors.length})` : `${activeChip} Doctors Available Today`}
            </h3>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
              Live Slot Sync Active
            </span>
          </div>

          {/* Doctor Cards List */}
          <div className="space-y-3">
            {doctorsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-48" />
                      <div className="h-3 bg-gray-100 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc) => {
                const { bg, text } = getAvatarColor(doc.name);
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/doctor/${doc.id}`)}
                    className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-primary-teal/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-3.5">
                        {/* Avatar */}
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className={`text-base sm:text-lg font-bold ${text}`}>
                            {doc.initials || getDoctorInitials(doc.name)}
                          </span>
                        </div>

                        {/* Details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-gray-900 group-hover:text-primary-teal transition-colors">
                              {doc.name}
                            </h4>
                            {doc.rating && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                <Star className="h-3 w-3 fill-current" />
                                {doc.rating}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {doc.qualifications || doc.department} · {doc.experienceYears ? `${doc.experienceYears} Years Exp` : 'Apollo Expert'}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary-teal" />
                              Apollo OPD Block A
                            </span>
                            <span>·</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Next Slot: Today 10:30 AM
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fee & Action */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-400">Consultation Fee</p>
                          <p className="text-lg font-extrabold text-gray-900">₹{doc.consultationFee}</p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctor/${doc.id}`);
                          }}
                          className="px-4 py-2 bg-primary-teal text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-1"
                        >
                          <span>Book Slot</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center text-sm text-gray-400">
                No doctors matching your criteria. Try resetting filters.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 4 COLS: Multi-Widget Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Widget 1 — Patient ABHA Profile Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-gray-900">Patient ABHA Health ID</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                ACTIVE
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Patient Name:</span>
                <span className="font-bold text-gray-900">{user?.name || 'Priya Sharma'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ABHA ID:</span>
                <span className="font-mono font-bold text-primary-teal">91-8273-9182-10</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Primary Clinic:</span>
                <span className="font-medium text-gray-800">Apollo Greams Road</span>
              </div>
            </div>

            <Link
              to="/profile"
              className="mt-3.5 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors border border-gray-200"
            >
              <span>Manage ABHA Records</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Widget 2 — Quick Services */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Apollo OPD Quick Desk
            </h4>

            <div className="space-y-1.5">
              {[
                { to: '/doctors', icon: Calendar, title: 'Book Doctor Visit', sub: 'Instant slot confirmation' },
                { to: '/appointments', icon: Clock, title: 'My Appointments & Token', sub: 'Live queue position' },
                { to: '/profile', icon: FileText, title: 'Lab Reports & Prescriptions', sub: 'Download PDF' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-primary-teal transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Widget 3 — WhatsApp Alerts Opt-in Card */}
          {showReminders && (
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm relative">
              <button
                onClick={() => setShowReminders(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L0 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">WhatsApp OPD Alerts</p>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    Get instant appointment confirmations & live queue alerts on your phone.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <Gift className="h-3 w-3" />
                    <span>Free Health Check Voucher Included</span>
                  </div>
                </div>
              </div>

              <a
                href="https://wa.me/14155238886?text=I%20want%20to%20receive%20appointment%20reminders%20on%20WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 w-full py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <span>Enable WhatsApp Sync</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Widget 4 — Emergency Helpline Card */}
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <PhoneCall className="h-4 w-4" />
              <span>Apollo 24/7 OPD Emergency</span>
            </div>
            <p className="text-[11px] text-rose-900/80">
              For urgent ambulance or emergency hospital admission call <strong>1066</strong>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

