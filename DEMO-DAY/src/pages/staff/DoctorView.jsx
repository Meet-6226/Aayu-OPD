import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, User, CheckCircle, AlertTriangle, AlertCircle,
  X, Check, Sparkles, ChevronRight, RefreshCw, FileText,
  Heart, Activity, MapPin, Phone, ShieldAlert
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getTodayDateString } from '../../utils/dataFormat';
import { todayDisplayLong } from '../../utils/appTime';

// ─── Case History Generator ───
const getPatientMedicalHistory = (patientId, patientName) => {
  const name = patientName || '';
  if (name.includes('Priya') || patientId === 'p-1') {
    return [
      {
        date: '14 Jun 2026',
        type: 'Routine Checkup',
        dept: 'Cardiology',
        doctor: 'Dr. Rajesh Mehta',
        notes: 'Episodes of mild chest tightness and palpitations during high work-stress hours. Sleep quality reported low.',
        vitals: { bp: '136/88 mmHg', hr: '84 bpm', temp: '98.4 F', spo2: '99%' },
        prescription: [
          { med: 'Tab. Metolar XR 25mg', dosage: '1-0-0 (Morning, after food)', duration: '30 days' },
          { med: 'Tab. Pan 40mg', dosage: '1-0-0 (Before breakfast)', duration: '15 days' }
        ],
        reports: 'ECG: Normal Sinus Rhythm. T-wave changes minimal, no acute ischemia. Lipids: Total Cholesterol 210 mg/dL (Borderline).'
      },
      {
        date: '10 Jan 2026',
        type: 'First Consultation',
        dept: 'General Medicine',
        doctor: 'Dr. Anjali Sen',
        notes: 'Complained of chronic fatigue, neck stiffness, and frequent headaches due to long screen hours.',
        vitals: { bp: '124/80 mmHg', hr: '76 bpm', temp: '98.6 F', spo2: '98%' },
        prescription: [
          { med: 'Cap. Becosules', dosage: '0-0-1 (After dinner)', duration: '30 days' },
          { med: 'Tab. Naprosyn 250mg', dosage: '1-0-1 (SOS for headache)', duration: '5 days' }
        ],
        reports: 'Lab: Vitamin D3 is 22 ng/mL (Deficient). Hb: 12.8 g/dL (Normal). Recommended daily walks and Vitamin D supplements.'
      }
    ];
  }

  if (name.includes('Ramesh') || name.includes('Gupta') || patientId === 'p-3') {
    return [
      {
        date: '18 May 2026',
        type: 'Hypertension Follow-up',
        dept: 'Cardiology',
        doctor: 'Dr. Rajesh Mehta',
        notes: 'Elderly patient with 8-year history of hypertension. Reports mild dyspnea on walking uphill or climbing stairs.',
        vitals: { bp: '148/92 mmHg', hr: '65 bpm', temp: '98.0 F', spo2: '96%' },
        prescription: [
          { med: 'Tab. Telma 40mg', dosage: '1-0-0 (Morning)', duration: '90 days' },
          { med: 'Tab. Amlopin 5mg', dosage: '0-0-1 (Night)', duration: '90 days' },
          { med: 'Tab. Ecosprin 75mg', dosage: '0-1-0 (After lunch)', duration: '90 days' }
        ],
        reports: 'ECHO: Grade-I Diastolic Dysfunction. Left Ventricular Ejection Fraction (LVEF): 56%. Recommends low-sodium diet and strict BP charting.'
      },
      {
        date: '12 Mar 2026',
        type: 'Osteoarthritis Consultation',
        dept: 'Orthopedics',
        doctor: 'Dr. Priya Iyer',
        notes: 'Complained of severe morning stiffness in bilateral knee joints. Finds it difficult to stand up from low chairs.',
        vitals: { bp: '138/84 mmHg', hr: '72 bpm', temp: '98.2 F', spo2: '97%' },
        prescription: [
          { med: 'Tab. Ultracet', dosage: '1-0-1 (For severe pain, after food)', duration: '10 days' },
          { med: 'Tab. Ostocalcium B12', dosage: '1-0-0 (Morning)', duration: '60 days' }
        ],
        reports: 'X-Ray Knee (B/L): Joint space narrowing in medial compartment, osteophytes present. Consistent with Moderate Knee Osteoarthritis.'
      }
    ];
  }

  if (name.includes('Rajesh') || name.includes('Kumar') || patientId === 'p-2') {
    return [
      {
        date: '02 May 2026',
        type: 'Chronic Knee Pain',
        dept: 'Orthopedics',
        doctor: 'Dr. Priya Iyer',
        notes: 'Bilateral knee pain post morning jogging. Joint swelling present on lateral aspect.',
        vitals: { bp: '130/82 mmHg', hr: '74 bpm', temp: '98.1 F', spo2: '99%' },
        prescription: [
          { med: 'Tab. Nucoxia 90mg', dosage: '0-0-1 (Night, after food)', duration: '7 days' },
          { med: 'Gel. Volini local application', dosage: 'Thrice daily', duration: '14 days' }
        ],
        reports: 'Clinical: Mild effusion. Knee MRI advised if pain persists after course.'
      }
    ];
  }

  if (name.includes('Sneha') || name.includes('Patil') || patientId === 'p-4') {
    return [
      {
        date: '10 Apr 2026',
        type: 'Anxiety & Insomnia Consultation',
        dept: 'General Medicine',
        doctor: 'Dr. Anjali Sen',
        notes: 'Student presenting with exam stress, panic episodes, and difficulty falling asleep. Sleep latency > 2 hours.',
        vitals: { bp: '115/75 mmHg', hr: '88 bpm', temp: '98.4 F', spo2: '99%' },
        prescription: [
          { med: 'Tab. Meloset 3mg', dosage: '0-0-1 (30 mins before bed)', duration: '15 days' },
          { med: 'Tab. Prodep 20mg', dosage: '1-0-0 (Morning)', duration: '30 days' }
        ],
        reports: 'Recommends cognitive behavioral therapy worksheets for sleep hygiene and reducing screen time post 9 PM.'
      }
    ];
  }

  // Fallback EMR template
  return [
    {
      date: '25 May 2026',
      type: 'Seasonal Influenza',
      dept: 'General Medicine',
      doctor: 'Dr. Anjali Sen',
      notes: 'High grade fever with dry cough, throat irritation, and body ache.',
      vitals: { bp: '120/80 mmHg', hr: '82 bpm', temp: '101.2 F', spo2: '98%' },
      prescription: [
        { med: 'Tab. Dolo 650mg', dosage: '1-1-1 (Every 6 hrs if fever > 100F)', duration: '3 days' },
        { med: 'Syp. Ascoril D', dosage: '10ml - thrice daily', duration: '5 days' },
        { med: 'Tab. Allegra-M', dosage: '0-0-1 (Night)', duration: '10 days' }
      ],
      reports: 'Throat swab negative for Covid/Influenza-A. Advised strict rest, warm saline gargles, and high fluid intake.'
    }
  ];
};

