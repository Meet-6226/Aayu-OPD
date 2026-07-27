import React, { useState, useEffect } from 'react';
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
  Heart,
  Stethoscope,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Video,
  MapPin,
  Languages,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDoctors } from '../hooks/useDoctors';
import { useAppointments } from '../hooks/useAppointments';

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

const getDoctorCareFocus = (dept) => {
  const focus = {
    'General Medicine': 'Comprehensive wellness, chronic illness supervision, and acute pain consults.',
    'Cardiology': 'Advanced cardiovascular screenings, hypertension care, and ECG evaluations.',
    'Dermatology': 'Clinical dermatology, acne treatment, skin allergy panels, and pathology scans.',
    'Orthopedics': 'Musculoskeletal therapy, joint pain management, and fracture recovery reviews.',
    'Neurology': 'Neurological evaluations, migraine care, sleep disorders, and neuropathy treatment.',
    'Gynecology': 'Maternal health supervision, wellness panels, and clinical gynecological consultations.',
  };
  return focus[dept] || 'Routine checkups, clinical diagnoses, and customized prescription setups.';
};

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
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-[#F5F7F8] font-sans text-[#374151]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── COMPACT CLINICAL HERO BANNER ──────────────────────────────── */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[18px] p-6 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#1E7F6A] bg-white border border-[#A7F3D0]/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                OPD Patient Hub
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#1E7F6A]/85 font-semibold">
                <ShieldCheck className="h-3 w-3 text-[#1E7F6A]" />
                ABHA Linked: 91-8273-9182-10
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-xs text-[#1E7F6A]/90">
              Track your appointments, view prescription plans, and consult verified medical specialists.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/80 border border-[#A7F3D0]/60 px-4 py-2.5 rounded-[12px] text-xs">
              <p className="text-[#1E7F6A]/75 uppercase font-bold text-[9px] tracking-wider">Today's Visits</p>
              <p className="text-base font-bold text-[#1E7F6A] mt-0.5 font-mono">
                {upcoming.length > 0 ? upcoming.filter(a => a.appointmentDate === new Date().toISOString().split('T')[0]).length : 0}
              </p>
            </div>
            <div className="bg-white/80 border border-[#A7F3D0]/60 px-4 py-2.5 rounded-[12px] text-xs">
              <p className="text-[#1E7F6A]/75 uppercase font-bold text-[9px] tracking-wider">OPD Wait Time</p>
              <div className="flex items-center gap-1 text-[#1E7F6A] font-bold mt-0.5">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>12 Mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── LINEAR-STYLE SEARCH ────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              placeholder="Search specialists, departments, or symptoms (e.g. Dr. Reddy, Cardiology)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-[12px] pl-12 pr-10 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E7F6A] focus:shadow-[0_0_0_3px_rgba(30,127,106,0.12)] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] flex-wrap text-left pl-1">
            <span className="font-semibold text-[#9CA3AF]">Popular:</span>
            {['General Medicine', 'Cardiology', 'Dermatology'].map(dept => (
              <button
                key={dept}
                onClick={() => { setActiveChip(dept); setSearchQuery(''); }}
                className="hover:text-[#1E7F6A] underline decoration-dotted transition-colors"
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* ── LAYOUT ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: Doctors List & Filters */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Horizontal Department Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
              <button
                onClick={() => setActiveChip('All')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shrink-0 ${
                  activeChip === 'All'
                    ? 'bg-[#1E7F6A] text-white'
                    : 'bg-white border border-[#E5E7EB] text-[#374151] hover:border-[#9CA3AF]'
                }`}
              >
                All Departments
              </button>
              {['General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology', 'Neurology', 'Gynecology'].map(dept => (
                <button
                  key={dept}
                  onClick={() => setActiveChip(activeChip === dept ? 'All' : dept)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shrink-0 ${
                    activeChip === dept
                      ? 'bg-[#1E7F6A] text-white'
                      : 'bg-white border border-[#E5E7EB] text-[#374151] hover:border-[#9CA3AF]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Doctor Cards */}
            <div className="space-y-4">
              {doctorsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 animate-pulse flex gap-4">
                    <div className="w-14 h-14 bg-[#F3F4F6] rounded-[12px] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#F3F4F6] rounded w-1/3" />
                      <div className="h-3 bg-[#F3F4F6] rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/doctor/${doc.id}`)}
                    className="bg-white border border-[#E5E7EB] hover:border-[#1E7F6A] rounded-[18px] p-6 cursor-pointer hover:shadow-[0_12px_30px_rgba(30,127,106,0.04)] transition-all duration-300 transform hover:-translate-y-[2px] group text-left relative overflow-hidden"
                  >
                    {/* Subtle border indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#1E7F6A] transition-all duration-300" />
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-5">
                      
                      {/* Left: Info */}
                      <div className="flex items-start gap-4.5 min-w-0">
                        {/* Avatar container */}
                        <div className="w-14 h-14 bg-[#F0FDF4] border border-[#DCFCE7] text-[#1E7F6A] font-bold rounded-[14px] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                          <span className="font-sans tracking-tight text-base font-bold uppercase">{getDoctorInitials(doc.name)}</span>
                        </div>

                        <div className="min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#1E7F6A] transition-colors duration-150 tracking-tight">
                              {doc.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#1E7F6A] bg-[#ECFDF5] border border-[#A7F3D0]/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Verified
                            </span>
                            {doc.offersOnlineConsultation && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0284c7] bg-[#f0f9ff] border border-[#bae6fd] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                <Video className="h-2.5 w-2.5" />
                                Video
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#475569] font-medium">
                            {doc.qualifications} · <span className="text-[#0f766e]">{doc.experienceYears ? `${doc.experienceYears} Years Exp` : 'Senior Specialist'}</span>
                          </p>
                          
                          {/* Clinical care focus statement */}
                          <p className="text-[11px] text-[#6b7280] leading-relaxed italic max-w-lg">
                            "{getDoctorCareFocus(doc.department)}"
                          </p>

                          <div className="flex items-center gap-2 text-xs flex-wrap pt-0.5">
                            <span className="font-semibold text-xs text-[#1E7F6A] bg-[#e5f9f8] px-2.5 py-0.5 rounded-full">{doc.department}</span>
                            <span className="text-[#cbd5e1] font-light">|</span>
                            <div className="flex gap-1.5 items-center">
                              {getDoctorLanguages(doc.id).split(', ').map(lang => (
                                <span key={lang} className="bg-[#FAFBFB] border border-[#E5E7EB] text-[#475569] text-[10px] font-medium px-2 py-0.5 rounded-[6px]">
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Fee & Action */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-4 w-full sm:w-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#F3F4F6] min-w-[130px]">
                        <div className="text-left sm:text-right space-y-0.5">
                          <div className="inline-flex items-center gap-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] font-bold text-[10px] px-2 py-0.5 rounded-[6px] shadow-sm">
                            <Star className="h-3 w-3 fill-[#D97706] text-[#D97706]" />
                            <span>{doc.rating?.toFixed(1) || '4.9'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wider block font-semibold">Consultation Fee</span>
                            <p className="text-sm font-bold text-[#111827] font-mono">₹{doc.consultationFee}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doc.id}`); }}
                          className="px-4 py-2 bg-[#1E7F6A] hover:bg-[#165B52] text-white text-xs font-semibold rounded-[10px] shadow-[0_2px_4px_rgba(30,127,106,0.1)] hover:shadow-[0_4px_12px_rgba(30,127,106,0.2)] transition-all duration-200 flex items-center gap-1.5 group-hover:translate-x-0.5"
                        >
                          Book Slot
                          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-[14px] py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <p className="text-sm font-semibold text-[#374151]">No specialists match your selection</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Try typing a different name or clearing department filters.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveChip('All'); }}
                    className="mt-4 text-xs font-semibold text-[#1E7F6A] hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Unified Widget Command Center */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Unified Command Center Widget */}
            <div className="bg-[#FAFBFB] border border-[#E5E7EB] rounded-[14px] p-5 space-y-5 text-left">
              <div>
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Command Center</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">Quick actions and links for your healthcare care plans.</p>
              </div>

              {/* Quick Actions List */}
              <div className="space-y-1.5">
                {[
                  { to: '/doctors', icon: Calendar, label: 'Book Appointment', desc: 'Book physical or video consults' },
                  { to: '/appointments', icon: Clock, label: 'My Appointments', desc: 'Track upcoming medical slots' },
                  { to: '/reports', icon: FileText, label: 'My Prescriptions', desc: 'Download digital Rx copies' }
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-white border border-transparent hover:border-[#E5E7EB] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-[8px] bg-[#ECFDF5] text-[#1E7F6A] flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#111827] group-hover:text-[#1E7F6A] transition-colors">{action.label}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{action.desc}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#D1D5DB] group-hover:text-[#1E7F6A] transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>

              <div className="h-px bg-[#F3F4F6]" />

              {/* WhatsApp Alerts */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <MessageSquare className="h-4.5 w-4.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#111827]">WhatsApp Reminders</h4>
                    <p className="text-[10px] text-[#6B7280]">Receive real-time delay buffers and automatic slot recovery pings.</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/14155238886?text=I%20want%20to%20receive%20appointment%20reminders%20on%20WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-[10px] transition-colors duration-150"
                >
                  Enable WhatsApp Alerts
                </a>
              </div>

              <div className="h-px bg-[#F3F4F6]" />

              {/* Emergency Hotline */}
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[10px] space-y-2">
                <div className="flex items-center gap-2 text-[#DC2626]">
                  <PhoneCall className="h-4.5 w-4.5 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Emergency Hotline</span>
                </div>
                <p className="text-[11px] text-[#7F1D1D] leading-relaxed">
                  Call the Apollo emergency response unit or dispatch an ambulance. Hotline active 24/7.
                </p>
                <a
                  href="tel:1066"
                  className="block text-center py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-[8px] transition-colors duration-150"
                >
                  Call Helpline (1066)
                </a>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
