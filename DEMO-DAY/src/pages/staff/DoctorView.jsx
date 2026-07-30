import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, User, CheckCircle, AlertTriangle, AlertCircle,
  X, Check, Sparkles, ChevronRight, RefreshCw, FileText,
  Heart, Activity, MapPin, Phone, ShieldAlert,
  Pill, Droplets, Shield, Wind, Plus
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getTodayDateString } from '../../utils/dataFormat';
import { todayDisplayLong } from '../../utils/appTime';
import DoctorRxGeneratorModal from '../../components/shared/DoctorRxGeneratorModal';
import { Video } from 'lucide-react';

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
  const userRole = localStorage.getItem('aayu_staff_role') || 'admin';
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
  const [patientRealHistory, setPatientRealHistory] = useState([]);

  // Rx Modal state
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxPatient, setRxPatient] = useState(null);

  // Online consultation states
  const [activeTab, setActiveTab] = useState('in_clinic'); // 'in_clinic' | 'virtual_opd'
  const [activeVideoCallAppt, setActiveVideoCallAppt] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState('today'); // 'today' | 'tomorrow' | 'upcoming'
  const [scratchpadText, setScratchpadText] = useState('');

  const handleStartVideoCall = async (appt) => {
    try {
      setActiveVideoCallAppt(appt);
      const apptRef = doc(db, 'appointments', appt.id);
      await updateDoc(apptRef, {
        callStatus: 'in_progress',
        updatedAt: new Date()
      });
      toast.success("Joined video room lobby.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to start call");
    }
  };

  const handleEndVideoCall = async () => {
    if (!activeVideoCallAppt) return;
    try {
      const apptRef = doc(db, 'appointments', activeVideoCallAppt.id);
      await updateDoc(apptRef, {
        callStatus: 'completed',
        status: 'completed',
        updatedAt: new Date()
      });
      
      const pat = patientsMap[activeVideoCallAppt.patientId] || {};
      const rxPatInfo = {
        id: activeVideoCallAppt.patientId,
        name: (pat.name && pat.name !== 'User' ? pat.name : null) || (activeVideoCallAppt.patientName && activeVideoCallAppt.patientName !== 'User' ? activeVideoCallAppt.patientName : null) || 'Patient',
        appointmentId: activeVideoCallAppt.id,
        doctorId: activeVideoCallAppt.doctorId,
        doctorName: activeVideoCallAppt.doctorName,
        department: activeVideoCallAppt.department,
        hospital: activeVideoCallAppt.hospital || 'Aayu Clinic',
        vitals: { bp: activeVideoCallAppt.bp || '120/80 mmHg', hr: activeVideoCallAppt.heartRate || '72 bpm' },
        ...pat
      };
      
      setRxPatient(rxPatInfo);
      setIsRxModalOpen(true);
      setActiveVideoCallAppt(null);
      toast.success("Consultation complete. Loading AI Prescription Panel.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to complete call");
    }
  };

  // Check mobile viewport size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch real-time prescription history from Firestore for selected patient
  useEffect(() => {
    if (!selectedPatientForHistory?.id) {
      setPatientRealHistory([]);
      return;
    }
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', selectedPatientForHistory.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyList = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.prescription) {
          // Format date from YYYY-MM-DD to DD MMM YYYY if needed
          let displayDate = data.prescription.date || data.appointmentDate || '';
          if (displayDate.includes('-')) {
            const parts = displayDate.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
              const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
              displayDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
          }

          historyList.push({
            date: displayDate,
            type: 'Consultation',
            dept: data.prescription.department || data.department || 'Cardiology',
            doctor: data.prescription.doctorName || data.doctorName || 'Doctor',
            notes: data.prescription.diagnosis?.map(d => d.name).join(', ') || data.notes || 'Routine follow-up',
            vitals: {
              bp: data.prescription.vitals?.bp || data.bp || '120/80 mmHg',
              hr: data.prescription.vitals?.heartRate || data.heartRate || '72 bpm',
              temp: data.prescription.vitals?.temp || '98.6 F',
              spo2: data.prescription.vitals?.spo2 || '98%'
            },
            prescription: data.prescription.medicines?.map(m => ({
              med: m.name,
              dosage: m.timing,
              duration: m.duration
            })) || [],
            reports: data.prescription.precautions?.map(p => p.detail).join('\n') || ''
          });
        }
      });
      // Sort by date descending
      historyList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPatientRealHistory(historyList);
    });
    return () => unsubscribe();
  }, [selectedPatientForHistory?.id]);

  // 1. Fetch all doctors
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctorsList(list);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch patients map & selected doctor's appointments based on date filter
  useEffect(() => {
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const pMap = {};
      snapshot.forEach(docSnap => {
        pMap[docSnap.id] = docSnap.data();
      });
      setPatientsMap(pMap);
    });

    const todayStr = getTodayDateString();
    
    // Calculate tomorrow date string
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().split('T')[0];

    let q;
    if (selectedDateFilter === 'today') {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', selectedDocId),
        where('appointmentDate', '==', todayStr)
      );
    } else if (selectedDateFilter === 'tomorrow') {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', selectedDocId),
        where('appointmentDate', '==', tomorrowStr)
      );
    } else {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', selectedDocId)
      );
    }

    const unsubAppts = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Client-side filter for 'upcoming' (show today and all future dates)
      if (selectedDateFilter === 'upcoming') {
        list = list.filter(appt => appt.appointmentDate >= todayStr);
      }
      
      // Client-side sort by date first, then by time
      const parseTimeToMinutes = (t) => {
        if (!t) return 0;
        const [timePart, meridiem] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      list.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) {
          return a.appointmentDate.localeCompare(b.appointmentDate);
        }
        return parseTimeToMinutes(a.appointmentTime) - parseTimeToMinutes(b.appointmentTime);
      });
      
      setDocAppointments(list);
    });

    return () => {
      unsubPatients();
      unsubAppts();
    };
  }, [selectedDocId, selectedDateFilter]);

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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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

          {/* Date Filter Dropdown */}
          <div style={{ 
            background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.4rem 0.8rem', minWidth: '180px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.015)' 
          }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Filter:
            </label>
            <select
              value={selectedDateFilter}
              onChange={e => setSelectedDateFilter(e.target.value)}
              style={{
                width: '100%', border: 'none', fontSize: '0.85rem', fontWeight: 600,
                color: '#1b504c', outline: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
            >
              <option value="today">Today's Queue</option>
              <option value="tomorrow">Tomorrow's Queue</option>
              <option value="upcoming">All Upcoming Queue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => { setActiveTab('in_clinic'); setActiveVideoCallAppt(null); }}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'in_clinic' ? '#1b504c' : '#64748b',
            borderBottom: activeTab === 'in_clinic' ? '3px solid #1b504c' : '3px solid transparent',
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          In-Clinic Queue
        </button>
        <button
          onClick={() => { setActiveTab('virtual_opd'); setActiveVideoCallAppt(null); }}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700,
            color: activeTab === 'virtual_opd' ? '#1b504c' : '#64748b',
            borderBottom: activeTab === 'virtual_opd' ? '3px solid #1b504c' : '3px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
          Virtual OPD (Online)
        </button>
      </div>

      {(() => {
        const currentDoctor = doctorsList.find(d => d.id === selectedDocId) || { name: 'Dr. Rajesh Mehta', department: 'Cardiology', avatar: 'RM' };
        const initials = currentDoctor.avatar || (currentDoctor.name ? currentDoctor.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('') : 'DR');

        const DEMO_PATIENT_IDS = new Set([
          'patient_priya_demo',
          '9199750000',
          '919199750000',
        ]);
        const isDemoId = (id) =>
          !id ||
          DEMO_PATIENT_IDS.has(id) ||
          /^p-\d+$/.test(id);

        const isRealPatient = (appt, pat) => {
          if (isDemoId(appt.patientId)) return false;
          const apptName = (appt.patientName || '').trim();
          const patName = (pat.name || '').trim();
          const patPhone = (pat.phone || '').trim();
          const isStub =
            (apptName === 'User' || apptName === '') &&
            (patName === 'User' || patName === '') &&
            !patPhone;
          return !isStub;
        };

        const filteredAppts = docAppointments.filter(appt => {
          const pat = patientsMap[appt.patientId] || {};
          return isRealPatient(appt, pat);
        });

        const tabFilteredAppts = filteredAppts.filter(appt => {
          if (activeTab === 'virtual_opd') {
            return appt.consultationMode === 'online';
          } else {
            return appt.consultationMode !== 'online';
          }
        });

        const totalCount = tabFilteredAppts.length;
        const confirmedCount = tabFilteredAppts.filter(a => a.status === 'confirmed').length;
        const atRiskCount = tabFilteredAppts.filter(a => (a.riskLevel || '').toUpperCase() === 'HIGH').length;
        const utilization = Math.min(100, Math.round((tabFilteredAppts.filter(a => ['confirmed', 'completed', 'walk-in'].includes(a.status)).length / 12) * 100));

        const cancelledAppt = tabFilteredAppts.find(a => a.status === 'cancelled');

        if (activeVideoCallAppt) {
          return (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: '1.5rem', background: '#f8fafc', borderRadius: '16px', padding: '1.5rem', border: '1px solid #cbd5e1' }}>
              {/* LEFT: EHR/EMR Panel */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#1b504c', textTransform: 'uppercase' }}>Active Consultation</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                      {((patientsMap[activeVideoCallAppt.patientId] || {}).name) || activeVideoCallAppt.patientName || 'Patient'}
                    </h3>
                  </div>
                  <button
                    onClick={handleEndVideoCall}
                    style={{
                      background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}
                  >
                    End Call & Write Rx
                  </button>
                </div>
                
                {/* Vitals */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#1b504c', marginBottom: '0.5rem' }}>Today's Vitals</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>Blood Pressure: <strong>{activeVideoCallAppt.bp || '120/80 mmHg'}</strong></div>
                    <div>Heart Rate: <strong>{activeVideoCallAppt.heartRate || '72 bpm'}</strong></div>
                  </div>
                </div>

                {/* Medical History */}
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1b504c', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem', marginBottom: '0.75rem' }}>
                    Clinical History
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {getPatientMedicalHistory(
                      activeVideoCallAppt.patientId,
                      ((patientsMap[activeVideoCallAppt.patientId] || {}).name) || activeVideoCallAppt.patientName
                    ).map((record, idx) => (
                      <div key={idx} style={{ borderLeft: '2px solid #1b504c', paddingLeft: '0.75rem', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#1b504c' }}>{record.date} - {record.type}</div>
                        <p style={{ margin: '0.2rem 0', color: '#475569' }}>{record.notes}</p>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Rx: {record.prescription?.map(m => m.med).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Video frame */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <iframe
                  src={activeVideoCallAppt.videoRoomUrl || `https://aayu-test.daily.co/aayu-consult-${activeVideoCallAppt.id}`}
                  allow="camera; microphone; display-capture; autoplay"
                  style={{
                    width: '100%',
                    height: 'calc(100vh - 280px)',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    background: '#0f172a'
                  }}
                  title="Daily.co Video consultation room"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Secure P2P Encrypted Session Active
                  </span>
                  <button
                    onClick={() => setActiveVideoCallAppt(null)}
                    style={{
                      background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}
                  >
                    Minimize video window
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '2rem' }}>
            
            {/* ─── LEFT COLUMN: Stats & Active Queue ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Doctor Details & Profile Card */}
              <div style={{ 
                background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', 
                border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)', 
                display: 'flex', alignItems: 'center', gap: '1.25rem' 
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: '#e5f9f8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1b504c', fontSize: '1.2rem', fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif', border: '1px solid #97c9c4',
                }}>
                  {initials}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
                      {currentDoctor.name}
                    </h2>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#16a34a', background: '#e8faee', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                      Active Today
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {currentDoctor.department} Specialist · Aayu Jubilee Hills
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
                background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', color: '#1a1a2e',
                border: '1px solid #e2e8f0', borderLeft: '4px solid #1b504c',
                boxShadow: '0 4px 20px rgba(0,0,0,0.015)',
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Today's Session Metrics
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#1b504c', fontWeight: 700 }}>
                    {todayDisplayLong()}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalCount}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Total Patients</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem', textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#16a34a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{confirmedCount}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Confirmed</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem', textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#d97706', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{atRiskCount}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>At Risk</div>
                  </div>
                </div>

                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{ width: `${utilization}%`, height: '100%', background: '#16a34a', borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                  <span>Session Slot Utilization</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1b504c', fontWeight: 700 }}>{utilization}% slots filled</span>
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
                  {tabFilteredAppts.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2.5rem 1.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📭</div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        No appointments scheduled for this filter.
                      </p>
                    </div>
                  ) : (
                    tabFilteredAppts.slice(0, 15).map((appt, i) => {
                      const pat = patientsMap[appt.patientId] || {};
                      const isCancelled = appt.status === 'cancelled' || appt.status === 'rescheduled';
                      
                      if (isCancelled) {
                        return (
                          <div key={appt.id} style={{ background: '#fafbfc', borderRadius: '12px', padding: '1.25rem', border: '2px dashed #cbd5e1', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#b45309', background: '#fff3d6', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                SLOT OPEN · {selectedDateFilter !== 'today' ? `${appt.appointmentDate} ` : ''}{appt.appointmentTime}
                              </span>
                            </div>
                            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', fontWeight: 600, color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                              — Slot Available —
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem', margin: 0 }}>
                              Rescheduled: {(pat.name && pat.name !== 'User' ? pat.name : null) || (appt.patientName && appt.patientName !== 'User' ? appt.patientName : null) || 'Patient'}
                            </p>
                            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontSize: '0.78rem', fontWeight: 500 }}>
                              <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                              <span>Finding replacement from waitlist{loadingDots}</span>
                            </div>
                          </div>
                        );
                      }

                      // Normal active card
                      const labelText = i === 0 && selectedDateFilter === 'today' ? 'ACTIVE NOW' : 'UPCOMING';
                      const labelColor = i === 0 && selectedDateFilter === 'today' ? '#16a34a' : '#1b504c';
                      const labelBg = i === 0 && selectedDateFilter === 'today' ? '#e8faee' : '#e5f9f8';
                      const labelBorder = i === 0 && selectedDateFilter === 'today' ? '1px solid #bbf7d0' : '1px solid #97c9c4';
                      
                      const riskVal = appt.riskScore || 15;
                      const riskLvl = appt.riskLevel || 'LOW';
                      const riskColor = riskLvl.toUpperCase() === 'HIGH' ? '#ef4444' : riskLvl.toUpperCase() === 'MEDIUM' ? '#d97706' : '#16a34a';
                      const riskBg = riskLvl.toUpperCase() === 'HIGH' ? '#fee2e2' : riskLvl.toUpperCase() === 'MEDIUM' ? '#fff3d6' : '#e8faee';
                      const riskBorder = riskLvl.toUpperCase() === 'HIGH' ? '1px solid #fecaca' : riskLvl.toUpperCase() === 'MEDIUM' ? '1px solid #fde68a' : '1px solid #bbf7d0';

                      return (
                        <div 
                          key={appt.id} 
                          onClick={() => setSelectedPatientForHistory({ 
                            id: appt.patientId, 
                            name: (pat.name && pat.name !== 'User' ? pat.name : null) || (appt.patientName && appt.patientName !== 'User' ? appt.patientName : null) || 'Patient', 
                            appointmentId: appt.id, 
                            doctorId: appt.doctorId, 
                            doctorName: appt.doctorName, 
                            department: appt.department, 
                            hospital: appt.hospital || 'Aayu Clinic', 
                            vitals: { bp: appt.bp || '120/80 mmHg', hr: appt.heartRate || '72 bpm' }, 
                            ...pat 
                          })}
                          style={{ 
                            background: 'white', borderRadius: '12px', padding: '1.25rem', 
                            border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)', 
                            borderLeft: `4px solid ${i === 0 && selectedDateFilter === 'today' ? '#16a34a' : '#1b504c'}`,
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
                              {labelText} · {selectedDateFilter !== 'today' ? `${appt.appointmentDate} ` : ''}{appt.appointmentTime}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: riskColor, background: riskBg, padding: '0.2rem 0.5rem', borderRadius: '4px', border: riskBorder, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: riskColor }} />
                              {riskLvl.toUpperCase()} RISK ({riskVal}%)
                            </span>
                          </div>
                          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
                            {(pat.name && pat.name !== 'User' ? pat.name : null) || (appt.patientName && appt.patientName !== 'User' ? appt.patientName : null) || (appt.patientId ? `Patient ${String(appt.patientId).slice(-4)}` : 'Unknown Patient')}
                          </h3>
                          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
                            {appt.department || currentDoctor.department} Consultation · {appt.notes || 'Routine checkup'}
                          </p>
                          <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#374151', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                              {pat.persona === 'elderly' ? '👴 Elderly' : pat.persona === 'student' ? '🎓 Student' : '💼 Working Pro'}
                            </span>
                            
                            {activeTab === 'virtual_opd' ? (
                              appt.callStatus === 'completed' ? (
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px' }}>
                                  ✓ Call Completed
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartVideoCall(appt);
                                  }}
                                  style={{
                                    fontSize: '0.72rem', fontWeight: 700,
                                    background: appt.callStatus === 'in_progress' ? '#0284c7' : '#16a34a',
                                    color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                                  }}
                                >
                                  <Video size={12} />
                                  <span>{appt.callStatus === 'in_progress' ? 'Resume Call' : 'Start Video Call'}</span>
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 500 }}>
                                <Check size={12} strokeWidth={2.5} /> WhatsApp confirmed
                              </span>
                            )}
                            
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
                    {selectedDateFilter === 'today' ? "Today's Schedule" : selectedDateFilter === 'tomorrow' ? "Tomorrow's Schedule" : "Upcoming Schedule"}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Complete clinical timeline (click row to view records)</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tabFilteredAppts.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
                      No appointments scheduled.
                    </div>
                  ) : (
                    tabFilteredAppts.map((slot, idx) => {
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
                              setSelectedPatientForHistory({ 
                                id: slot.patientId, 
                                name: (pat.name && pat.name !== 'User' ? pat.name : null) || (slot.patientName && slot.patientName !== 'User' ? slot.patientName : null) || 'Patient', 
                                appointmentId: slot.id, 
                                doctorId: slot.doctorId, 
                                doctorName: slot.doctorName, 
                                department: slot.department, 
                                hospital: slot.hospital || 'Aayu Clinic', 
                                vitals: { bp: slot.bp || '120/80 mmHg', hr: slot.heartRate || '72 bpm' }, 
                                ...pat 
                              });
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
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.82rem', fontWeight: 700, color: '#475569', width: '120px', flexShrink: 0, fontVariantNumeric: 'tabular-nums', display: 'flex', flexDirection: 'column' }}>
                            {selectedDateFilter !== 'today' && <span style={{ fontSize: '0.62rem', fontWeight: 500, color: '#94a3b8' }}>{slot.appointmentDate}</span>}
                            <span>{slot.appointmentTime}</span>
                          </span>

                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isCancelled ? '#94a3b8' : '#1a1a2e', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                            {isCancelled ? '— Slot Available —' : ((pat.name && pat.name !== 'User' ? pat.name : null) || (slot.patientName && slot.patientName !== 'User' ? slot.patientName : null) || (slot.patientId ? `Patient ${String(slot.patientId).slice(-4)}` : 'Unknown Patient'))}
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

              {/* ✨ AAYU ONE CLINICAL COPILOT & CLINICAL SCRATCHPAD */}
              {/* AI Copilot Widget */}
              <div style={{
                background: 'white', borderRadius: '12px', padding: '1.5rem', 
                border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)', 
                display: 'flex', flexDirection: 'column', gap: '0.875rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <Sparkles size={16} color="#1b504c" />
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 600, color: '#1b504c', margin: 0 }}>
                    Aayu AI Copilot
                  </h3>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#e8faee', color: '#16a34a', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #bbf7d0', marginLeft: 'auto' }}>
                    ACTIVE
                  </span>
                </div>
                
                {(() => {
                  // Find first active patient in the list as default
                  const activeAppt = tabFilteredAppts.find(a => a.status === 'confirmed' || a.status === 'checked-in') || tabFilteredAppts[0];
                  if (!activeAppt) {
                    return (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
                        Waiting for active patient session...
                      </div>
                    );
                  }
                  
                  const pat = patientsMap[activeAppt.patientId] || {};
                  const patName = (pat.name && pat.name !== 'User' ? pat.name : null) || (activeAppt.patientName && activeAppt.patientName !== 'User' ? activeAppt.patientName : null) || 'Patient';
                  const riskLevel = activeAppt.riskLevel || 'LOW';
                  const riskScore = activeAppt.riskScore || 15;
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Analyzing Patient:</span>
                        <strong style={{ fontSize: '0.8rem', color: '#1a1a2e' }}>{patName}</strong>
                      </div>
                      
                      {/* Insights List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <AlertTriangle size={15} color="#d97706" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                          <div>
                            <strong>No-Show Warning:</strong> {riskLevel} Risk ({riskScore}% probability). {riskLevel === 'HIGH' ? "Automated outbound voice call confirmed transit, but historical records show high cancellation rate." : "Low risk of cancellation. Pre-reminder confirmations received."}
                          </div>
                        </div>
                        
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <Heart size={15} color="#ef4444" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                          <div>
                            <strong>Vitals Check:</strong> Vitals are BP {activeAppt.bp || '120/80 mmHg'} and HR {activeAppt.heartRate || '72 bpm'}. {parseInt(activeAppt.bp?.split('/')[0]) > 135 ? "BP is borderline hypertensive. Suggest checking historical ECG and lipid levels." : "Vitals are stable."}
                          </div>
                        </div>
                        
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <CheckCircle size={15} color="#16a34a" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                          <div>
                            <strong>Clinical Protocol:</strong> Routine checkup. Recommend verifying prescription adherence for Metoprolol XR.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Clinical Scratchpad Widget */}
              <div style={{
                background: 'white', borderRadius: '12px', padding: '1.5rem',
                border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.015)',
                display: 'flex', flexDirection: 'column', gap: '0.875rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <FileText size={16} color="#1b504c" />
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 600, color: '#1b504c', margin: 0 }}>
                    Clinical Clipboard
                  </h3>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginLeft: 'auto' }}>Scratchpad</span>
                </div>
                
                <textarea
                  placeholder="Type session observation drafts, symptoms, or dosage details here..."
                  value={scratchpadText}
                  onChange={e => setScratchpadText(e.target.value)}
                  style={{
                    width: '100%', height: '80px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    padding: '0.6rem 0.75rem', fontSize: '0.8rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    resize: 'none', outline: 'none', color: '#1a1a2e', background: 'white'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (!scratchpadText.trim()) return toast.error("Scratchpad is empty!");
                      navigator.clipboard.writeText(scratchpadText);
                      toast.success("Copied to clipboard!");
                    }}
                    style={{
                      flex: 1, height: 32, fontSize: '0.75rem', fontWeight: 700,
                      color: 'white', background: '#1b504c', border: 'none',
                      borderRadius: '6px', cursor: 'pointer', transition: 'all 120ms'
                    }}
                  >
                    Copy Note
                  </button>
                  <button
                    onClick={() => setScratchpadText('')}
                    style={{
                      width: '60px', height: 32, fontSize: '0.75rem', fontWeight: 700,
                      color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5',
                      borderRadius: '6px', cursor: 'pointer', transition: 'all 120ms'
                    }}
                  >
                    Clear
                  </button>
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
            
            {/* Slide-out Drawer — Premium Redesign */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '100%', maxWidth: '500px',
                background: '#ffffff', zIndex: 1000,
                boxShadow: '-20px 0 60px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column',
                borderLeft: '1px solid #e2e8f0',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {/* ── HERO HEADER ── */}
              <div style={{
                background: 'linear-gradient(135deg, #0f2924 0%, #1b504c 60%, #1e6b5e 100%)',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {/* Decorative circle */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -20, left: -10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(134,239,172,0.15)', border: '1px solid rgba(134,239,172,0.3)', borderRadius: '8px', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FileText size={13} color="#86efac" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#86efac', letterSpacing: '0.08em', textTransform: 'uppercase' }}>EMR Clinical File</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatientForHistory(null)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Patient Identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'linear-gradient(135deg, #86efac, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(52,211,153,0.3)' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#064e3b' }}>
                      {(selectedPatientForHistory.name || 'P')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                      {selectedPatientForHistory.name}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', margin: '0.2rem 0 0 0' }}>
                      {selectedPatientForHistory.age} yrs · {selectedPatientForHistory.gender || 'N/A'} · {selectedPatientForHistory.phone || 'No phone'}
                    </p>
                  </div>
                </div>

                {/* Stats strip */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.1rem' }}>
                  {[
                    { label: 'Trust Score', value: `${selectedPatientForHistory.trustScore || 85}%`, bg: 'rgba(134,239,172,0.15)', border: 'rgba(134,239,172,0.3)', color: '#86efac' },
                    { label: 'Visits', value: selectedPatientForHistory.pastVisits || 0, bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' },
                    { label: 'No-Shows', value: selectedPatientForHistory.pastNoShows || 0, bg: selectedPatientForHistory.pastNoShows > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)', border: selectedPatientForHistory.pastNoShows > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', color: selectedPatientForHistory.pastNoShows > 0 ? '#fca5a5' : 'rgba(255,255,255,0.75)' },
                    { label: 'Distance', value: `${selectedPatientForHistory.distance || 10} km`, bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SCROLLABLE BODY ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* ABDM Clinical Intake */}
                {selectedPatientForHistory.medicalHistory && (() => {
                  const parseList = (val) => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    return val.split(',').map(s => s.trim()).filter(Boolean);
                  };
                  const mh = selectedPatientForHistory.medicalHistory;
                  const conditions = parseList(mh.chronicConditions);
                  const meds      = parseList(mh.currentMedications);
                  const allergies = parseList(mh.allergies);
                  const symptoms  = parseList(mh.currentSymptoms);
                  const lifestyle = parseList(mh.lifestyle);
                  const family    = parseList(mh.familyHistory);
                  const blood     = mh.bloodGroup || selectedPatientForHistory.bloodGroup || '';

                  const Chip = ({ label, bg, color, border }) => (
                    <span style={{ fontSize: '0.68rem', background: bg, color, padding: '0.2rem 0.55rem', borderRadius: '20px', border: `1px solid ${border}`, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
                  );

                  const Section = ({ icon, title, chips, emptyLabel, chipStyle }) => (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.45rem 0' }}>{title}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {chips.length > 0
                            ? chips.map((c, i) => <Chip key={i} label={c} {...chipStyle} />)
                            : <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>{emptyLabel}</span>
                          }
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <div>
                      {/* Section header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Sparkles size={14} color="#0f766e" />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>ABDM Clinical Intake</span>
                        </div>
                        <span style={{ fontSize: '0.6rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '99px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ✓ Verified
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Blood Group — prominent */}
                        {blood && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '0.7rem 1rem' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Droplets size={15} color="#dc2626" />
                            </div>
                            <div>
                              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Blood Group</p>
                              <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#dc2626', margin: 0, lineHeight: 1.1 }}>{blood}</p>
                            </div>
                            <div style={{ marginLeft: 'auto', background: '#fecdd3', color: '#9f1239', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>CRITICAL</div>
                          </div>
                        )}

                        <Section icon={<Activity size={14} color="#7c3aed" />} title="Chronic Conditions"
                          chips={conditions} emptyLabel="None reported"
                          chipStyle={{ bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' }} />

                        <Section icon={<Pill size={14} color="#2563eb" />} title="Current Medications"
                          chips={meds} emptyLabel="None reported"
                          chipStyle={{ bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }} />

                        <Section icon={<AlertTriangle size={14} color="#dc2626" />} title="Allergies"
                          chips={allergies} emptyLabel="No known allergies"
                          chipStyle={{ bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }} />

                        <Section icon={<Activity size={14} color="#d97706" />} title="Active Symptoms"
                          chips={symptoms} emptyLabel="None reported"
                          chipStyle={{ bg: '#fffbeb', color: '#92400e', border: '#fde68a' }} />

                        <Section icon={<Wind size={14} color="#059669" />} title="Lifestyle Factors"
                          chips={lifestyle} emptyLabel="Not specified"
                          chipStyle={{ bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }} />
                        <Section icon={<User size={14} color="#64748b" />} title="Family History"
                          chips={family} emptyLabel="None reported"
                          chipStyle={{ bg: '#f8fafc', color: '#475569', border: '#cbd5e1' }} />

                        {/* Report attachment */}
                        {mh.medicalReport && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                            <FileText size={15} color="#15803d" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Attached Report</p>
                              <p style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mh.medicalReport.name}</p>
                            </div>
                            {mh.medicalReport.url && (
                              <a href={mh.medicalReport.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700, textDecoration: 'none', background: '#bbf7d0', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                                View ↗
                              </a>
                            )}
                          </div>
                        )}

                        {/* Scanned Medicine Strips (AI Prescription) */}
                        {mh.medicine_photo_names && mh.medicine_photo_names.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.6rem', padding: '0.7rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', alignItems: 'flex-start' }}>
                            <Sparkles size={15} color="#047857" style={{ marginTop: '0.1rem' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.35rem 0' }}>AI Scanned Medicine Strips</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {mh.medicine_photo_names.map((name, i) => (
                                  <span key={i} style={{ fontSize: '0.68rem', background: 'white', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                                    💊 {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}                      </div>
                    </div>
                  );
                })()}

                {/* Visit History & Prescriptions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Clock size={14} color="#475569" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Visit History & Prescriptions</span>
                    </div>
                    {selectedPatientForHistory.appointmentId && (
                      <button
                        onClick={() => { setRxPatient(selectedPatientForHistory); setIsRxModalOpen(true); }}
                        style={{
                          background: 'linear-gradient(135deg, #1b504c 0%, #153f3c 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 6px rgba(27,80,76,0.15)',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                      >
                        <Plus size={11} color="#86efac" /> Add Prescription
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[...patientRealHistory, ...getPatientMedicalHistory(selectedPatientForHistory.id, selectedPatientForHistory.name)].map((record, rIdx) => (
                      <div key={rIdx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        {/* Record header */}
                        <div style={{ background: '#f8fafc', padding: '0.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1b504c' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1b504c' }}>{record.date}</span>
                          </div>
                          <span style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>{record.type}</span>
                        </div>

                        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {/* Consultant */}
                          <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                            <span style={{ color: '#94a3b8' }}>Consultant:</span> <strong style={{ color: '#1e293b' }}>{record.doctor}</strong>
                            <span style={{ color: '#94a3b8' }}> · {record.dept}</span>
                          </p>

                          {/* Vitals */}
                          {record.vitals && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                              {[
                                { label: 'BP', value: record.vitals.bp },
                                { label: 'HR', value: record.vitals.hr },
                                { label: 'Temp', value: record.vitals.temp },
                                { label: 'SpO₂', value: record.vitals.spo2 },
                              ].map(v => (
                                <div key={v.label} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>{v.value}</div>
                                  <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.label}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Clinical Notes */}
                          <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderLeft: '3px solid #1b504c', borderRadius: '0 8px 8px 0', padding: '0.6rem 0.75rem' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1b504c', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.25rem 0' }}>Clinical Assessment</p>
                            <p style={{ fontSize: '0.78rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>{record.notes}</p>
                          </div>

                          {/* Prescriptions */}
                          <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Pill size={11} color="#2563eb" /> Prescribed Medications
                            </p>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Medicine</th>
                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dosage</th>
                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.prescription.map((med, mIdx) => (
                                    <tr key={mIdx} style={{ borderTop: '1px solid #f1f5f9', background: mIdx % 2 === 0 ? 'white' : '#fafbfc' }}>
                                      <td style={{ padding: '0.45rem 0.6rem', color: '#1e293b', fontWeight: 600 }}>{med.med}</td>
                                      <td style={{ padding: '0.45rem 0.6rem', color: '#475569' }}>{med.dosage}</td>
                                      <td style={{ padding: '0.45rem 0.6rem', color: '#64748b' }}>{med.duration}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Lab Reports */}
                          {record.reports && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <Heart size={13} color="#15803d" style={{ marginTop: 2, flexShrink: 0 }} />
                              <div>
                                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.15rem 0' }}>Diagnostics & Reports</p>
                                <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>{record.reports}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── STICKY FOOTER ── */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.6rem', background: '#fafbfc', flexShrink: 0 }}>
                <button
                  onClick={() => setSelectedPatientForHistory(null)}
                  style={{ height: 40, padding: '0 1rem', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                >
                  <X size={14} /> Close
                </button>
                {selectedPatientForHistory.appointmentId && (
                  <button
                    onClick={() => { setRxPatient(selectedPatientForHistory); setIsRxModalOpen(true); }}
                    style={{ flex: 1, height: 40, background: 'linear-gradient(135deg, #0f2924 0%, #1b504c 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', boxShadow: '0 4px 14px rgba(27,80,76,0.25)', transition: 'all 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(27,80,76,0.35)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(27,80,76,0.25)'}
                  >
                    <Sparkles size={15} color="#86efac" /> Write AI Prescription (Rx)
                  </button>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DoctorRxGeneratorModal
        isOpen={isRxModalOpen}
        onClose={() => {
          setIsRxModalOpen(false);
          setSelectedPatientForHistory(null);
        }}
        patient={rxPatient}
      />

      <Toaster position="top-right" />
    </div>
  );
}
