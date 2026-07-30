import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Bell, CheckCircle, Loader2, AlertTriangle, ChevronRight, Clock, MapPin, Video } from 'lucide-react';
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

const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
    case 'pending':
      return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
    case 'completed':
      return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    case 'cancelled':
      return 'bg-[#F9FAFB] text-[#374151] border-[#E5E7EB]';
    case 'missed':
    case 'no_show':
      return 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]';
    default:
      return 'bg-[#F9FAFB] text-[#374151] border-[#E5E7EB]';
  }
};

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
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-[#F3F4F6] shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-[#F3F4F6] rounded w-36" />
          <div className="h-3 bg-[#F3F4F6] rounded w-24" />
        </div>
        <div className="h-5 bg-[#F3F4F6] rounded-full w-20" />
      </div>
      <div className="h-px bg-[#F3F4F6]" />
      <div className="flex gap-6">
        <div className="h-3 bg-[#F3F4F6] rounded w-28" />
        <div className="h-3 bg-[#F3F4F6] rounded w-20" />
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
    const patientId = authUser?.uid || authUser?.id || (authUser?.phoneNumber ? authUser.phoneNumber.replace(/\D/g, '') : null) || (authUser?.email ? authUser.email.replace(/[^a-zA-Z0-9_-]/g, '') : null) || 'patient_priya_demo';
    fetchAppointments(patientId);
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
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#374151]">
      <div className="max-w-[760px] mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">My Appointments</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage and track your upcoming and past medical consultations.</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1.5 border-b border-[#E5E7EB] pb-px">
          {[
            { id: 'upcoming', label: `Upcoming${!loading ? ` (${upcoming.length})` : ''}` },
            { id: 'past',     label: `Past Visits${!loading ? ` (${past.length})` : ''}` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 -mb-px ${
                activeTab === id
                  ? 'border-[#1E7F6A] text-[#1E7F6A] font-bold'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#D1D5DB]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List content */}
        <div className="space-y-4">
          {loading && list.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : list.length > 0 ? (
            list.map((appt, idx) => {
              const initials = (appt.doctorName || 'DR').replace(/^Dr\.\s+/i, '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const reminders = getRemindersList(appt.persona, appt.leadTimeDays || 0);
              const isUpcoming = activeTab === 'upcoming';
              const isFirst = idx === 0 && isUpcoming && upcoming.length > 0;
              const isOnline = appt.consultationMode === 'online';

              return (
                <div
                  key={appt.id}
                  className={`bg-white border rounded-[14px] overflow-hidden transition-all duration-150 ${
                    isFirst
                      ? 'border-[#1E7F6A] shadow-[0_2px_12px_rgba(30,127,106,0.06)]'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  {/* Next Visit Banner */}
                  {isFirst && (
                    <div className="bg-[#ECFDF5] border-b border-[#A7F3D0] px-5 py-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E7F6A] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#1E7F6A] uppercase tracking-wider">
                        Next Scheduled Visit
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    {/* Doctor Info Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#1E7F6A]">{initials}</span>
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-bold text-[#111827] leading-snug">{appt.doctorName}</p>
                          <p className="text-xs text-[#6B7280]">{appt.department} · Aayu Clinic</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusClasses(appt.status)}`}>
                          {appt.status}
                        </span>
                        {isOnline && appt.status !== 'cancelled' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded-full border border-[#BAE6FD]">
                            <Video className="h-2.5 w-2.5" />
                            Video Call
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date/Time info */}
                    <div className="flex flex-wrap gap-4 text-xs text-[#6B7280] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        <span className="font-semibold text-[#374151]">{formatApptDate(appt.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        <span className="font-semibold text-[#374151]">{appt.appointmentTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        <span>{getPersonaLabel(appt.persona)} alerts</span>
                      </div>
                    </div>

                    {/* Timeline of reminders (upcoming only) */}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && isUpcoming && (
                      <div className="pt-3 border-t border-[#F3F4F6]">
                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2.5">
                          Reminders Dispatch
                        </p>
                        <div className="flex items-center gap-0 w-full max-w-md">
                          {reminders.map((rem, i) => (
                            <React.Fragment key={i}>
                              <div className="flex flex-col items-center shrink-0">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  rem.sent ? 'bg-[#1E7F6A]' : 'bg-[#F3F4F6]'
                                }`}>
                                  {rem.sent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className={`text-[9px] font-semibold mt-1 ${rem.sent ? 'text-[#1E7F6A]' : 'text-[#9CA3AF]'}`}>
                                  {rem.label}
                                </span>
                              </div>
                              {i < reminders.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 mb-4 ${
                                  reminders[i + 1].sent ? 'bg-[#1E7F6A]' : 'bg-[#F3F4F6]'
                                }`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6] text-xs">
                      <Link
                        to={`/appointment/${appt.id}`}
                        className="font-semibold text-[#1E7F6A] flex items-center gap-0.5 hover:underline"
                      >
                        View Details <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      {isUpcoming && appt.status !== 'cancelled' && appt.status !== 'completed' && (
                        <div className="flex items-center gap-4">
                          <Link to={`/doctor/${appt.doctorId}?reschedule=true`} className="font-semibold text-[#6B7280] hover:text-[#374151]">
                            Reschedule
                          </Link>
                          <button
                            onClick={(e) => { e.preventDefault(); setApptToCancel(appt); }}
                            className="font-semibold text-[#DC2626] hover:text-[#B91C1C] cursor-pointer"
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
            <div className="py-16 text-center border border-[#E5E7EB] rounded-[14px] bg-white">
              <Calendar className="h-8 w-8 text-[#9CA3AF] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#374151]">No {activeTab} appointments</p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {activeTab === 'upcoming'
                  ? 'Schedule an appointment to consult with our specialists.'
                  : 'Your past consultations will appear here.'}
              </p>
              {activeTab === 'upcoming' && (
                <Link
                  to="/doctors"
                  className="inline-block mt-4 bg-[#1E7F6A] hover:bg-[#165B52] text-white text-xs font-semibold px-5 py-2.5 rounded-[10px] transition-colors"
                >
                  Book Appointment
                </Link>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Cancellation dialog */}
      {apptToCancel && (
        <div className="fixed inset-0 bg-[#111827]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 max-w-[400px] w-full space-y-4 text-left shadow-lg">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-[#111827]">Cancel Appointment</h3>
            </div>
            
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Cancel your appointment with <span className="font-semibold text-[#111827]">{apptToCancel.doctorName}</span> on{' '}
              {formatApptDate(apptToCancel.appointmentDate)}? This action cannot be undone.
            </p>

            <div className="text-xs space-y-1.5">
              <label className="block text-[#6B7280] font-semibold">Select reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] bg-white rounded-[10px] focus:outline-none focus:border-[#1E7F6A] text-xs"
              >
                <option>Change of plans</option>
                <option>Doctor unavailable</option>
                <option>Personal emergency</option>
                <option>Booked another slot</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setApptToCancel(null)}
                disabled={cancellingProgress}
                className="flex-1 py-2 border border-[#E5E7EB] text-[#374151] rounded-[10px] hover:bg-[#F9FAFB] transition-colors text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingProgress}
                className="flex-1 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {cancellingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
