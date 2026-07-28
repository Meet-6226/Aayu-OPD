import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  CalendarDays,
  RefreshCcw,
  Stethoscope,
  BarChart3,
  BellRing,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Sparkles,
  UserRound,
  Calendar,
  CheckCircle,
  Check,
  X,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { todayDisplayShort } from '../utils/appTime';
import { useStaffAppointments } from '../hooks/useStaffAppointments';
import { useSlotRecovery } from '../hooks/useSlotRecovery';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, setDoc, query, where, serverTimestamp } from 'firebase/firestore';

// ─── Nav Config ───
const navItems = [
  { path: '/staff/dashboard',    label: 'Morning Briefing', icon: LayoutDashboard, badge: null },
  { path: '/staff/appointments', label: 'Appointments',      icon: CalendarDays,    badge: '32' },
  { path: '/staff/slot-recovery',label: 'Slot Recovery',     icon: RefreshCcw,      badge: '4' },
  { path: '/staff/doctor-view',  label: "Doctor's View",     icon: Stethoscope,     badge: null },
  { path: '/staff/admin',        label: 'Admin Analytics',   icon: BarChart3,       badge: null },
  { path: '/staff/reminders',    label: 'Reminder Log',      icon: BellRing,        badge: null },
  { path: '#emergency',          label: 'Emergency Swap',    icon: AlertTriangle,   badge: null },
];

const PAGE_TITLES = {
  '/staff/dashboard':    { title: 'Morning Briefing',         sub: 'AI predictions for today\'s OPD' },
  '/staff/appointments': { title: 'Appointment Management',   sub: 'All scheduled patients for today' },
  '/staff/slot-recovery':{ title: 'Slot Recovery & Waitlist', sub: 'Real-time empty slot management' },
  '/staff/doctor-view':  { title: "Doctor's Schedule",        sub: 'Clinical view and utilization' },
  '/staff/admin':        { title: 'Admin Analytics',           sub: 'Revenue intelligence & heatmaps' },
  '/staff/reminders':    { title: 'Reminder Log',              sub: 'WhatsApp, SMS & voice history' },
};

const NOTIFICATIONS = [
  { id: 1, icon: RefreshCcw,   color: '#16a34a', bg: '#e8faee', text: 'Slot recovered: Dr. Mehta 11:00 AM', time: '2 min ago',  type: 'success' },
  { id: 2, icon: UserRound,    color: '#b45309', bg: '#fff3d6', text: 'Priya Sharma rescheduled appointment', time: '5 min ago',  type: 'warning' },
  { id: 3, icon: Bell,         color: '#ef4444', bg: '#fee2e2', text: 'High-risk alert: Mohammed Ali (92%)',  time: '18 min ago', type: 'danger' },
  { id: 4, icon: CheckCircle,  color: '#16a34a', bg: '#e8faee', text: 'Reminder delivered via WhatsApp (×8)', time: '24 min ago', type: 'success' },
];

