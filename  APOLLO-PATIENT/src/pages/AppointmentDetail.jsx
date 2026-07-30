import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Navigation, 
  MessageSquare, 
  Loader2, 
  AlertTriangle,
  Video,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import MedicalPrescriptionCard from '../components/MedicalPrescriptionCard';
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

// Format Firestore Notification Timestamp
const formatNotificationTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
           ' · ' + 
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
};

// Map status to styling classes
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

// Default fallback timeline in case no database notifications are found yet
const getDefaultTimeline = (persona, leadTimeDays) => {
  switch (persona) {
    case 'working_professional':
      return [
        { id: 1, title: 'Booking Confirmed', description: 'WhatsApp template confirmation sent.', time: 'Just now', sent: true },
        { id: 2, title: '48-hour Reminder', description: 'WhatsApp alert sent focusing on office leave approval.', time: leadTimeDays <= 2 ? 'Sent' : 'Pending', sent: leadTimeDays <= 2 },
        { id: 3, title: '24-hour Confirmation', description: 'WhatsApp nudge sent asking to reply 1 to confirm or 2 to reschedule.', time: 'Pending', sent: false },
        { id: 4, title: 'Morning Travel Digest', description: 'WhatsApp layout including traffic info and navigation map pins.', time: 'Pending', sent: false }
      ];
    case 'elderly':
      return [
        { id: 1, title: 'Booking Confirmed', description: 'WhatsApp template confirmation sent.', time: 'Just now', sent: true },
        { id: 2, title: 'Family Notified', description: 'Caretaker contact notified with appointment details.', time: 'Sent', sent: true },
        { id: 3, title: 'IVR Call Nudge', description: 'Automated IVR call reminder scheduled.', time: 'Pending', sent: false }
      ];
    case 'student':
      return [
        { id: 1, title: 'Booking Confirmed', description: 'WhatsApp template confirmation sent.', time: 'Just now', sent: true },
        { id: 2, title: '24-hour Alert', description: 'Casual whatsapp nudge sent.', time: 'Pending', sent: false },
        { id: 3, title: 'Morning Nudge', description: 'WhatsApp alert sent before consult.', time: 'Pending', sent: false }
      ];
    default:
      return [
        { id: 1, title: 'Booking Confirmed', description: 'WhatsApp template confirmation sent.', time: 'Just now', sent: true },
        { id: 2, title: '24-hour Reminder', description: 'WhatsApp template alert sent.', time: 'Pending', sent: false }
      ];
  }
};

// Parse scheduled time in IST / local timezone
const getScheduledTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch (e) {
    console.error(e);
    return null;
  }
};

