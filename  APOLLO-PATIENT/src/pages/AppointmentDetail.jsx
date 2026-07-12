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
  AlertTriangle 
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
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

function AppointmentDetailSkeleton() {
  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 bg-white font-sans text-text-medium animate-pulse space-y-6">
      <div className="h-4 bg-[#f3f4f6] rounded w-24 mb-6"></div>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-6 bg-[#f3f4f6] rounded w-48"></div>
          <div className="h-3 bg-[#f3f4f6] rounded w-24"></div>
        </div>
        <div className="h-6 bg-[#f3f4f6] rounded w-16"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="h-40 bg-[#f3f4f6] rounded-2xl"></div>
          <div className="h-60 bg-[#f3f4f6] rounded-2xl"></div>
        </div>
        <div className="md:col-span-1 space-y-4">
          <div className="h-36 bg-[#f3f4f6] rounded-2xl"></div>
          <div className="h-24 bg-[#f3f4f6] rounded-2xl"></div>
          <div className="h-20 bg-[#f3f4f6] rounded-2xl"></div>
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

  const handleConfirmCancel = async () => {
    if (cancellingProgress) return;
    setCancellingProgress(true);
    try {
      await cancelAppointment(appointment.id, cancelReason);
      setIsCancelModalOpen(false);
      // Reload appointment to reflect new status
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingProgress(false);
    }
  };

  if (loading) {
    return <AppointmentDetailSkeleton />;
  }

  if (error || !appointment) {
    return (
      <div className="max-w-[720px] mx-auto px-5 py-20 text-center font-sans">
        <h2 className="text-xl font-bold text-red-500 mb-2">Appointment Not Found</h2>
        <p className="text-text-medium mb-6">The requested appointment record does not exist or has been cancelled.</p>
        <button
          onClick={() => navigate('/appointments')}
          className="bg-primary-teal text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          View all appointments
        </button>
      </div>
    );
  }

  // Get dynamic timeline list
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

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 bg-white font-sans text-text-medium">
      
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-sm font-medium text-text-light hover:text-text-dark transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to appointments</span>
      </button>

      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-dark">Appointment Details</h1>
          <p className="text-xs text-text-light mt-0.5">Booking ID: {appointment.bookingId || `#${appointment.id}`}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusClasses(appointment.status)}`}>
          {appointment.status?.toUpperCase()}
        </span>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* MAIN COLUMN (2 cols on desktop) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card: Core info */}
          <div className="bg-white border border-border-custom rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light">
              Visit Information
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-xs">
                <Calendar className="h-4 w-4 text-primary-teal shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-dark">{formatApptDate(appointment.appointmentDate)}</p>
                  <p className="text-text-light mt-0.5">{appointment.appointmentTime}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <MapPin className="h-4 w-4 text-primary-teal shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-dark">Clinic Visit</p>
                  <p className="text-text-light mt-0.5 leading-relaxed">
                    {appointment.room ? `${appointment.room}, ` : ''} 
                    {doctor?.hospital || appointment.hospital || "Apollo Hospital, Jubilee Hills"}
                  </p>
                </div>
              </div>
            </div>

            {/* Directions button */}
            <div className="pt-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(doctor?.hospital || appointment.hospital || 'Apollo Hospitals Jubilee Hills')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-primary-teal hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Get Directions on Google Maps</span>
              </a>
            </div>
          </div>

          {/* Card: Vertical Reminder Timeline */}
          {appointment.status !== 'cancelled' && (
            <div className="bg-white border border-border-custom rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light mb-5">
                WhatsApp Notifications Timeline
              </h3>

              <div className="relative pl-6 space-y-6 select-none">
                {/* Vertical line connector */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border-light z-0"></div>

                {timeline.map((step) => (
                  <div key={step.id} className="relative flex items-start gap-4">
                    {/* Status Indicator Dot */}
                    <div className={`absolute -left-6 w-[16px] h-[16px] rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                      step.sent ? 'border-primary-teal text-primary-teal' : 'border-gray-300 text-text-light'
                    }`}>
                      {step.sent && <div className="w-1.5 h-1.5 rounded-full bg-primary-teal"></div>}
                    </div>

                    <div className="space-y-1 w-full text-left">
                      <div className="flex items-baseline justify-between flex-wrap gap-x-2">
                        <h4 className={`text-xs font-semibold ${step.sent ? 'text-text-dark' : 'text-[#6b7280]'}`}>
                          {step.title}
                        </h4>
                        <span className="text-[10px] text-text-light shrink-0">{step.time}</span>
                      </div>
                      <p className="text-[11px] text-text-light leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR COLUMN (1 col) */}
        <div className="md:col-span-1 space-y-4">
          
          {/* Doctor Summary Mini card */}
          <div className="bg-white border border-border-custom rounded-2xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-light-teal flex items-center justify-center mx-auto mb-3 shrink-0">
              <span className="text-[14px] font-semibold text-primary-teal">{initials}</span>
            </div>
            <h4 className="text-xs font-bold text-text-dark truncate">{appointment.doctorName}</h4>
            <p className="text-[10px] text-text-light font-medium uppercase mt-0.5">{appointment.department}</p>
            <p className="text-[10px] text-text-light truncate mt-1">{doctor?.hospital || appointment.hospital || "Apollo Hospital"}</p>
            
            <div className="border-t border-[#f3f4f6] mt-4 pt-3 flex justify-between items-center text-xs text-text-dark font-semibold">
              <span className="text-[10px] text-text-light uppercase tracking-wider font-normal">Fee</span>
              <span>₹{appointment.consultationFee}</span>
            </div>
          </div>

          {/* Reminder Preference widget */}
          <div className="bg-white border border-border-custom rounded-2xl p-4 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-light">
              Alert profile
            </h4>
            <div className="flex items-center space-x-2 bg-light-teal px-2.5 py-1.5 rounded-lg border border-primary-teal/15">
              <MessageSquare className="h-4 w-4 text-primary-teal" />
              <div className="text-left">
                <p className="text-[10px] font-semibold text-primary-teal leading-none">WhatsApp</p>
                <p className="text-[9px] text-[#4b5563] mt-0.5 leading-none">{getPersonaLabel(appointment.persona)}</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="text-[11px] font-semibold text-primary-teal hover:underline block text-center mt-1"
            >
              Update Preferences &rarr;
            </Link>
          </div>

          {/* Reschedule/Cancel buttons */}
          {appointment.status !== 'cancelled' && (
            <div className="space-y-2">
              <Link
                to={`/doctor/${appointment.doctorId}?reschedule=true`}
                className="w-full inline-block py-2.5 text-center border border-border-custom text-text-medium hover:border-[#d1d5db] bg-white rounded-lg text-xs font-semibold transition-all duration-200"
              >
                Reschedule appointment
              </Link>
              <button 
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full py-2.5 text-center border border-red-200 text-red-500 hover:bg-red-55 rounded-lg text-xs font-semibold transition-all duration-200"
              >
                Cancel appointment
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Cancellation Modal Dialog */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-text-dark/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border-custom rounded-[16px] p-6 max-w-[420px] w-full space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-text-dark">Cancel Appointment</h3>
            </div>
            
            <p className="text-xs text-text-medium leading-relaxed">
              Are you sure you want to cancel your appointment with <span className="font-semibold">{appointment.doctorName}</span> on {formatApptDate(appointment.appointmentDate)}? This action cannot be undone.
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
                onClick={() => setIsCancelModalOpen(false)}
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
