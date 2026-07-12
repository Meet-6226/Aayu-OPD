import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Clock, FileText, X, Star, ChevronRight, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DEMO_CONFIG } from '../utils/demoConfig';
import { useDoctors } from '../hooks/useDoctors';
import { useAppointments } from '../hooks/useAppointments';

const getDoctorInitials = (name) => {
  if (!name) return 'DR';
  const cleanName = name.replace(/^Dr\.\s+/i, '').trim();
  return cleanName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function PatientHome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('General Medicine');
  const [showReminders, setShowReminders] = useState(true);
  const navigate = useNavigate();

  const { doctors, loading: doctorsLoading, fetchAllDoctors } = useDoctors();
  const { upcoming, fetchAppointments, loading: apptsLoading } = useAppointments();

  // Load all doctors on mount
  useEffect(() => {
    fetchAllDoctors();
  }, [fetchAllDoctors]);

  // Load patient appointments on mount/user change
  useEffect(() => {
    if (user?.uid) {
      fetchAppointments(user.uid);
    }
  }, [user?.uid, fetchAppointments]);



  const departments = [
    "General Medicine", "Cardiology", "Orthopedics", "Dermatology",
    "Neurology", "ENT", "Gynecology", "Pediatrics"
  ];

  // Search and filter logic
  const getFilteredDoctors = () => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return doctors.filter(doc => 
        (doc.name || "").toLowerCase().includes(q) ||
        (doc.department || "").toLowerCase().includes(q) ||
        (doc.qualifications || "").toLowerCase().includes(q)
      );
    }
    // Default department-based list
    return doctors.filter(doc => doc.department === activeChip);
  };

  const filteredDoctors = getFilteredDoctors();

  // Sort by rating descending and take top 5
  const topRatedDoctors = [...doctors]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  const handleCardClick = (id) => {
    navigate(`/doctor/${id}`);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 bg-transparent font-sans text-text-medium pb-12">
      
      {/* Welcome Hero Banner */}
      <div className="relative mt-8 bg-gradient-to-r from-primary-teal to-[#133b38] rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl glow-shadow-teal">
        {/* Glow decorative graphics */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tr from-[#10b981]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold select-none">
              <Sparkles className="h-3.5 w-3.5 text-[#10b981]" />
              <span>Apollo Intelligence Active</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight mt-2">
              Welcome back, {user?.name || "Sahil Pandey"} 👋
            </h1>
            <p className="text-sm text-white/80 max-w-[520px] leading-relaxed">
              Find best-in-class specialists, track real-world traffic transit times, and experience zero-waiting-time OPD clinics.
            </p>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex items-center space-x-4 shrink-0 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl select-none">
            <div className="text-left">
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider leading-none">ABHA Health ID</p>
              <p className="text-sm font-extrabold text-white mt-1 leading-none">
                {user?.abhaId ? user.abhaId : "Not Linked"}
              </p>
              <p className="text-[9.5px] text-[#10b981] font-bold mt-1.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
                <span>ABDM Secure</span>
              </p>
            </div>
            <div className="w-[1px] h-10 bg-white/10"></div>
            <div className="text-left">
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider leading-none">Trust Score</p>
              <p className="text-sm font-extrabold text-white mt-1 leading-none">{user?.trustScore ?? 100}%</p>
              <p className="text-[9.5px] text-white/70 mt-1.5 font-medium leading-none font-sans">Priority Booking</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR (Full width above grid) */}
      <div className="mt-8 max-w-[640px]">
        <div className="bg-white/80 backdrop-blur-md border border-border-custom rounded-2xl px-4.5 py-3.5 flex items-center transition-all duration-300 focus-within:border-primary-teal focus-within:ring-4 focus-within:ring-primary-teal/10 shadow-sm">
          <Search className="h-[18px] w-[18px] text-text-light mr-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Search doctors, departments, specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[15px] text-text-dark placeholder-[#9ca3af] p-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 hover:text-text-dark shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
        
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-10">
          
          {/* Section 1 — Browse by Department */}
          <div>
            <h2 className="text-[19px] font-bold text-text-dark font-display mb-4 text-left">
              Browse by Department
            </h2>

            {/* Department chips */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setActiveChip(dept);
                    setSearchQuery(''); // clear search when switching tabs
                  }}
                  className={`text-[13.5px] px-4.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
                    activeChip === dept && searchQuery === ''
                      ? 'bg-gradient-to-r from-primary-teal to-[#10b981] text-white font-semibold shadow-md shadow-primary-teal/15'
                      : 'bg-white/60 backdrop-blur-sm border border-border-custom text-text-medium hover:border-primary-teal/40 hover:text-primary-teal'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Doctor list */}
            <div className="space-y-4">
              {doctorsLoading ? (
                <div className="text-center py-12 text-text-light font-medium bg-white/55 border border-border-custom rounded-2xl">Loading specialists...</div>
              ) : filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleCardClick(doc.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-border-custom/80 rounded-2xl p-5 hover:border-primary-teal/30 hover:scale-[1.015] hover:shadow-lg transition-all duration-300 cursor-pointer text-left"
                  >
                    <div className="flex items-start sm:items-center space-x-4">
                      {/* Avatar initials */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-light-teal to-teal-50 flex items-center justify-center shrink-0 border border-primary-teal/10 shadow-inner">
                        <span className="text-[15px] font-bold text-primary-teal font-display">
                          {doc.initials || "DR"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[15px] font-bold text-text-dark font-display leading-tight">
                          {doc.name}
                        </h4>
                        <p className="text-[12.5px] text-[#6b7280] leading-none">
                          {doc.department} · <span className="font-semibold text-text-medium">{doc.experienceYears || 5} yrs exp</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{doc.rating || '4.5'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                            doc.isAvailable 
                              ? 'bg-green-500/10 text-green-700' 
                              : 'bg-text-light/10 text-text-medium'
                          }`}>
                            {doc.isAvailable ? "Available Today" : "By Appointment"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-5 mt-4 sm:mt-0 border-t border-[#e5e7eb]/40 sm:border-none pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-text-light font-medium uppercase tracking-wider leading-none">Fee</p>
                        <p className="text-base font-extrabold text-text-dark mt-0.5">₹{doc.consultationFee}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/${doc.id}#book`);
                        }}
                        className="bg-primary-teal text-white text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-primary-dark shadow-md shadow-primary-teal/10 hover:shadow-primary-teal/20 transition-all cursor-pointer"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#f9fafb]/50 border border-border-custom rounded-2xl p-12 text-center text-text-light">
                  No doctors matching your search query.
                </div>
              )}
            </div>
          </div>

          {/* Section 2 — Top Rated Doctors */}
          <div>
            <div className="flex items-center justify-between mb-4.5">
              <h2 className="text-[19px] font-bold text-text-dark font-display text-left">
                Top Rated Doctors
              </h2>
              <Link to="/doctors" className="text-[13.5px] font-bold text-primary-teal hover:text-primary-dark transition-colors flex items-center">
                <span>See all specialists</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {topRatedDoctors.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/doctor/${doc.id}`}
                  className="bg-white border border-border-custom/80 rounded-2xl p-4 text-center hover:shadow-lg hover:border-primary-teal/30 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-light-teal to-teal-50 flex items-center justify-center mx-auto shrink-0 border border-primary-teal/10 shadow-inner">
                      <span className="text-[14px] font-bold text-primary-teal font-display">
                        {doc.initials || "DR"}
                      </span>
                    </div>
                    <h4 className="text-[13.5px] font-bold text-text-dark mt-3.5 truncate font-display">
                      {doc.name}
                    </h4>
                    <p className="text-[11.5px] text-[#6b7280] mt-0.5 truncate">
                      {doc.department}
                    </p>
                    <div className="flex items-center justify-center space-x-1 mt-2 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-lg w-max mx-auto">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{doc.rating || '4.5'}</span>
                    </div>
                  </div>
                  <span className="text-[12.5px] font-bold text-primary-teal mt-4.5 inline-block group-hover:translate-x-0.5 transition-transform">
                    Book &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Sidebar - 1/3 width, appears first on mobile via order property) */}
        <div className="lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-24 self-start space-y-5">
             {/* Card 1 — Upcoming Appointment */}
          {apptsLoading ? (
            <div className="bg-white border border-border-custom rounded-2xl p-6 text-center text-text-light animate-pulse text-xs">
              Loading upcoming consultations…
            </div>
          ) : upcoming.length > 0 ? (
            <div className="bg-white border border-border-custom/80 rounded-2xl p-5 border-l-4 border-l-[#10b981] shadow-md hover:shadow-lg transition-all duration-300 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-[#e5e7eb]/40">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-text-light uppercase font-display">
                    UPCOMING VISIT
                  </span>
                </div>
                <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md capitalize">
                  {upcoming[0].status}
                </span>
              </div>

              <div className="mt-4 flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-light-teal to-teal-50 flex items-center justify-center shrink-0 border border-primary-teal/10">
                  <span className="text-[14px] font-bold text-primary-teal font-display">
                    {getDoctorInitials(upcoming[0].doctorName)}
                  </span>
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="text-[14.5px] font-bold text-text-dark leading-tight truncate font-display">
                    {upcoming[0].doctorName}
                  </h4>
                  <p className="text-[12.5px] text-[#6b7280] leading-none">
                    {upcoming[0].department}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[12.5px] text-text-medium pt-1">
                    <Calendar className="h-3.5 w-3.5 text-text-light shrink-0" />
                    <span className="truncate font-semibold">{upcoming[0].appointmentDate} · {upcoming[0].appointmentTime}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[12.5px] text-[#6b7280]">
                    <MapPin className="h-3.5 w-3.5 text-text-light shrink-0" />
                    <span className="truncate">{upcoming[0].hospital || "Apollo Hospital"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e5e7eb]/45 mt-4 pt-3.5 flex items-center justify-between">
                <Link to={`/appointment/${upcoming[0].id}`} className="text-[13.5px] font-bold text-primary-teal hover:text-primary-dark transition-colors">
                  View Details &rarr;
                </Link>
                <button 
                  onClick={() => navigate(`/appointment/${upcoming[0].id}`)}
                  className="text-[13px] font-bold text-text-light hover:text-text-medium transition-colors"
                >
                  Reschedule
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border-custom/80 rounded-2xl p-6 text-center shadow-sm">
              <Calendar className="h-7 w-7 text-primary-teal mx-auto mb-2.5 opacity-60" />
              <h4 className="text-[14.5px] font-bold text-text-dark font-display">No upcoming consultations</h4>
              <p className="text-[12px] text-text-light mt-1.5 mb-4 leading-normal">
                Consult with our board-certified Apollo specialists in-person or online today.
              </p>
              <Link 
                to="/doctors"
                className="inline-block bg-primary-teal text-white text-[12px] font-bold px-4 py-2.5 rounded-xl hover:bg-primary-dark shadow-sm transition-all duration-200"
              >
                Find a Doctor
              </Link>
            </div>
          )}

          {/* Card 2 — Quick Actions */}
          <div className="bg-white border border-border-custom/80 rounded-2xl py-4 shadow-sm text-left">
            <span className="text-[10px] font-bold tracking-widest text-[#9ca3af] uppercase px-4.5 block mb-2 font-display">
              QUICK ACTIONS
            </span>
            <div className="space-y-0.5 px-2">
              <Link
                to="/doctors"
                className="flex items-center space-x-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-text-medium hover:text-text-dark transition-all duration-200"
              >
                <Calendar className="h-4.5 w-4.5 text-primary-teal shrink-0" />
                <span className="text-[13.5px] font-semibold">Book Appointment</span>
              </Link>
              <Link
                to="/appointments"
                className="flex items-center space-x-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-text-medium hover:text-text-dark transition-all duration-200"
              >
                <Clock className="h-4.5 w-4.5 text-primary-teal shrink-0" />
                <span className="text-[13.5px] font-semibold">Appointment History</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-text-medium hover:text-text-dark transition-all duration-200"
              >
                <FileText className="h-4.5 w-4.5 text-primary-teal shrink-0" />
                <span className="text-[13.5px] font-semibold">Health Records</span>
              </Link>
            </div>
          </div>

          {/* Card 3 — Enable WhatsApp Reminders */}
          {showReminders && !user?.whatsappOptedIn && (
            <div className="bg-white border border-border-custom/80 rounded-2xl p-5.5 relative shadow-sm text-left animate-pulse-glow-accent">
              <button
                onClick={() => setShowReminders(false)}
                className="absolute top-4 right-4 text-text-light hover:text-text-medium transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* WhatsApp Icon + Heading */}
              <div className="flex items-center space-x-2.5">
                <div className="relative flex h-5 w-5 shrink-0">
                  <svg
                    className="text-[#25D366] shrink-0"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 .953 11.453.953 6.014.953 1.59 5.325 1.586 10.75c-.001 1.7.447 3.361 1.299 4.816L1.87 20.27l4.777-1.116z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
                <h4 className="text-[15.5px] font-bold text-gray-900 leading-tight font-display">
                  Enable WhatsApp Reminders
                </h4>
              </div>

              {/* Description */}
              <p className="text-[13px] text-gray-600 mt-2.5 leading-relaxed">
                Receive instant confirmation, GPS travel times, and dynamic OPD slot recovery alerts directly in your inbox.
              </p>

              {/* Incentive strip */}
              <div className="bg-amber-500/[0.06] border border-amber-500/10 rounded-xl py-2.5 px-3.5 flex items-start space-x-2 mt-3 text-left">
                <Gift className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[12px] font-semibold text-amber-800 leading-tight">
                  Get <span className="text-amber-700 font-extrabold">10% off</span> your next OPD consultation upon activation.
                </span>
              </div>

              {/* Button */}
              <a
                href="https://wa.me/14155238886?text=I%20want%20to%20receive%20appointment%20reminders%20on%20WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4.5 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#25D366]/10 hover:shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Enable WhatsApp Reminders &rarr;</span>
              </a>

              {/* Trust microcopy */}
              <p className="text-[11px] text-gray-400 text-center mt-2.5 leading-none">
                Zero spam. HIPAA & ABDM secure data sharing.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
