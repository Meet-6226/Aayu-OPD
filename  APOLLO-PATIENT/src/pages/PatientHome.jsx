import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Clock,
  FileText,
  X,
  Star,
  ChevronRight,
  Activity,
  PhoneCall,
  MessageSquare,
  Video,
  MapPin,
  Languages,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDoctors } from '../hooks/useDoctors';
import { useAppointments } from '../hooks/useAppointments';

const getDoctorInitials = (name) => {
  if (!name) return 'DR';
  const clean = name.replace(/^Dr\.\s+/i, '').trim();
  return clean.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getDoctorLanguages = (id) => {
  const langs = {
    doc_001: 'English, Hindi, Gujarati',
    doc_002: 'English, Tamil, Telugu',
    doc_003: 'English, Malayalam, Hindi',
    doc_004: 'English, Telugu, Hindi',
    doc_005: 'English, Marathi, Hindi',
    doc_006: 'English, Malayalam, Tamil',
    doc_007: 'English, Hindi, Kannada',
    doc_008: 'English, Telugu, Kannada',
    doc_009: 'English, Bengali, Hindi',
    doc_010: 'English, Telugu, Hindi',
  };
  return langs[id] || 'English, Hindi';
};

const formatApptTime = (dateStr, timeStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const dateLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return timeStr ? `${dateLabel} · ${timeStr}` : dateLabel;
  } catch {
    return dateStr;
  }
};

const ACTIVITY_FEED = [
  { id: 1, type: 'confirmed', text: 'Appointment confirmed with Dr. Reddy', time: '2h ago' },
  { id: 2, type: 'prescription', text: 'Prescription available — General Medicine', time: 'Yesterday' },
  { id: 3, type: 'alert', text: 'Queue update: estimated wait 12 min', time: 'Yesterday' },
];

