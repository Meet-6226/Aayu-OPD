import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Bell, CheckCircle, Loader2, AlertTriangle, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';

const formatApptDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
};

const STATUS_STYLES = {
  confirmed:  { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  pending:    { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100'   },
  completed:  { dot: 'bg-teal-500',    text: 'text-teal-700',    bg: 'bg-teal-50 border-teal-100'     },
  cancelled:  { dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-50 border-gray-100'     },
  no_show:    { dot: 'bg-red-400',     text: 'text-red-600',     bg: 'bg-red-50 border-red-100'       },
};
const getStatus = (s) => STATUS_STYLES[s?.toLowerCase()] || STATUS_STYLES.pending;

const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { bg: 'bg-rose-100',   text: 'text-rose-700'   },
  { bg: 'bg-teal-100',   text: 'text-teal-700'   },
];
const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getPersonaLabel = (p) => ({
  working_professional: 'Working Professional',
  elderly: 'Elderly / Dependent',
  student: 'Student',
}[p] || 'Standard');

const getRemindersList = (persona, leadTimeDays) => {
  if (persona === 'working_professional') return [
    { label: 'Booking', sent: true },
    { label: '48h Alert', sent: leadTimeDays <= 2 },
    { label: '24h Alert', sent: false },
    { label: 'Morning', sent: false },
  ];
  if (persona === 'elderly') return [
    { label: 'Booking', sent: true },
    { label: 'Family', sent: true },
    { label: 'IVR Call', sent: false },
  ];
  return [
    { label: 'Booking', sent: true },
    { label: '24h Alert', sent: false },
    { label: 'Morning', sent: false },
  ];
};

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-gray-100 rounded w-36" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="h-px bg-gray-100" />
      <div className="flex gap-6">
        <div className="h-3 bg-gray-100 rounded w-28" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

export default function MyAppointments() {
  const { user: authUser } = useAuth();
  const { upcoming, past, loading, fetchAppointments, cancelAppointment } = useAppointments();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [apptToCancel, setApptToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancellingProgress, setCancellingProgress] = useState(false);

  useEffect(() => {
    if (authUser?.uid) fetchAppointments(authUser.uid);
  }, [authUser, fetchAppointments]);

  const list = activeTab === 'upcoming' ? upcoming : past;

  const handleConfirmCancel = async () => {
    if (!apptToCancel || cancellingProgress) return;
    setCancellingProgress(true);
    try {
      await cancelAppointment(apptToCancel.id, cancelReason);
      setApptToCancel(null);
    } catch (e) { console.error(e); }
    finally { setCancellingProgress(false); }
  };

  return (
    <div className="max-w-[760px] mx-auto px-5 py-7">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your upcoming and past visits.</p>
      </div>

      {/* ── TAB SWITCHER ─────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-7">
        {[
          { id: 'upcoming', label: `Upcoming${!loading ? ` (${upcoming.length})` : ''}` },
          { id: 'past',     label: `Past${!loading ? ` (${past.length})` : ''}` },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── LIST ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading && list.length === 0 ? (
          <> <SkeletonCard /> <SkeletonCard /> </>
        ) : list.length > 0 ? (
          list.map((appt, idx) => {
            const { bg, text } = getAvatarColor(appt.doctorName || '');
            const initials = (appt.doctorName || 'DR').replace(/^Dr\.\s+/i, '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const st = getStatus(appt.status);
            const reminders = getRemindersList(appt.persona, appt.leadTimeDays || 0);
            const isUpcoming = activeTab === 'upcoming';
            const isFirst = idx === 0 && isUpcoming && upcoming.length > 0;

            return (
              <div
                key={appt.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isFirst
                    ? 'border-primary-teal/30 ring-1 ring-primary-teal/10'
                    : 'border-gray-200'
                }`}
              >
                {/* ── Top strip (upcoming highlight) */}
                {isFirst && (
                  <div className="bg-primary-teal/5 border-b border-primary-teal/10 px-5 py-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-teal animate-pulse" />
                    <span className="text-[11px] font-semibold text-primary-teal uppercase tracking-wider">
                      Next Visit
                    </span>
                  </div>
                )}

                <div className="px-5 py-4">
                  {/* ── Doctor row */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                      <span className={`text-[12px] font-bold ${text}`}>{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 leading-snug">{appt.doctorName}</p>
                      <p className="text-[12px] text-gray-500 truncate">{appt.department} · Apollo Hospital</p>
                    </div>
                    {/* Status pill */}
                    <span className={`text-[10.5px] font-semibold border px-2.5 py-1 rounded-full capitalize ${st.bg} ${st.text}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${st.dot}`} />
                      {appt.status}
                    </span>
                  </div>

                  {/* ── Date / Time / Persona row */}
                  <div className="flex flex-wrap gap-4 mt-3.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{formatApptDate(appt.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{appt.appointmentTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-gray-400" />
                      <span>{getPersonaLabel(appt.persona)} reminders</span>
                    </div>
                  </div>

                  {/* ── Reminder timeline (upcoming only) */}
                  {appt.status !== 'cancelled' && isUpcoming && (
                    <div className="mt-4 pt-3.5 border-t border-gray-50">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                        WhatsApp Reminders
                      </p>
                      <div className="flex items-center gap-0">
                        {reminders.map((rem, i) => (
                          <React.Fragment key={i}>
                            <div className="flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                rem.sent ? 'bg-primary-teal' : 'bg-gray-100'
                              }`}>
                                {rem.sent
                                  ? <CheckCircle className="h-3 w-3 text-white stroke-[2.5]" />
                                  : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                }
                              </div>
                              <span className={`text-[9px] font-medium mt-1 ${rem.sent ? 'text-primary-teal' : 'text-gray-400'}`}>
                                {rem.label}
                              </span>
                            </div>
                            {i < reminders.length - 1 && (
                              <div className={`flex-1 h-px mx-1 mb-4 ${
                                reminders[i + 1].sent ? 'bg-primary-teal' : 'bg-gray-200'
                              }`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Actions row */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <Link
                      to={`/appointment/${appt.id}`}
                      className="text-[12.5px] font-semibold text-primary-teal flex items-center gap-0.5 hover:text-primary-dark transition-colors"
                    >
                      View Details <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    {isUpcoming && appt.status !== 'cancelled' && (
                      <div className="flex items-center gap-4 text-[12.5px]">
                        <Link to={`/doctor/${appt.doctorId}`} className="text-gray-400 hover:text-gray-600 transition-colors">
                          Reschedule
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); setApptToCancel(appt); }}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center border border-gray-200 rounded-2xl bg-white">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No {activeTab} appointments</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === 'upcoming'
                ? 'Book a consultation to get started.'
                : 'Past visits will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/doctors"
                className="inline-block mt-4 bg-primary-teal text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all"
              >
                Find a Doctor
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── CANCEL MODAL ────────────────────────────────────────── */}
      {apptToCancel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-[400px] w-full shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900">Cancel Appointment</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Cancel appointment with <span className="font-semibold text-gray-800">{apptToCancel.doctorName}</span> on{' '}
              {formatApptDate(apptToCancel.appointmentDate)}? This cannot be undone.
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Reason</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:border-primary-teal"
              >
                <option>Change of plans</option>
                <option>Doctor unavailable</option>
                <option>Personal emergency</option>
                <option>Booked another slot</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setApptToCancel(null)}
                disabled={cancellingProgress}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingProgress}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {cancellingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