export default function DoctorViewPage() {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(true);
  const [showLateModal, setShowLateModal] = useState(false);
  const [lateStatus, setLateStatus] = useState(null); // null | 'sending' | 'done'
  const [loadingDots, setLoadingDots] = useState('.');
  const [isMobile, setIsMobile] = useState(false);
  
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('doc_001'); // default to Dr. Mehta
  const [docAppointments, setDocAppointments] = useState([]);
  const [patientsMap, setPatientsMap] = useState({});

  // EMR drawer state
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);

  // Check mobile viewport size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 1. Fetch all doctors
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctorsList(list);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch patients map & selected doctor's appointments for today
  useEffect(() => {
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const pMap = {};
      snapshot.forEach(docSnap => {
        pMap[docSnap.id] = docSnap.data();
      });
      setPatientsMap(pMap);
    });

    const todayStr = getTodayDateString();
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', selectedDocId),
      where('appointmentDate', '==', todayStr)
    );
    const unsubAppts = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Client-side sort by appointmentTime
      const parseTimeToMinutes = (t) => {
        if (!t) return 0;
        const [timePart, meridiem] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      list.sort((a, b) => parseTimeToMinutes(a.appointmentTime) - parseTimeToMinutes(b.appointmentTime));
      
      setDocAppointments(list);
    });

    return () => {
      unsubPatients();
      unsubAppts();
    };
  }, [selectedDocId]);

  // Loading dots ticker for open slot
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDots(dots => dots.length >= 3 ? '.' : dots + '.');
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleLateSelect = (mins) => {
    setLateStatus('sending');
    setTimeout(() => {
      setLateStatus('done');
      toast.success(`Patients notified: running ${mins} late.`);
      setTimeout(() => {
        setShowLateModal(false);
        setLateStatus(null);
      }, 1200);
    }, 1000);
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', paddingBottom: '100px' }}>
      
      {/* ─── TOP HEADER & SELECTOR ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
            Doctor's OPD Terminal
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
            Real-time patient flow, ML no-show risk assessment, and clinical records
          </p>
        </div>

        {/* Professional Select Dropdown */}
        <div style={{ 
          background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          padding: '0.4rem 0.8rem', minWidth: '260px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.015)' 
        }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            Schedule For:
          </label>
          <select
            value={selectedDocId}
            onChange={e => {
              setSelectedDocId(e.target.value);
              setShowNotification(true);
            }}
            style={{
              width: '100%', border: 'none', fontSize: '0.85rem', fontWeight: 600,
              color: '#1b504c', outline: 'none', background: 'transparent',
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            {doctorsList.map(docInfo => (
              <option key={docInfo.id} value={docInfo.id}>
                {docInfo.name} ({docInfo.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {(() => {
        const currentDoctor = doctorsList.find(d => d.id === selectedDocId) || { name: 'Dr. Rajesh Mehta', department: 'Cardiology', avatar: 'RM' };
        const initials = currentDoctor.avatar || (currentDoctor.name ? currentDoctor.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('') : 'DR');

        const totalCount = docAppointments.length;
        const confirmedCount = docAppointments.filter(a => a.status === 'confirmed').length;
        const atRiskCount = docAppointments.filter(a => (a.riskLevel || '').toUpperCase() === 'HIGH').length;
        const utilization = Math.min(100, Math.round((docAppointments.filter(a => ['confirmed', 'completed', 'walk-in'].includes(a.status)).length / 12) * 100));

        const cancelledAppt = docAppointments.find(a => a.status === 'cancelled');

        return (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '2rem' }}>
            
            {/* ─── LEFT COLUMN: Profile, Stats, Active Slots ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Doctor Details & Profile Card */}
              <div style={{ 
                background: 'white', borderRadius: '12px', padding: '1.5rem', 
                border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)', 
                display: 'flex', alignItems: 'center', gap: '1.25rem' 
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: '#e5f9f8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1b504c', fontSize: '1.3rem', fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif', border: '1px solid #97c9c4',
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
                      {currentDoctor.name}
                    </h2>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#16a34a', background: '#e8faee', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                      Active Today
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {currentDoctor.department} Specialist · Apollo Jubilee Hills
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ color: '#16a34a', fontWeight: 500 }}>Available for Clinical Session</span>
                    <span>·</span>
                    <span style={{ fontWeight: 500 }}>{todayDisplayLong()}</span>
                  </div>
                </div>
              </div>

              {/* Notification card if patient cancelled */}
              <AnimatePresence>
                {showNotification && cancelledAppt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      background: '#fffbeb', borderRadius: '10px', padding: '1rem', border: '1px solid #fde68a',
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem', position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', marginTop: '0.15rem' }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div style={{ flex: 1, paddingRight: '1.5rem' }}>
                      <p style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.45, fontWeight: 500, margin: 0 }}>
                        <strong>Waitlist Auto-Fill Triggered:</strong> Your {cancelledAppt.appointmentTime} patient rescheduled/cancelled. The system is automatically matching and notifying high-priority waitlisted patients.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNotification(false)}
                      style={{
                        background: 'none', border: 'none', color: '#b45309', cursor: 'pointer',
                        position: 'absolute', top: 12, right: 12, padding: '0.25rem',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Session Metrics Card */}
              <div style={{
                background: '#1b504c', borderRadius: '12px', padding: '1.5rem', color: 'white',
                boxShadow: '0 10px 25px rgba(27, 80, 76, 0.15)',
                backgroundImage: 'linear-gradient(135deg, #1b504c 0%, #153f3c 100%)',
              }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  Today's Session Metrics
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.85rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.35rem' }}>Total Patients</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '1rem' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.85rem', fontWeight: 700, color: '#86efac', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{confirmedCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.35rem' }}>Confirmed</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '1rem' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.85rem', fontWeight: 700, color: '#fcd34d', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{atRiskCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.35rem' }}>At Risk</div>
                  </div>
                </div>

                <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${utilization}%`, height: '100%', background: '#22c55e', borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                  <span>Session Slot Utilization</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: '#86efac', fontWeight: 600 }}>{utilization}% slots filled</span>
                </div>
              </div>

              {/* ACTIVE / UPCOMING PATIENT LIST */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
                    Active & Upcoming Slots
                  </h3>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 'auto' }}>Click card to view clinical history</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {docAppointments.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2.5rem 1.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📭</div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        No appointments scheduled for {currentDoctor.name} today.
                      </p>
                    </div>
                  ) : (
                    docAppointments.slice(0, 3).map((appt, i) => {
                      const pat = patientsMap[appt.patientId] || {};
                      const isCancelled = appt.status === 'cancelled' || appt.status === 'rescheduled';
                      
                      if (isCancelled) {
                        return (
                          <div key={appt.id} style={{ background: '#fafbfc', borderRadius: '12px', padding: '1.25rem', border: '2px dashed #cbd5e1', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#b45309', background: '#fff3d6', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                SLOT OPEN · {appt.appointmentTime}
                              </span>
                            </div>
                            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', fontWeight: 600, color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                              — Slot Available —
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem', margin: 0 }}>
                              Rescheduled: {pat.name || appt.patientName || 'Patient'}
                            </p>
                            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontSize: '0.78rem', fontWeight: 500 }}>
                              <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                              <span>Finding replacement from waitlist{loadingDots}</span>
                            </div>
                          </div>
                        );
                      }

                      // Normal active card
                      const labelText = i === 0 ? 'ACTIVE NOW' : 'UPCOMING';
                      const labelColor = i === 0 ? '#16a34a' : '#1b504c';
                      const labelBg = i === 0 ? '#e8faee' : '#e5f9f8';
                      const labelBorder = i === 0 ? '1px solid #bbf7d0' : '1px solid #97c9c4';
                      
                      const riskVal = appt.riskScore || 15;
                      const riskLvl = appt.riskLevel || 'LOW';
                      const riskColor = riskLvl.toUpperCase() === 'HIGH' ? '#ef4444' : riskLvl.toUpperCase() === 'MEDIUM' ? '#d97706' : '#16a34a';
                      const riskBg = riskLvl.toUpperCase() === 'HIGH' ? '#fee2e2' : riskLvl.toUpperCase() === 'MEDIUM' ? '#fff3d6' : '#e8faee';
                      const riskBorder = riskLvl.toUpperCase() === 'HIGH' ? '1px solid #fecaca' : riskLvl.toUpperCase() === 'MEDIUM' ? '1px solid #fde68a' : '1px solid #bbf7d0';

                      return (
                        <div 
                          key={appt.id} 
                          onClick={() => setSelectedPatientForHistory({ id: appt.patientId, name: pat.name || appt.patientName, ...pat })}
                          style={{ 
                            background: 'white', borderRadius: '12px', padding: '1.25rem', 
                            border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)', 
                            borderLeft: `4px solid ${i === 0 ? '#16a34a' : '#1b504c'}`,
                            cursor: 'pointer', transition: 'all 150ms'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.03)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.015)';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: labelColor, background: labelBg, padding: '0.2rem 0.5rem', borderRadius: '4px', border: labelBorder, letterSpacing: '0.04em' }}>
                              {labelText} · {appt.appointmentTime}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: riskColor, background: riskBg, padding: '0.2rem 0.5rem', borderRadius: '4px', border: riskBorder, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: riskColor }} />
                              {riskLvl.toUpperCase()} RISK ({riskVal}%)
                            </span>
                          </div>
                          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
                            {pat.name || appt.patientName || 'Unknown Patient'}
                          </h3>
                          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
                            {appt.department || currentDoctor.department} Consultation · {appt.notes || 'Routine checkup'}
                          </p>
                          <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#374151', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                              {pat.persona === 'elderly' ? '👴 Elderly' : pat.persona === 'student' ? '🎓 Student' : '💼 Working Pro'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 500 }}>
                              <Check size={12} strokeWidth={2.5} /> WhatsApp confirmed
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#1b504c', fontWeight: 600, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                              View History <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* ─── RIGHT COLUMN: Schedule Timeline Browser ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ 
                background: 'white', borderRadius: '12px', padding: '1.5rem', 
                border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)', 
                display: 'flex', flexDirection: 'column' 
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
                    Today's Schedule
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Complete clinical timeline (click row to view records)</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {docAppointments.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
                      No appointments scheduled today.
                    </div>
                  ) : (
                    docAppointments.map((slot, idx) => {
                      const pat = patientsMap[slot.patientId] || {};
                      const isCancelled = slot.status === 'cancelled' || slot.status === 'rescheduled';
                      
                      let statusBg = '#e8faee';
                      let statusText = '#16a34a';
                      let statusBorder = '1px solid #bbf7d0';
                      if (isCancelled) {
                        statusBg = '#fee2e2';
                        statusText = '#ef4444';
                        statusBorder = '1px solid #fecaca';
                      } else if (slot.status === 'checked-in') {
                        statusBg = '#e5f9f8';
                        statusText = '#1b504c';
                        statusBorder = '1px solid #97c9c4';
                      }

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            if (!isCancelled) {
                              setSelectedPatientForHistory({ id: slot.patientId, name: pat.name || slot.patientName, ...pat });
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', borderRadius: '8px',
                            background: isCancelled ? '#fafbfc' : 'white',
                            border: isCancelled ? '1px dashed #cbd5e1' : '1px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                            transition: 'transform 120ms',
                            cursor: isCancelled ? 'default' : 'pointer'
                          }}
                          onMouseEnter={e => {
                            if (!isCancelled) e.currentTarget.style.transform = 'translateX(3px)';
                          }}
                          onMouseLeave={e => {
                            if (!isCancelled) e.currentTarget.style.transform = 'none';
                          }}
                        >
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#475569', width: '70px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {slot.appointmentTime}
                          </span>

                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isCancelled ? '#94a3b8' : '#1a1a2e', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                            {isCancelled ? '— Slot Available —' : (pat.name || slot.patientName || 'Unknown Patient')}
                          </span>

                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            background: statusBg, color: statusText, border: statusBorder,
                            padding: '0.15rem 0.45rem', borderRadius: '4px',
                            letterSpacing: '0.04em'
                          }}>
                            {slot.status.toUpperCase()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ─── STICKY BOTTOM ACTION BAR (Sidebar Aware) ─── */}
      <div style={{
        position: 'fixed', bottom: 0, 
        left: isMobile ? 0 : '240px', right: 0,
        background: 'white', borderTop: '1px solid #f3f4f6',
        height: 68, display: 'flex', alignItems: 'center',
        padding: '0 1.5rem', zIndex: 99,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.02)',
      }}>
        <div style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}>
          <button
            onClick={() => setShowLateModal(true)}
            style={{
              width: '100%', height: 38, background: '#1b504c', color: 'white', border: 'none',
              borderRadius: '6px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500,
              fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            I'm Running Late — Notify Patients
          </button>
        </div>
      </div>

      {/* ─── LATE MODAL ─── */}
      <AnimatePresence>
        {showLateModal && (
          <>
            <div onClick={() => setShowLateModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 199 }} />
            
            <div
              style={{
                position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
                background: 'white', borderRadius: '8px', padding: '1.5rem',
                width: 'calc(100% - 2rem)', maxWidth: 360, zIndex: 200,
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
                    How late are you running?
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem', margin: 0 }}>
                    We will send automated WhatsApp pings to update slots.
                  </p>
                </div>
                <button
                  onClick={() => setShowLateModal(false)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: '4px', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={12} />
                </button>
              </div>

              {lateStatus === null && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                  {['10 min', '20 min', '30 min', '45 min'].map(option => (
                    <button
                      key={option}
                      onClick={() => handleLateSelect(option)}
                      style={{
                        height: 38, background: '#e5f9f8', color: '#1b504c', border: 'none',
                        borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {lateStatus === 'sending' && (
                <div style={{ padding: '1.5rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite' }} color="#1b504c" />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Notifying waiting patients...
                  </span>
                </div>
              )}

              {lateStatus === 'done' && (
                <div style={{ padding: '1rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e8faee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} color="#16a34a" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#16a34a' }}>
                    All waiting patients notified
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── NEW CLINICAL EMR DRAWER (Right Slide In) ─── */}
      <AnimatePresence>
        {selectedPatientForHistory && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatientForHistory(null)} 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }} 
            />
            
            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '100%', maxWidth: '480px',
                background: 'white', zIndex: 1000,
                boxShadow: '-10px 0 30px rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column',
                borderLeft: '1px solid #e2e8f0'
              }}
            >
              {/* Drawer Header */}
              <div style={{ 
                padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#fafbfc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#1b504c" />
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
                    Patient Clinical EMR File
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPatientForHistory(null)}
                  style={{ 
                    background: '#e2e8f0', border: 'none', borderRadius: '50%', 
                    width: 28, height: 28, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', cursor: 'pointer', color: '#475569' 
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                
                {/* Patient Profile Card inside Drawer */}
                <div style={{ 
                  background: '#f8fafc', borderRadius: '10px', padding: '1rem', 
                  border: '1px solid #e2e8f0', marginBottom: '1.5rem' 
                }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b504c', margin: 0 }}>
                    {selectedPatientForHistory.name}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: '#475569' }}>
                    <div>Age/Gender: <strong>{selectedPatientForHistory.age} yrs / {selectedPatientForHistory.gender}</strong></div>
                    <div>ABHA ID: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedPatientForHistory.abhaId || 'N/A'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Phone size={12} /> <span>{selectedPatientForHistory.phone || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> <span>{selectedPatientForHistory.distance || '10'} km away</span>
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: '1px solid #e2e8f0', marginTop: '0.75rem', paddingTop: '0.75rem', 
                    display: 'flex', gap: '0.5rem', flexWrap: 'wrap' 
                  }}>
                    <div style={{ 
                      background: '#1b504c', color: 'white', fontSize: '0.68rem', 
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 
                    }}>
                      Trust Score: {selectedPatientForHistory.trustScore || 85}%
                    </div>
                    <div style={{ 
                      background: '#e2e8f0', color: '#334155', fontSize: '0.68rem', 
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 500 
                    }}>
                      Past Visits: {selectedPatientForHistory.pastVisits || 0}
                    </div>
                    <div style={{ 
                      background: '#fee2e2', color: '#991b1b', fontSize: '0.68rem', 
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 
                    }}>
                      Past No-Shows: {selectedPatientForHistory.pastNoShows || 0}
                    </div>
                  </div>
                </div>

                {/* EMR CLINICAL HISTORY SECTION */}
                <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  Visit History & Prescriptions
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {getPatientMedicalHistory(selectedPatientForHistory.id, selectedPatientForHistory.name).map((record, rIdx) => (
                    <div 
                      key={rIdx} 
                      style={{ 
                        borderLeft: '2px solid #1b504c', paddingLeft: '1rem', 
                        position: 'relative' 
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute', left: -5, top: 4,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#1b504c'
                      }} />

                      {/* Record Date & Doctor */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1b504c' }}>
                          {record.date}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 500 }}>
                          {record.type}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                        Consultant: <strong>{record.doctor}</strong> ({record.dept})
                      </div>

                      {/* Vitals Section */}
                      {record.vitals && (
                        <div style={{ 
                          display: 'flex', gap: '0.75rem', background: '#fafbfc', 
                          padding: '0.4rem 0.6rem', borderRadius: '6px', 
                          border: '1px solid #f1f5f9', fontSize: '0.7rem', 
                          color: '#475569', marginBottom: '0.5rem' 
                        }}>
                          <div>BP: <strong>{record.vitals.bp}</strong></div>
                          <div>HR: <strong>{record.vitals.hr}</strong></div>
                          <div>Temp: <strong>{record.vitals.temp}</strong></div>
                          <div>SpO2: <strong>{record.vitals.spo2}</strong></div>
                        </div>
                      )}

                      {/* Doctor Notes */}
                      <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4, background: '#f8fafc', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem', borderLeft: '3px solid #cbd5e1' }}>
                        <strong>Clinical Assessment:</strong> {record.notes}
                      </div>

                      {/* Prescription Table */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1b504c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Activity size={12} /> Prescribed Medications
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '0.35rem 0.5rem', fontWeight: 600, color: '#475569' }}>Medicine</th>
                                <th style={{ padding: '0.35rem 0.5rem', fontWeight: 600, color: '#475569' }}>Dosage</th>
                                <th style={{ padding: '0.35rem 0.5rem', fontWeight: 600, color: '#475569' }}>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.prescription.map((med, mIdx) => (
                                <tr key={mIdx} style={{ borderBottom: mIdx < record.prescription.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                  <td style={{ padding: '0.35rem 0.5rem', color: '#1a1a2e', fontWeight: 500 }}>{med.med}</td>
                                  <td style={{ padding: '0.35rem 0.5rem', color: '#475569' }}>{med.dosage}</td>
                                  <td style={{ padding: '0.35rem 0.5rem', color: '#64748b' }}>{med.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Lab Reports */}
                      {record.reports && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1b504c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Heart size={12} /> Diagnostics & Reports
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, background: '#e5f9f8', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #97c9c4', lineHeight: 1.4 }}>
                            {record.reports}
                          </p>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

              </div>

              {/* Drawer Footer */}
              <div style={{ 
                padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', 
                display: 'flex', gap: '0.75rem', background: '#fafbfc' 
              }}>
                <button
                  onClick={() => setSelectedPatientForHistory(null)}
                  style={{
                    flex: 1, height: 38, background: '#1b504c', color: 'white',
                    border: 'none', borderRadius: '6px', fontSize: '0.85rem',
                    fontWeight: 600, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                  }}
                >
                  <CheckCircle size={16} /> Close File
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}