export default function PatientHome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const navigate = useNavigate();

  const { doctors, loading: doctorsLoading, fetchAllDoctors } = useDoctors();
  const { upcoming, fetchAppointments, loading: apptsLoading } = useAppointments();

  useEffect(() => { fetchAllDoctors(); }, [fetchAllDoctors]);
  useEffect(() => {
    const patientId = user?.uid || user?.id || (user?.phoneNumber ? user.phoneNumber.replace(/\D/g, '') : null) || (user?.email ? user.email.replace(/[^a-zA-Z0-9_-]/g, '') : null) || 'patient_priya_demo';
    fetchAppointments(patientId);
  }, [user, fetchAppointments]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = upcoming.filter(a => a.appointmentDate === todayStr);
  const nextAppt = upcoming[0];
  const pendingConfirmations = upcoming.filter(a => (a.status || '').toLowerCase() === 'pending').length;

  const getFilteredDoctors = () => {
    let result = doctors;
    if (activeChip !== 'All') result = result.filter(d => d.department === activeChip);
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
  const lastSynced = useMemo(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), []);

  const kpis = [
    { label: 'Upcoming', value: upcoming.length, sub: 'Scheduled visits', icon: Calendar, accent: 'text-[#0f766e]' },
    { label: "Today's Visits", value: todayAppts.length, sub: todayStr, icon: Activity, accent: 'text-[#2563eb]' },
    { label: 'Est. Wait', value: '12 min', sub: 'Live queue', icon: Clock, accent: 'text-[#475569]' },
    { label: 'Pending', value: pendingConfirmations, sub: 'Confirmations', icon: AlertCircle, accent: pendingConfirmations > 0 ? 'text-[#d97706]' : 'text-[#475569]' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-[#E2E8F0] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Patient Dashboard</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#0d9488] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488]" />
                Connected
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">
              {user?.name || 'Patient Account'}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 font-mono-data">
              ID {user?.patientId || user?.uid?.slice(0, 8) || '—'} · ABHA linked · Synced {lastSynced}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#475569] bg-white border border-[#E2E8F0] rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
            >
              <Bell className="h-3.5 w-3.5" />
              Alerts
            </Link>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0f766e] rounded-[8px] hover:bg-[#0d5a54] transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Appointments
            </Link>
          </div>
        </div>

        {/* ── KPI row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(({ label, value, sub, icon: Icon, accent }) => (
            <div key={label} className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-elev-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</span>
                <Icon className={`h-3.5 w-3.5 ${accent}`} />
              </div>
              <p className={`text-2xl font-semibold tracking-tight ${accent}`}>{apptsLoading && label !== 'Est. Wait' ? '—' : value}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">

            {/* Next appointment */}
            {nextAppt && (
              <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-elev-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Next Appointment</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border ${
                    (nextAppt.status || '').toLowerCase() === 'confirmed'
                      ? 'bg-[#F0FDFA] text-[#0f766e] border-[#CCFBF1]'
                      : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                  }`}>
                    {(nextAppt.status || 'Scheduled').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{nextAppt.doctorName || 'Consultation'}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{nextAppt.department} · {formatApptTime(nextAppt.appointmentDate, nextAppt.appointmentTime)}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{nextAppt.room || 'OPD Block A'}</span>
                      {nextAppt.consultationMode === 'online' && (
                        <span className="inline-flex items-center gap-1 text-[#2563eb]"><Video className="h-3 w-3" />Video</span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/appointments/${nextAppt.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#0f766e] bg-[#F0FDFA] border border-[#CCFBF1] rounded-[8px] hover:bg-[#CCFBF1] transition-colors shrink-0"
                  >
                    View details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search doctors, departments, symptoms…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-[8px] pl-10 pr-9 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0f766e] focus:shadow-[0_0_0_2px_rgba(15,118,110,0.12)] transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] flex-wrap">
                <span className="font-medium text-[#94A3B8]">Popular:</span>
                {['General Medicine', 'Cardiology', 'Dermatology'].map(dept => (
                  <button key={dept} onClick={() => { setActiveChip(dept); setSearchQuery(''); }} className="hover:text-[#0f766e] underline decoration-dotted">
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Department filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['All', 'General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology', 'Neurology', 'Gynecology'].map(dept => (
                <button
                  key={dept}
                  onClick={() => setActiveChip(dept === activeChip && dept !== 'All' ? 'All' : dept)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold shrink-0 transition-colors ${
                    (dept === 'All' && activeChip === 'All') || activeChip === dept
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                  }`}
                >
                  {dept === 'All' ? 'All Departments' : dept}
                </button>
              ))}
            </div>

            {/* Doctor list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Available Specialists</h2>
                <Link to="/doctors" className="text-[11px] font-semibold text-[#0f766e] hover:underline">View all</Link>
              </div>

              {doctorsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 animate-pulse flex gap-3">
                    <div className="w-11 h-11 bg-[#F1F5F9] rounded-[8px] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[#F1F5F9] rounded w-1/3" />
                      <div className="h-3 bg-[#F1F5F9] rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredDoctors.length > 0 ? (
                filteredDoctors.slice(0, 6).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/doctor/${doc.id}`)}
                    className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 cursor-pointer hover:border-[#CBD5E1] transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] font-semibold rounded-[8px] flex items-center justify-center shrink-0 text-sm">
                          {getDoctorInitials(doc.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0f766e] transition-colors">{doc.name}</h3>
                            {doc.offersOnlineConsultation && (
                              <span className="text-[9px] font-semibold text-[#2563eb] bg-[#EFF6FF] px-1.5 py-0.5 rounded-[4px] uppercase">Video</span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {doc.department} · {doc.experienceYears ? `${doc.experienceYears} yrs` : 'Consultant'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#94A3B8] flex-wrap">
                            <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 text-[#D97706]" />{doc.rating?.toFixed(1) || '4.9'}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5"><Languages className="h-3 w-3" />{getDoctorLanguages(doc.id).split(', ')[0]}</span>
                            <span>·</span>
                            <span className="font-mono-data text-[#475569]">₹{doc.consultationFee}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doc.id}`); }}
                        className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d5a54] text-white text-[11px] font-semibold rounded-[8px] shrink-0"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-[10px] py-12 text-center">
                  <p className="text-sm font-medium text-[#475569]">No specialists match your filters</p>
                  <button onClick={() => { setSearchQuery(''); setActiveChip('All'); }} className="mt-2 text-xs font-semibold text-[#0f766e] hover:underline">
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Quick actions */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-elev-1">
              <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { to: '/doctors', icon: Calendar, label: 'Book Appointment' },
                  { to: '/appointments', icon: Clock, label: 'My Appointments' },
                  { to: '/reports', icon: FileText, label: 'Prescriptions' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] hover:bg-[#F8FAFC] transition-colors group">
                    <div className="w-7 h-7 rounded-[6px] bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-[#475569]" />
                    </div>
                    <span className="text-xs font-medium text-[#0F172A] flex-1">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#CBD5E1] group-hover:text-[#64748B]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-elev-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Recent Activity</h3>
                <RefreshCw className="h-3 w-3 text-[#94A3B8]" />
              </div>
              <div className="space-y-3">
                {ACTIVITY_FEED.map(item => (
                  <div key={item.id} className="flex gap-2.5">
                    <div className={`w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 ${
                      item.type === 'alert' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F0FDFA] text-[#0f766e]'
                    }`}>
                      {item.type === 'alert' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#475569] leading-snug">{item.text}</p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4">
              <div className="flex items-start gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-[#0F172A]">Appointment Reminders</h4>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Receive schedule updates via WhatsApp.</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${(DEMO_CONFIG.twilioWhatsappNumber || 'whatsapp:+17372508034').replace('whatsapp:+', '')}?text=${encodeURIComponent(DEMO_CONFIG.twilioSandboxCode || 'join twilio-trial')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[8px] transition-colors"
              >
                Enable Reminders
              </a>
            </div>

            {/* Emergency */}
            <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[10px] p-4">
              <div className="flex items-center gap-2 text-[#BE123C] mb-2">
                <PhoneCall className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Emergency</span>
              </div>
              <p className="text-[11px] text-[#9F1239] leading-relaxed mb-3">
                For medical emergencies, contact your nearest emergency services immediately.
              </p>
              <a href="tel:108" className="block text-center py-2 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-semibold rounded-[8px] transition-colors">
                Call 108
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
