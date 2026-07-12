import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Bell, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';

// Format YYYY-MM-DD to human readable date
const formatApptDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
};

// Map status to styling classes
const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'pending':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'completed':
      return 'bg-light-teal text-primary-teal border-primary-teal/10';
    case 'cancelled':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'missed':
    case 'no_show':
      return 'bg-red-50 text-red-600 border-red-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

// Map database persona to UI labels
const getPersonaLabel = (persona) => {
  switch (persona) {
    case 'working_professional':
      return 'Working Professional';
    case 'elderly':
      return 'Elderly / Dependent';
    case 'student':
      return 'Student';
    default:
      return 'Standard';
  }
};

// Generate dynamic reminder timeline items
const getRemindersList = (persona, leadTimeDays) => {
  switch (persona) {
    case 'working_professional':
      return [
        { label: 'Booking', sent: true },
        { label: '48h Alert', sent: leadTimeDays <= 2 },
        { label: '24h Alert', sent: false },
        { label: 'Morning Nudge', sent: false }
      ];
    case 'elderly':
      return [
        { label: 'Booking', sent: true },
        { label: 'Family Notify', sent: true },
        { label: 'IVR Call', sent: false }
      ];
    case 'student':
      return [
        { label: 'Booking', sent: true },
        { label: '24h Alert', sent: false },
        { label: 'Morning Nudge', sent: false }
      ];
    default:
      return [
        { label: 'Booking', sent: true },
        { label: '24h Alert', sent: false }
      ];
  }
};

