import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, Clock, AlertTriangle, Plus, Calendar,
  MoreVertical, X, Check, Eye, HelpCircle
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useStaffAppointments } from '../../hooks/useStaffAppointments';
import { db } from '../../firebase/config';
import { doc, setDoc, getDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getTodayDateString, formatPatientId, formatPatientPhone, formatAppointmentDate, formatAppointmentTime, validateAppointmentData, validatePatientData } from '../../utils/dataFormat';
import { now, todayDisplayLong, formatDateStringDisplay } from '../../utils/appTime';

const PERSONA_CONFIG = {
  'Working Professional': { emoji: '💼', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Elderly': { emoji: '👴', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Student': { emoji: '🎓', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Default': { emoji: '👤', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

function ShapTooltip({ children, factors }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <div
            style={{
              position: 'absolute',
              bottom: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1a1a2e',
              color: 'white',
              borderRadius: '6px',
              padding: '0.625rem 0.875rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 99,
              minWidth: 165,
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
              SHAP Explainability
            </div>
            {factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', gap: '1rem', marginTop: '0.15rem' }}>
                <span style={{ color: '#e2e8f0' }}>{f.name}</span>
                <span style={{ color: f.value > 0 ? '#fca5a5' : '#86efac', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {f.value > 0 ? `+${f.value}%` : `${f.value}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { appointments: liveAppointments, loading, fetchTodaySummary } = useStaffAppointments();
  
  const [sortMode, setSortMode] = useState('time');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedPersona, setSelectedPersona] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [showWalkinDrawer, setShowWalkinDrawer] = useState(false);
  const [dateFilter, setDateFilter] = useState('upcoming'); // 'today' | 'upcoming' | 'all'

  // Dynamic today using shared Asia/Kolkata timezone function
  const todayStr = getTodayDateString();
  const todayDisplay = todayDisplayLong(); // IST-anchored via appTime.js

  const [walkinForm, setWalkinForm] = useState({
    name: '',
    phone: '',
    doctor: 'Dr. Rajesh Mehta',
    department: 'Cardiology',
    notes: '',
  });

  const appointments = liveAppointments;

  const handleAddWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinForm.name || !walkinForm.phone) {
      toast.error('Please enter patient name and phone number');
      return;
    }

    try {
      // Patient ID = clean digits from phone (schema contract)
      const patientId = formatPatientId(walkinForm.phone);
      const patientPhone = formatPatientPhone(walkinForm.phone);

      // Check if patient exists, otherwise create
      const patientRef = doc(db, 'patients', patientId);
      const patientSnap = await getDoc(patientRef);
      const patientDocData = {
        uid: patientId,
        name: walkinForm.name,
        phone: patientPhone,
        email: '',
        age: 30,
        gender: 'M',
        city: 'Hyderabad',
        bloodGroup: 'B+',
        persona: 'default',
        totalVisits: 1,
        totalNoShows: 0,
        trustScore: 85,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!patientSnap.exists()) {
        validatePatientData(patientDocData);
        await setDoc(patientRef, patientDocData);
      } else {
        const currentVisits = patientSnap.data().totalVisits || 0;
        await updateDoc(patientRef, { totalVisits: currentVisits + 1, updatedAt: serverTimestamp() });
      }

      // Create appointment
      const newApptRef = doc(collection(db, 'appointments'));

      // Resolve doctorId using schema-compliant format doc_001..doc_010
      const doctorMap = {
        'Dr. Rajesh Mehta': 'doc_001',
        'Dr. Priya Iyer': 'doc_002',
        'Dr. Sunil Nair': 'doc_003',
        'Dr. Kavita Reddy': 'doc_004',
        'Dr. Arjun Deshmukh': 'doc_005',
        'Dr. Meena Nair': 'doc_006',
        'Dr. Sanjay Joshi': 'doc_007',
        'Dr. Ravi Shankar': 'doc_008',
      };
      const docId = doctorMap[walkinForm.doctor] || 'doc_001';

      const newApptData = {
        patientId: patientId,
        doctorId: docId,
        doctorName: walkinForm.doctor,
        department: walkinForm.department,
        appointmentDate: formatAppointmentDate(now()), // IST-anchored via appTime.js
        appointmentTime: formatAppointmentTime(now()), // IST-anchored via appTime.js
        bookingDate: serverTimestamp(),
        leadTimeDays: 0,
        status: 'walk-in',
        consultationFee: 500,
        riskScore: 10,
        riskLevel: 'LOW',
        persona: 'default',
        familyNotified: false,
        reminderSent48h: false,
        reminderSent24h: false,
        reminderSentMorning: false,
        reminderSentFinal: false,
        patientConfirmed: true,
        bookingId: `APL-W-${Math.floor(1000 + Math.random() * 9000)}`,
        hospital: "Nidaan One Clinic, Jubilee Hills",
        room: "Walk-in Desk Cabin",
        notes: walkinForm.notes,
        cancelledReason: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      validateAppointmentData(newApptData);
      await setDoc(newApptRef, newApptData);

      setShowWalkinDrawer(false);
      setWalkinForm({ name: '', phone: '', doctor: 'Dr. Rajesh Mehta', department: 'Cardiology', notes: '' });
      toast.success(`${walkinForm.name} successfully added as walk-in!`);
    } catch (error) {
      console.error("Error creating walk-in:", error);
      toast.error("Failed to add walk-in: " + error.message);
    }
  };

  const handleRemind = async (apt) => {
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../firebase/config');
      const { sendWhatsAppDirect } = await import('../../utils/demoTriggers');
      
      const messageBody = `Nidaan One Clinic OPD: Hi ${apt.name}, a reminder for your appointment with ${apt.doctor} today at ${apt.time}. Reply 1 to confirm, 2 to reschedule.`;
      
      toast.promise(
        (async () => {
          try {
            const remindFn = httpsCallable(functions, 'sendWhatsAppReminder');
            await remindFn({ appointmentId: apt.id, reminderType: 'morning' });
            return true;
          } catch (cfError) {
            console.warn("Cloud function failed, using browser twilio fallback:", cfError);
            const directSuccess = await sendWhatsAppDirect(apt.phone, messageBody);
            
            const reminderRef = doc(collection(db, 'reminders'));
            await setDoc(reminderRef, {
              appointmentId: apt.id,
              patientId: apt.patientId,
              reminderType: 'manual_reminder',
              channel: 'whatsapp',
              status: directSuccess ? 'sent' : 'failed',
              messageBody,
              sentAt: serverTimestamp()
            });
            return directSuccess;
          }
        })(),
        {
          loading: 'Sending reminder...',
          success: 'Reminder WhatsApp sent successfully!',
          error: 'Failed to send reminder.'
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reminder.');
    }
  };

  const handleCancel = async (aptId) => {
    try {
      await toast.promise(
        updateDoc(doc(db, 'appointments', aptId), {
          status: 'cancelled',
          cancelledReason: 'Cancelled manually by staff',
          updatedAt: serverTimestamp()
        }),
        {
          loading: 'Cancelling appointment...',
          success: 'Appointment cancelled successfully!',
          error: 'Failed to cancel appointment.'
        }
      );
    } catch (error) {
      console.error("Cancel failed:", error);
      toast.error("Failed to cancel: " + error.message);
    }
  };

  const summary = fetchTodaySummary();
  const totalCount = summary.total;
  const highRiskCount = summary.highRisk;
  const mediumRiskCount = summary.mediumRisk;
  const lowRiskCount = summary.lowRisk;
  const confirmedCount = summary.confirmed;
  const awaitingCount = summary.pending;
  const walkinCount = appointments.filter(a => a.status === 'walk-in').length;

  const filteredAppointments = appointments.filter(apt => {
    // Date range filter
    if (dateFilter === 'today' && apt.appointmentDate !== todayStr) return false;
    if (dateFilter === 'upcoming' && apt.appointmentDate < todayStr) return false;
    // 'all' = no date restriction

    if (selectedDoctor !== 'all' && apt.doctor !== selectedDoctor) return false;
    if (selectedRisk !== 'all' && apt.riskLevel !== selectedRisk) return false;
    if (selectedPersona !== 'all' && apt.persona !== selectedPersona) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = apt.name.toLowerCase().includes(q) ||
                    apt.phone.includes(q) ||
                    apt.doctor.toLowerCase().includes(q) ||
                    apt.department.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (activeChip === 'All') return true;
    if (activeChip === 'High Risk') return apt.riskLevel === 'high';
    if (activeChip === 'Medium Risk') return apt.riskLevel === 'medium';
    if (activeChip === 'Low Risk') return apt.riskLevel === 'low';
    if (activeChip === 'Confirmed') return apt.reminders.step3 === 'success';
    if (activeChip === 'Awaiting') return apt.reminders.step3 !== 'success';
    if (activeChip === 'Walk-ins') return apt.isWalkin;

    return true;
  }).sort((a, b) => {
    if (sortMode === 'risk') {
      return b.riskScore - a.riskScore;
    }
    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [h, mPart] = timeStr.split(':');
      if (!mPart) return (parseInt(h) || 0) * 60;
      const m = parseInt(mPart.slice(0, 2)) || 0;
      const ampm = mPart.slice(3).toLowerCase();
      let hour = parseInt(h) || 0;
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      return hour * 60 + m;
    };
    return toMinutes(a.time) - toMinutes(b.time);
  });

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em', margin: 0 }}>
            Appointment Management
          </h1>
          <p style={{ fontSize: '15px', color: '#374151', marginTop: '0.25rem', margin: 0 }}>
            {todayDisplay} · <span style={{ color: '#1b504c', fontWeight: 600 }}>{totalCount} appointments</span> · <span style={{ color: '#ef4444', fontWeight: 600 }}>{highRiskCount} high risk</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={selectedDoctor}
              onChange={e => setSelectedDoctor(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#374151', outline: 'none', background: 'white' }}
            >
              <option value="all">All Doctors</option>
              <option value="Dr. Rajesh Mehta">Dr. Rajesh Mehta</option>
              <option value="Dr. Priya Iyer">Dr. Priya Iyer</option>
              <option value="Dr. Kavita Reddy">Dr. Kavita Reddy</option>
              <option value="Dr. Arjun Deshmukh">Dr. Arjun Deshmukh</option>
            </select>

            <select
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#374151', outline: 'none', background: 'white' }}
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>

            <select
              value={selectedPersona}
              onChange={e => setSelectedPersona(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#374151', outline: 'none', background: 'white' }}
            >
              <option value="all">All Personas</option>
              <option value="Working Professional">Working Professional</option>
              <option value="Elderly">Elderly</option>
              <option value="Student">Student</option>
              <option value="Default">Default</option>
            </select>
          </div>

          {/* Date Range Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
            {[['today', 'Today'], ['upcoming', 'Upcoming'], ['all', 'All']].map(([val, label]) => (
              <button key={val} onClick={() => setDateFilter(val)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  background: dateFilter === val ? '#1b504c' : 'transparent',
                  color: dateFilter === val ? 'white' : '#64748b', transition: 'all 120ms' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Sort Mode Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
            <button
              onClick={() => setSortMode('time')}
              style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', background: sortMode === 'time' ? '#1b504c' : 'transparent', color: sortMode === 'time' ? 'white' : '#64748b', transition: 'all 120ms' }}
            >
              By Time
            </button>
            <button
              onClick={() => setSortMode('risk')}
              style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', background: sortMode === 'risk' ? '#1b504c' : 'transparent', color: sortMode === 'risk' ? 'white' : '#64748b', transition: 'all 120ms' }}
            >
              By Risk
            </button>
          </div>

          <button
            onClick={() => setShowWalkinDrawer(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 1rem', background: '#1b504c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
          >
            <Plus size={15} /> Add Walk-in
          </button>
        </div>
      </div>

      {/* FILTER CHIPS (Underline + font-medium active state) */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
        {[
          { label: 'All', count: totalCount },
          { label: 'High Risk', count: highRiskCount },
          { label: 'Medium Risk', count: mediumRiskCount },
          { label: 'Low Risk', count: lowRiskCount },
          { label: 'Confirmed', count: confirmedCount },
          { label: 'Awaiting', count: awaitingCount },
          { label: 'Walk-ins', count: walkinCount },
        ].map(chip => {
          const active = activeChip === chip.label;
          return (
            <button
              key={chip.label}
              onClick={() => setActiveChip(chip.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0', borderRadius: 0, border: 'none',
                borderBottom: active ? '2px solid #1b504c' : '2px solid transparent', background: 'transparent',
                color: active ? '#1b504c' : '#64748b', fontSize: '0.82rem', fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <span>{chip.label}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.05rem 0.35rem', borderRadius: '99px', background: '#f1f5f9', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Filter lists..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', height: 36, background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 1rem 0 2.2rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: '#1a1a2e', outline: 'none' }}
        />
      </div>

      {/* APPOINTMENTS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredAppointments.map((apt) => {
          const persona = PERSONA_CONFIG[apt.persona] || PERSONA_CONFIG['Default'];
          const riskColor = apt.riskLevel === 'high' ? '#ef4444' : apt.riskLevel === 'medium' ? '#d97706' : '#16a34a';
          const isHighRisk = apt.riskLevel === 'high';

          // Count reminders sent (successes out of 3 steps)
          const sent = (apt.reminders.step1 === 'success' ? 1 : 0) +
                       (apt.reminders.step2 === 'success' ? 1 : 0) +
                       (apt.reminders.step3 === 'success' ? 1 : 0);
          const totalSteps = 3;

          return (
            <div
              key={apt.id}
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '0.75rem',
                border: '1px solid #f3f4f6',
                borderLeft: isHighRisk ? '3px solid #ef4444' : '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                transition: 'background-color 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              {/* TIME */}
              <div style={{ flex: '0 0 100px' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e', fontVariantNumeric: 'tabular-nums' }}>{apt.time}</div>
                <div style={{ fontSize: '0.68rem', color: '#1b504c', fontWeight: 600, marginTop: '0.15rem' }}>{formatDateStringDisplay(apt.appointmentDate)}</div>
              </div>

              {/* PATIENT INFO */}
              <div style={{ flex: '2 1 200px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', color: '#1b504c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.72rem', flexShrink: 0 }}>
                  {apt.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e' }}>{apt.name}</span>
                    {apt.isWalkin && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, background: '#f1f5f9', color: '#1b504c', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Walk-in</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{apt.phone}</div>
                  {apt.pastNoShows > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#ef4444', fontSize: '0.68rem', fontWeight: 500, marginTop: '0.25rem' }}>
                      {apt.pastNoShows} past no-shows
                    </div>
                  )}
                </div>
              </div>

              {/* PERSONA */}
              <div style={{ flex: '1.2 1 150px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: persona.bg, color: persona.text, fontSize: '0.72rem', fontWeight: 500 }}>
                  {persona.emoji} {apt.persona}
                </span>
                {apt.familyContact && (
                  <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 500, marginTop: '0.35rem' }}>
                    Family: {apt.familyContact}
                  </div>
                )}
              </div>

              {/* DOCTOR */}
              <div style={{ flex: '1.5 1 140px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f1f5f9', color: '#1b504c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem', flexShrink: 0 }}>
                  {apt.docAvatar}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151' }}>{apt.doctor}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{apt.department}</div>
                </div>
              </div>

              {/* RISK SCORE (Simple Text / Dot + % instead of circular donut) */}
              <div style={{ flex: '1 1 100px' }}>
                <ShapTooltip factors={apt.shapFactors}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'help' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: riskColor }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: riskColor, fontVariantNumeric: 'tabular-nums' }}>
                      {apt.riskScore}%
                    </span>
                  </div>
                </ShapTooltip>
              </div>

              {/* REMINDERS (Simple text label instead of progress line) */}
              <div style={{ flex: '1.5 1 160px' }}>
                <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 500 }}>
                  {sent}/{totalSteps} reminders sent
                </span>
              </div>

              {/* ACTIONS */}
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <button onClick={() => navigate(`/staff/patient/${apt.id}`)} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#374151', borderRadius: '6px', height: 30, padding: '0 0.6rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Eye size={12} /> View
                </button>
                <button onClick={() => handleRemind(apt)} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#1b504c', borderRadius: '6px', height: 30, padding: '0 0.6rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                  Remind
                </button>
                <button onClick={() => handleCancel(apt.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 500, fontSize: '0.75rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD WALK-IN DRAWER */}
      <AnimatePresence>
        {showWalkinDrawer && (
          <>
            <div onClick={() => setShowWalkinDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 199 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, background: '#ffffff', zIndex: 200, boxShadow: '-4px 0 24px rgba(0,0,0,0.04)', borderLeft: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>Add Walk-in</h2>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem', margin: 0 }}>Quick entry for same-day walk-in slots</p>
                </div>
                <button onClick={() => setShowWalkinDrawer(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={13} />
                </button>
              </div>
              <form onSubmit={handleAddWalkinSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Patient Name</label>
                  <input type="text" required placeholder="e.g. Priyanshu Sen" value={walkinForm.name} onChange={e => setWalkinForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', height: 38, padding: '0 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#1a1a2e', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input type="tel" required placeholder="e.g. +91 98765 43210" value={walkinForm.phone} onChange={e => setWalkinForm(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', height: 38, padding: '0 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#1a1a2e', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Assigned Doctor</label>
                  <select value={walkinForm.doctor} onChange={e => { const doc = e.target.value; let dept = 'Cardiology'; if (doc.includes('Deshmukh')) dept = 'Neurology'; if (doc.includes('Iyer')) dept = 'Orthopedics'; if (doc.includes('Reddy')) dept = 'General Medicine'; setWalkinForm(p => ({ ...p, doctor: doc, department: dept })); }} style={{ width: '100%', height: 38, padding: '0 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#1a1a2e', outline: 'none', background: 'white' }}>
                    <option value="Dr. Rajesh Mehta">Dr. Rajesh Mehta (Cardiology)</option>
                    <option value="Dr. Priya Iyer">Dr. Priya Iyer (Orthopedics)</option>
                    <option value="Dr. Kavita Reddy">Dr. Kavita Reddy (General Medicine)</option>
                    <option value="Dr. Arjun Deshmukh">Dr. Arjun Deshmukh (Neurology)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Department</label>
                  <input type="text" disabled value={walkinForm.department} style={{ width: '100%', height: 38, padding: '0 0.75rem', border: '1px solid #f3f4f6', borderRadius: '6px', fontSize: '0.85rem', color: '#94a3b8', background: '#f8fafc', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Notes</label>
                  <textarea placeholder="Symptoms, notes..." value={walkinForm.notes} onChange={e => setWalkinForm(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', height: 80, padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#1a1a2e', outline: 'none', resize: 'none' }} />
                </div>
                <button type="submit" style={{ width: '100%', height: 38, background: '#1b504c', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer', marginTop: 'auto' }}>
                  Confirm Walk-in
                </button>
              </form>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}