// ─── Single Nav Item ───
function SidebarItem({ item, onClick }) {
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);

  if (item.path.startsWith('#')) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          if (onClick) onClick();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 1rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.85rem',
          color: '#ef4444',
          background: hovered ? '#fef2f2' : 'transparent',
          borderLeft: '3px solid transparent',
          transition: 'all 150ms ease',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          paddingLeft: '1rem',
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex', color: '#ef4444' }}>
          <Icon size={18} strokeWidth={1.5} />
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        cursor: 'pointer',
        textDecoration: 'none',
        fontWeight: 500,
        fontSize: '0.85rem',
        color: isActive ? '#1b504c' : '#374151',
        background: hovered ? '#f8fafc' : 'transparent',
        borderLeft: isActive ? '3px solid #1b504c' : '3px solid transparent',
        transition: 'all 150ms ease',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        paddingLeft: isActive ? 'calc(1rem - 3px)' : '1rem',
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{ flexShrink: 0, display: 'flex', color: isActive ? '#1b504c' : '#6b7280' }}>
            <Icon size={18} strokeWidth={1.5} />
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
          {item.badge && item.badge !== '0' && (
            <span style={{
              background: isActive ? '#1b504c' : '#e2e8f0',
              color: isActive ? 'white' : '#475569',
              fontSize: '0.65rem',
              fontWeight: 600,
              padding: '0.1rem 0.4rem',
              borderRadius: '6px',
              minWidth: 18,
              textAlign: 'center',
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ───
function Sidebar({ onEmergencyClick }) {
  const navigate = useNavigate();
  const { appointments } = useStaffAppointments();
  const { openSlots } = useSlotRecovery();

  const userRole = localStorage.getItem('nidaan_staff_role') || 'admin';
  const profileName = userRole === 'doctor' ? 'Dr. Rajesh Mehta' : 'OPD Administrator';
  const profileRole = userRole === 'doctor' ? 'Consultant Doctor' : 'Admin Staff';
  const profileInitials = userRole === 'doctor' ? 'RM' : 'OA';

  const dynamicBadges = {
    '/staff/appointments': String(appointments.length),
    '/staff/slot-recovery': String(openSlots.filter(s => s.status !== 'recovered').length),
  };

  const filteredNavItems = navItems.filter(item => {
    if (userRole === 'doctor') {
      return item.path === '/staff/doctor-view';
    }
    return true;
  });

  return (
    <aside
      style={{
        background: 'white',
        borderRight: '1px solid #f3f4f6',
        width: 240,
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid #f3f4f6',
        height: 64,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '6px',
          background: '#1b504c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
        }} onClick={() => navigate(userRole === 'doctor' ? '/staff/doctor-view' : '/staff/dashboard')}>
          <Sparkles size={16} color="white" />
        </div>
        <div 
          style={{ overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}
          onClick={() => navigate(userRole === 'doctor' ? '/staff/doctor-view' : '/staff/dashboard')}
        >
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Nidaan One OPD
          </div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Intelligence
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.15rem', overflowY: 'auto' }}>
        {filteredNavItems.map(item => (
          <SidebarItem 
            key={item.path} 
            item={{
              ...item,
              badge: dynamicBadges[item.path] !== undefined ? dynamicBadges[item.path] : item.badge
            }} 
            onClick={item.path === '#emergency' ? onEmergencyClick : undefined}
          />
        ))}
      </nav>

      {/* Bottom — Settings & Logout */}
      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <button
          onClick={() => toast('Settings are managed by the Clinic Administrator.', { icon: '⚙️', style: { borderRadius: '8px', background: '#1b504c', color: '#fff', fontSize: '0.8rem' } })}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 0.75rem', borderRadius: '6px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#6b7280', fontSize: '0.85rem', fontWeight: 500,
            width: '100%', textAlign: 'left', transition: 'background 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <Settings size={18} strokeWidth={1.5} />
          <span>Settings</span>
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('nidaan_staff_logged_in');
            localStorage.removeItem('nidaan_staff_role');
            navigate('/');
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 0.75rem', borderRadius: '6px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#6b7280', fontSize: '0.85rem', fontWeight: 500,
            width: '100%', textAlign: 'left', transition: 'background 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span>Logout</span>
        </button>

        {/* User profile row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 0.75rem 0.25rem',
          marginTop: '0.25rem',
          borderTop: '1px solid #f3f4f6',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#1b504c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.68rem', fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0,
          }}>
            {profileInitials}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1a1a2e', lineHeight: 1.2 }}>{profileName}</div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{profileRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Notification Panel ───
function NotificationPanel({ onClose }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 149, background: 'rgba(0,0,0,0.05)' }}
      />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 320, background: 'white', zIndex: 150,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid #f3f4f6',
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, fontSize: '0.95rem', color: '#1a1a2e', letterSpacing: '-0.01em' }}>Notifications</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {NOTIFICATIONS.map((notif, i) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: '8px',
                  marginBottom: '0.25rem',
                  background: i === 0 ? '#fcfdfd' : 'transparent',
                  border: '1px solid transparent',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: notif.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={notif.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#374151', lineHeight: 1.4, marginBottom: '0.15rem' }}>
                    {notif.text}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{notif.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ─── Header ───
function Header({ onNotifClick, showNotifPanel }) {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Nidaan One OPD Intelligence', sub: 'AI-powered OPD management' };
  const today = todayDisplayShort(); // IST-anchored via appTime.js

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #f3f4f6',
      padding: '0 1.5rem',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexShrink: 0,
    }}>
      <div style={{ flex: '0 0 auto', minWidth: 0 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
          {pageInfo.title}
        </h1>
      </div>

      {/* Search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: 380, margin: '0 auto' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search patients, doctors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              background: '#f8fafc',
              border: '1px solid transparent',
              borderRadius: '6px',
              padding: '0 1rem 0 2.2rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '0.82rem',
              color: '#1a1a2e',
              outline: 'none',
              transition: 'all 150ms',
            }}
            onFocus={e => { e.target.style.borderColor = '#1b504c'; e.target.style.background = 'white'; }}
            onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f8fafc'; }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
          Today, {today}
        </div>

        <button
          onClick={onNotifClick}
          style={{
            background: showNotifPanel ? '#f8fafc' : 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6b7280',
            position: 'relative',
          }}
        >
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 5, height: 5, background: '#ef4444',
            borderRadius: '50%'
          }} />
        </button>
      </div>
    </header>
  );
}

// ─── Emergency Swap Modal ───
function EmergencySwapModal({ onClose }) {
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedAbsentDoc, setSelectedAbsentDoc] = useState(null);
  const [swappingProgress, setSwappingProgress] = useState(false);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const BACKUP_MAPPING = {
    'doc_001': { id: 'doc_007', name: 'Dr. Sanjay Joshi', department: 'Cardiology', room: 'OPD Room 305' },
    'doc_002': { id: 'doc_005', name: 'Dr. Arjun Deshmukh', department: 'General Medicine', room: 'OPD Room 102' },
    'doc_003': { id: 'doc_004', name: 'Dr. Kavita Reddy', department: 'Dermatology', room: 'OPD Room 210' },
    'doc_008': { id: 'doc_006', name: 'Dr. Meena Nair', department: 'Neurology', room: 'OPD Room 403' },
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const primaryDocs = docs.filter(d => !['doc_004', 'doc_005', 'doc_006', 'doc_007'].includes(d.id));
        setDoctorsList(primaryDocs);
      } catch (err) {
        console.error(err);
      }
      setLoadingDocs(false);
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!selectedAbsentDoc) {
      setAppointmentsCount(0);
      return;
    }
    const fetchCount = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'appointments'),
          where('doctorId', '==', selectedAbsentDoc.id),
          where('appointmentDate', '==', todayStr),
          where('status', 'in', ['confirmed', 'pending'])
        );
        const snap = await getDocs(q);
        setAppointmentsCount(snap.size);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
  }, [selectedAbsentDoc]);

  const handleHotSwapBackup = async () => {
    if (!selectedAbsentDoc) return;
    const backup = BACKUP_MAPPING[selectedAbsentDoc.id];
    if (!backup) {
      toast.error("No emergency backup configured for this practitioner.");
      return;
    }

    setSwappingProgress(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', selectedAbsentDoc.id),
        where('appointmentDate', '==', todayStr),
        where('status', 'in', ['confirmed', 'pending'])
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.success(`Emergency Activated: ${backup.name} is now on duty.`, { id: 'sidebar-swap-toast' });
        onClose();
        setSwappingProgress(false);
        return;
      }

      for (const apptDoc of snap.docs) {
        const appt = apptDoc.data();
        const apptRef = doc(db, 'appointments', apptDoc.id);
        await updateDoc(apptRef, {
          doctorId: backup.id,
          doctorName: backup.name,
          room: backup.room,
          notes: `Emergency reassignment from ${appt.doctorName}`,
          updatedAt: serverTimestamp()
        });

        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          patientId: appt.patientId,
          title: '🚨 OPD Doctor Change Alert',
          body: `Due to an emergency, your appointment today at ${appt.appointmentTime} has been re-assigned to ${backup.name} in ${backup.room}. Please report there directly.`,
          sentAt: serverTimestamp(),
          type: 'alert',
          read: false
        });

        const reminderRef = doc(collection(db, 'reminders'));
        await setDoc(reminderRef, {
          appointmentId: apptDoc.id,
          patientId: appt.patientId,
          reminderType: 'doctor_change_hot_swap',
          channel: 'whatsapp',
          status: 'sent',
          messageBody: `Nidaan One Clinic Alert: Dear patient, due to an emergency, your appointment today at ${appt.appointmentTime} has been re-assigned to ${backup.name} in ${backup.room}.`,
          sentAt: serverTimestamp()
        });
      }

      toast.success(`Emergency activated! ${snap.size} appointments re-routed to ${backup.name}. Patients notified.`, { id: 'sidebar-swap-toast', duration: 4000 });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to activate emergency hot-swap.");
    }
    setSwappingProgress(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ background: '#ef4444', padding: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
              Emergency Backup Activation
            </h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Global Doctor Absentee Swap</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', fontSize: '0.82rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingDocs ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>Loading doctor roster...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#475569' }}>Select Absent Doctor:</label>
              <select
                onChange={(e) => {
                  const docObj = doctorsList.find(d => d.id === e.target.value);
                  setSelectedAbsentDoc(docObj || null);
                }}
                style={{
                  width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                  background: 'white', outline: 'none', fontSize: '0.82rem'
                }}
              >
                <option value="">-- Choose practitioner --</option>
                {doctorsList.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                ))}
              </select>
            </div>
          )}

          {selectedAbsentDoc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {BACKUP_MAPPING[selectedAbsentDoc.id] ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>Recommended Backup:</span>
                    <strong style={{ color: '#16a34a' }}>{BACKUP_MAPPING[selectedAbsentDoc.id].name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>Cabin Destination:</span>
                    <span style={{ fontWeight: 600 }}>{BACKUP_MAPPING[selectedAbsentDoc.id].room}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#166534', paddingTop: '0.35rem', borderTop: '1px dashed #bbf7d0' }}>
                    <span>Affected Appointments Today:</span>
                    <strong>{appointmentsCount}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#ef4444', fontWeight: 600, padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>
                  No default backup doctor configured for this practitioner.
                </div>
              )}

              {/* Actions list */}
              <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <Check size={14} color="#16a34a" />
                  <span>Updates today's schedule in real-time.</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <Check size={14} color="#16a34a" />
                  <span>Re-routes affected slot rooms in patient charts.</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <Check size={14} color="#16a34a" />
                  <span>Sends instant WhatsApp alerts with backup room details.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', background: '#f8fafc' }}>
          <button
            disabled={swappingProgress}
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1',
              borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          {selectedAbsentDoc && BACKUP_MAPPING[selectedAbsentDoc.id] && (
            <button
              disabled={swappingProgress}
              onClick={handleHotSwapBackup}
              style={{
                padding: '0.45rem 1rem', background: '#ef4444', color: 'white', border: 'none',
                borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: swappingProgress ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}
            >
              {swappingProgress ? 'Re-routing...' : 'Confirm Hot-Swap'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ───
export default function DashboardLayout({ children }) {
  const location = useLocation();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      
      {/* Sidebar — desktop only */}
      {!isMobile && <Sidebar onEmergencyClick={() => setShowEmergencyModal(true)} />}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <Header
          onNotifClick={() => setShowNotifPanel(p => !p)}
          showNotifPanel={showNotifPanel}
        />

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                minHeight: 'calc(100vh - 64px)',
                padding: '1.5rem',
              }}
            >
              {/* Overhaul Layout Center Container: 1200px max width */}
              <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifPanel && (
          <NotificationPanel onClose={() => setShowNotifPanel(false)} />
        )}
      </AnimatePresence>

      {/* Emergency Swap Modal */}
      {showEmergencyModal && (
        <EmergencySwapModal onClose={() => setShowEmergencyModal(false)} />
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '0.8rem',
            borderRadius: '6px',
            border: '1px solid #f3f4f6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            background: 'white',
            color: '#1a1a2e',
          },
          success: { iconTheme: { primary: '#1b504c', secondary: 'white' } },
        }}
      />
    </div>
  );
}