function AppointmentDetailSkeleton() {
  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
      <div className="h-4 bg-[#F3F4F6] rounded w-24 mb-6"></div>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-6 bg-[#F3F4F6] rounded w-48"></div>
          <div className="h-3 bg-[#F3F4F6] rounded w-24"></div>
        </div>
        <div className="h-6 bg-[#F3F4F6] rounded w-16"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 bg-[#F3F4F6] rounded-[14px]"></div>
          <div className="h-60 bg-[#F3F4F6] rounded-[14px]"></div>
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div className="h-36 bg-[#F3F4F6] rounded-[14px]"></div>
          <div className="h-24 bg-[#F3F4F6] rounded-[14px]"></div>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cancelAppointment } = useAppointments();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  // Timer states for online consultation countdown
  const [timeUntilCall, setTimeUntilCall] = useState(null);
  const [isJoinable, setIsJoinable] = useState(false);

  // Cancellation states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancellingProgress, setCancellingProgress] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const apptRef = doc(db, COLLECTIONS.APPOINTMENTS, id);
      const apptSnap = await getDoc(apptRef);
      if (!apptSnap.exists()) {
        setError("Appointment not found");
        return;
      }
      const apptData = { id: apptSnap.id, ...apptSnap.data() };
      setAppointment(apptData);

      // Fetch doctor details
      const docRef = doc(db, COLLECTIONS.DOCTORS, apptData.doctorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDoctor({ id: docSnap.id, ...docSnap.data() });
      }

      // Fetch notifications
      const notifyRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(notifyRef, where("appointmentId", "==", id));
      const notifySnap = await getDocs(q);
      const notifyData = notifySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort chronological
      notifyData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA - dateB;
      });
      setNotifications(notifyData);

    } catch (err) {
      console.error("Error loading appointment details:", err);
      setError("Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Video call timer logic
  useEffect(() => {
    if (!appointment || appointment.consultationMode !== 'online' || appointment.status === 'cancelled' || appointment.status === 'completed') return;

    const scheduledTime = getScheduledTime(appointment.appointmentDate, appointment.appointmentTime);
    if (!scheduledTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = scheduledTime.getTime() - now.getTime();
      setTimeUntilCall(diff);
      
      // Active 10 minutes before, and up to 1.5 hours after scheduled start time
      const tenMins = 10 * 60 * 1000;
      const ninetyMins = 90 * 60 * 1000;
      setIsJoinable(diff <= tenMins && diff >= -ninetyMins);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  const handleConfirmCancel = async () => {
    if (cancellingProgress) return;
    setCancellingProgress(true);
    try {
      await cancelAppointment(appointment.id, cancelReason);
      setIsCancelModalOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingProgress(false);
    }
  };

  const formatCountdown = (ms) => {
    if (ms === null || ms === undefined) return '';
    if (ms <= 0) return '';
    
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hours > 0) {
      return `opens in ${hours}h ${mins}m`;
    }
    if (mins > 0) {
      return `opens in ${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `opens in ${secs} second${secs > 1 ? 's' : ''}`;
  };

  if (loading) {
    return <AppointmentDetailSkeleton />;
  }

  if (error || !appointment) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-lg font-bold text-[#DC2626] mb-2">Appointment Not Found</h2>
        <p className="text-[#6B7280] text-sm mb-6">The requested appointment record does not exist or has been cancelled.</p>
        <button
          onClick={() => navigate('/appointments')}
          className="bg-[#0f766e] text-white text-xs font-semibold px-5 py-2.5 rounded-[6px] hover:bg-[#0d5a54] transition-colors"
        >
          View all appointments
        </button>
      </div>
    );
  }

  const leadDays = appointment.leadTimeDays || 0;
  const dbTimeline = notifications.map((n, idx) => ({
    id: n.id || idx,
    title: n.title,
    description: n.body,
    time: formatNotificationTime(n.createdAt),
    sent: true
  }));

  const timeline = dbTimeline.length > 0 
    ? dbTimeline 
    : getDefaultTimeline(appointment.persona, leadDays);

  const initials = doctor?.initials || appointment.doctorName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'DR';
  const isOnline = appointment.consultationMode === 'online';

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-all mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to appointments</span>
      </button>

      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            ID: {appointment.bookingId || `#${appointment.id}`}
          </span>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight mt-0.5">Appointment Details</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClasses(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Online Call Live Card */}
          {isOnline && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
                  <Video className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                    Tele-Consultation Lobby
                  </p>
                  <h3 className="text-sm font-semibold text-[#111827] mt-1">
                    {isJoinable ? 'The doctor is ready to connect.' : 'Your virtual consultation room'}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {isJoinable 
                      ? 'Click join to open the secure video consultation screen. Please allow camera and microphone access when prompted.'
                      : `The join button will activate 10 minutes prior to your slot. (${formatCountdown(timeUntilCall)})`
                    }
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    {isJoinable ? (
                      <a
                        href={appointment.videoRoomUrl || `https://aayu-test.daily.co/aayu-consult-${appointment.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-[10px] transition-colors duration-150"
                      >
                        Join Video Call
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#F3F4F6] text-[#9CA3AF] text-xs font-semibold rounded-[10px] cursor-not-allowed border border-[#E5E7EB]"
                      >
                        Join Call ({timeUntilCall > 0 ? formatCountdown(timeUntilCall) : 'opens shortly'})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Visit Info Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 space-y-4 text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Visit Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-[#0f766e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-[#111827] mt-0.5">{formatApptDate(appointment.appointmentDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-[#0f766e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Time Slot</p>
                  <p className="text-sm font-semibold text-[#111827] mt-0.5">{appointment.appointmentTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="h-4 w-4 text-[#0f766e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Type / Location</p>
                  <p className="text-sm font-semibold text-[#111827] mt-0.5">
                    {isOnline ? 'Online Video Consultation' : 'In-Person Consultation'}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                    {isOnline 
                      ? 'Secure, browser-based video lobby. Link available on this page.' 
                      : `${appointment.room || 'Room 302'}, ${doctor?.hospital || appointment.hospital || 'Apollo Hospitals, Navi Mumbai'}`
                    }
                  </p>
                </div>
              </div>
            </div>

            {!isOnline && (
              <div className="pt-2 border-t border-[#F3F4F6]">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(doctor?.hospital || appointment.hospital || 'Apollo Hospitals, Navi Mumbai')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f766e] hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Get Directions on Google Maps</span>
                </a>
              </div>
            )}
          </div>

          {/* Prescription widget */}
          <MedicalPrescriptionCard appointment={appointment} />

          {/* Timeline of Whatsapp notifications */}
          {appointment.status !== 'cancelled' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 text-left">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-5">
                Communication Timeline
              </h3>

              <div className="relative pl-6 space-y-6 select-none">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#E5E7EB] z-0"></div>

                {timeline.map((step) => (
                  <div key={step.id} className="relative flex items-start gap-4">                    <div className={`absolute -left-6 w-[16px] h-[16px] rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                      step.sent ? 'border-[#0f766e] text-[#0f766e]' : 'border-[#D1D5DB] text-[#9CA3AF]'
                    }`}>
                      {step.sent && <div className="w-1.5 h-1.5 rounded-full bg-[#0f766e]"></div>}
                    </div>

                    <div className="space-y-0.5 w-full text-left">
                      <div className="flex items-baseline justify-between flex-wrap gap-x-2">
                        <h4 className={`text-xs font-semibold ${step.sent ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                          {step.title}
                        </h4>
                        <span className="text-[10px] text-[#9CA3AF] shrink-0">{step.time}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Doctor Info Sidebar */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 text-center">
            <div className="w-12 h-12 rounded-[6px] bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center mx-auto mb-3 text-[#0f766e] font-bold">
              {initials}
            </div>
            <h4 className="text-sm font-semibold text-[#111827] truncate">{appointment.doctorName}</h4>
            <p className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider mt-0.5">{appointment.department}</p>
            <p className="text-xs text-[#6B7280] truncate mt-1">{doctor?.hospital || appointment.hospital || "Aayu Clinic"}</p>
            
            <div className="border-t border-[#F3F4F6] mt-4 pt-3 flex justify-between items-center text-xs">
              <span className="text-[#9CA3AF] font-medium">Consultation Fee</span>
              <span className="font-bold text-[#111827] font-mono">₹{appointment.consultationFee}</span>
            </div>
          </div>

          {/* Alert Preference Widget */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 space-y-3 text-left">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Alert Profile</p>
            <div className="flex items-center gap-3 p-2.5 rounded-[6px] bg-[#F9FAFB] border border-[#E5E7EB]">
              <MessageSquare className="h-4 w-4 text-[#0f766e]" />
              <div>
                <p className="text-xs font-semibold text-[#111827]">WhatsApp Alerts</p>
                <p className="text-[10px] text-[#6B7280]">{getPersonaLabel(appointment.persona)}</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="text-xs font-semibold text-[#0f766e] hover:underline block text-center mt-1"
            >
              Update Preferences &rarr;
            </Link>
          </div>

          {/* Cancellation Actions */}
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <div className="space-y-2">
              <Link
                to={`/doctor/${appointment.doctorId}?reschedule=true`}
                className="w-full block text-center py-2.5 bg-white border border-[#E5E7EB] text-[#374151] hover:border-[#D1D5DB] rounded-[6px] text-xs font-semibold transition-all duration-150"
              >
                Reschedule appointment
              </Link>
              <button 
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full py-2.5 text-center bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2] rounded-[6px] text-xs font-semibold transition-all duration-150 cursor-pointer"
              >
                Cancel appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 max-w-[420px] w-full space-y-4 text-left shadow-lg">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-[#111827]">Cancel Appointment</h3>
            </div>
            
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Are you sure you want to cancel your appointment with <span className="font-semibold text-[#111827]">{appointment.doctorName}</span> on {formatApptDate(appointment.appointmentDate)}? This action cannot be undone.
            </p>

            <div className="text-xs space-y-1.5">
              <label className="block text-[#6B7280] font-semibold">Select reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] bg-white rounded-[6px] focus:outline-none focus:border-[#0f766e] text-xs"
              >
                <option>Change of plans</option>
                <option>Doctor unavailable</option>
                <option>Personal emergency</option>
                <option>Booked another slot</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#F3F4F6] text-xs">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancellingProgress}
                className="px-4 py-2 border border-[#E5E7EB] text-[#374151] rounded-[10px] hover:bg-[#F9FAFB] transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingProgress}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[10px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                {cancellingProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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