function AppointmentCardSkeleton() {
  return (
    <div className="bg-white border border-border-custom rounded-2xl p-5 animate-pulse space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-[#f3f4f6]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#f3f4f6]"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[#f3f4f6] rounded w-24"></div>
            <div className="h-3 bg-[#f3f4f6] rounded w-36"></div>
          </div>
        </div>
        <div className="h-6 bg-[#f3f4f6] rounded w-16"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5">
          <div className="h-3 bg-[#f3f4f6] rounded w-12"></div>
          <div className="h-4 bg-[#f3f4f6] rounded w-28"></div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-[#f3f4f6] rounded w-20"></div>
          <div className="h-4 bg-[#f3f4f6] rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export default function MyAppointments() {
  const { user: authUser } = useAuth();
  const { upcoming, past, loading, fetchAppointments, cancelAppointment } = useAppointments();
  
  console.log("[MyAppointments] Rendered! authUser:", authUser, "upcoming length:", upcoming.length, "past length:", past.length, "loading:", loading);

  const [activeTab, setActiveTab] = useState('upcoming');
  const [apptToCancel, setApptToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancellingProgress, setCancellingProgress] = useState(false);

  useEffect(() => {
    console.log("[MyAppointments] useEffect triggered. authUser?.uid:", authUser?.uid);
    if (authUser?.uid) {
      fetchAppointments(authUser.uid);
    }
  }, [authUser, fetchAppointments]);

  const list = activeTab === 'upcoming' ? upcoming : past;

  const handleOpenCancelModal = (appt, e) => {
    e.preventDefault();
    setApptToCancel(appt);
  };

  const handleConfirmCancel = async () => {
    if (!apptToCancel || cancellingProgress) return;
    setCancellingProgress(true);
    try {
      await cancelAppointment(apptToCancel.id, cancelReason);
      setApptToCancel(null);
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingProgress(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-5 py-8 bg-white font-sans text-text-medium">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-dark">
          My Appointments
        </h1>
        <p className="text-sm text-text-light mt-1">
          Review and schedule your visits and adjust WhatsApp notifications.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="inline-flex p-1 bg-[#f3f4f6] rounded-xl mb-8">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-text-dark shadow-sm'
              : 'text-[#6b7280] hover:text-text-dark'
          }`}
        >
          Upcoming ({loading ? '...' : upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'past'
              ? 'bg-white text-text-dark shadow-sm'
              : 'text-[#6b7280] hover:text-text-dark'
          }`}
        >
          Past ({loading ? '...' : past.length})
        </button>
      </div>

      {/* List Container */}
      <div className="space-y-4">
        {loading && list.length === 0 ? (
          <>
            <AppointmentCardSkeleton />
            <AppointmentCardSkeleton />
          </>
        ) : list.length > 0 ? (
          list.map((appt) => {
            const initials = appt.doctorName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'DR';
            const leadDays = appt.leadTimeDays || 0;
            const reminders = getRemindersList(appt.persona, leadDays);
            
            return (
              <div
                key={appt.id}
                className="bg-white border border-border-custom rounded-2xl p-5 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#f3f4f6]">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-light-teal flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-semibold text-primary-teal">
                        {initials}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-dark">{appt.doctorName}</h3>
                      <p className="text-xs text-[#6b7280] mt-0.5">{appt.department} · Apollo Hospital</p>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusClasses(appt.status)}`}>
                    {appt.status?.toUpperCase()}
                  </span>
                </div>

                {/* Date, Time & Persona Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs text-text-medium border-b border-[#f3f4f6]">
                  <div className="space-y-1.5">
                    <p className="text-text-light uppercase tracking-wider font-semibold">Schedule</p>
                    <p className="font-semibold text-text-dark flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4 text-text-light" />
                      <span>{formatApptDate(appt.appointmentDate)} · {appt.appointmentTime}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-text-light uppercase tracking-wider font-semibold">Reminder Profile</p>
                    <p className="font-semibold text-text-dark flex items-center space-x-1.5">
                      <Bell className="h-4 w-4 text-primary-teal" />
                      <span>{getPersonaLabel(appt.persona)}</span>
                    </p>
                  </div>
                </div>

                {/* Progress Bar represent notification steps */}
                {appt.status !== 'cancelled' && (
                  <div className="py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-light mb-3">
                      WhatsApp Reminder timeline
                    </p>
                    <div className="flex items-center justify-between gap-1 select-none">
                      {reminders.map((rem, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center relative">
                          {/* Connection Line */}
                          {i < reminders.length - 1 && (
                            <div className={`absolute top-2.5 left-[50%] right-[-50%] h-[2px] z-0 ${
                              reminders[i+1].sent ? 'bg-primary-teal' : 'bg-[#e5e7eb]'
                            }`}></div>
                          )}
                          
                          {/* Dot */}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 border-2 ${
                            rem.sent
                              ? 'bg-primary-teal border-primary-teal text-white'
                              : 'bg-white border-[#d1d5db] text-text-light'
                          }`}>
                            {rem.sent ? (
                              <CheckCircle className="h-3 w-3 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            )}
                          </div>
                          
                          {/* Label */}
                          <span className="text-[9px] font-medium text-text-light mt-1.5">{rem.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-[#f3f4f6] flex justify-between items-center text-xs">
                  <Link to={`/appointment/${appt.id}`} className="font-semibold text-primary-teal hover:underline">
                    View Details &rarr;
                  </Link>
                  {activeTab === 'upcoming' && appt.status !== 'cancelled' && (
                    <div className="flex space-x-4">
                      <Link to={`/doctor/${appt.doctorId}`} className="text-text-light hover:text-text-medium transition-colors">
                        Reschedule
                      </Link>
                      <button 
                        onClick={(e) => handleOpenCancelModal(appt, e)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-[#f9fafb] border border-border-custom rounded-2xl p-12 text-center text-text-light">
            You do not have any {activeTab} appointments.
          </div>
        )}
      </div>

      {/* Cancellation Modal Dialog */}
      {apptToCancel && (
        <div className="fixed inset-0 bg-text-dark/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border-custom rounded-[16px] p-6 max-w-[420px] w-full space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-text-dark">Cancel Appointment</h3>
            </div>
            
            <p className="text-xs text-text-medium leading-relaxed">
              Are you sure you want to cancel your appointment with <span className="font-semibold">{apptToCancel.doctorName}</span> on {formatApptDate(apptToCancel.appointmentDate)}? This action cannot be undone.
            </p>

            <div className="text-xs space-y-1">
              <label className="block text-text-light font-semibold">Select reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-border-custom bg-white rounded-lg focus:outline-none focus:border-primary-teal"
              >
                <option>Change of plans</option>
                <option>Doctor unavailable</option>
                <option>Personal emergency</option>
                <option>Booked another slot</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#f3f4f6] text-xs">
              <button
                onClick={() => setApptToCancel(null)}
                disabled={cancellingProgress}
                className="px-4 py-2 border border-border-custom text-text-medium rounded-lg hover:bg-bg-subtle transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingProgress}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition-colors"
              >
                {cancellingProgress ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <span>Cancel Appointment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
