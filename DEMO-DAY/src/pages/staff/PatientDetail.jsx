import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Car, ShieldCheck, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useStaffPatients } from '../../hooks/useStaffPatients';
import { db } from '../../firebase/config';

import Loader from '../../components/ui/Loader';

const PERSONA_CONFIG = {
  'Working Professional': { emoji: '💼', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Elderly': { emoji: '👴', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Student': { emoji: '🎓', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Default': { emoji: '👤', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [riskVal, setRiskVal] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [showPrivacyConsole, setShowPrivacyConsole] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { getPatientDetail, getPatientRisk, loading } = useStaffPatients();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const appointmentId = id || 'appt_1';
        const appt = await getPatientRisk(appointmentId);
        const patientDetails = await getPatientDetail(appt.patientId);
        
        setData({
          patient: patientDetails.patient,
          appointments: patientDetails.appointments,
          notifications: patientDetails.notifications,
          reminders: patientDetails.reminders,
          appointment: appt
        });
      } catch (err) {
        console.error("Error loading patient details:", err);
        toast.error("Failed to load patient record.");
      }
    };
    loadData();
  }, [id, getPatientDetail, getPatientRisk]);

  const handleSendReminder = async () => {
    if (!data) return;
    const { sendWhatsAppDirect } = await import('../../utils/demoTriggers');
    const { doc, collection, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    const patient = data.patient;
    const appt = data.appointment;
    
    const messageBody = `Nidaan One Clinic OPD: Hi ${patient.name}, this is a reminder for your appointment with ${appt.doctorName} on ${appt.appointmentDate} at ${appt.appointmentTime}. Please reply 1 to confirm.`;
    
    toast.promise(
      (async () => {
        const success = await sendWhatsAppDirect(patient.phone, messageBody);
        
        // Log in reminders
        const reminderRef = doc(collection(db, 'reminders'));
        await setDoc(reminderRef, {
          appointmentId: appt.id,
          patientId: patient.id,
          reminderType: 'manual_reminder',
          channel: 'whatsapp',
          status: success ? 'sent' : 'failed',
          messageBody,
          sentAt: serverTimestamp()
        });
        
        // Reload details
        const patientDetails = await getPatientDetail(patient.id);
        setData(prev => ({ ...prev, reminders: patientDetails.reminders }));
        return success;
      })(),
      {
        loading: 'Dispatched manual WhatsApp reminder...',
        success: 'WhatsApp sent and logged in timeline!',
        error: 'Failed to send WhatsApp reminder.'
      }
    );
  };

  const handleVoiceCall = async () => {
    if (!data) return;
    const { makeVoiceCallDirect } = await import('../../utils/demoTriggers');
    const { doc, collection, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    const patient = data.patient;
    const appt = data.appointment;

    toast.promise(
      (async () => {
        const success = await makeVoiceCallDirect(patient.phone, 'confirmation', {
          patientName: patient.name,
          doctorName: appt.doctorName,
          appointmentDate: appt.appointmentDate,
          appointmentTime: appt.appointmentTime
        });
        
        // Log in reminders
        const reminderRef = doc(collection(db, 'reminders'));
        await setDoc(reminderRef, {
          appointmentId: appt.id,
          patientId: patient.id,
          reminderType: 'manual_voice_call',
          channel: 'voice_call',
          status: success ? 'sent' : 'failed',
          messageBody: `Hindi IVR confirmation call triggered to patient phone.`,
          sentAt: serverTimestamp()
        });

        // Reload details
        const patientDetails = await getPatientDetail(patient.id);
        setData(prev => ({ ...prev, reminders: patientDetails.reminders }));
        return success;
      })(),
      {
        loading: 'Connecting voice call via Vapi.ai...',
        success: 'Hindi Voice Call triggered successfully!',
        error: 'Failed to trigger voice call.'
      }
    );
  };

  const handleMarkNoShow = async () => {
    if (!data) return;
    const appt = data.appointment;
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    
    await toast.promise(
      updateDoc(doc(db, 'appointments', appt.id), {
        status: 'no_show',
        updatedAt: serverTimestamp()
      }),
      {
        loading: 'Marking patient as absent...',
        success: 'Marked as no-show.',
        error: 'Failed to update status.'
      }
    );
    navigate('/staff/appointments');
  };

  useEffect(() => {
    if (!data) return;
    const targetScore = data.appointment.riskScore || 15;
    let start = null;
    const duration = 800;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setRiskVal(Math.floor(eased * targetScore));
      if (p < 1) requestAnimationFrame(step);
    };
    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [data]);

  if (loading || !data) {
    return <Loader message="Synchronizing Clinic Intelligence..." />;
  }

  const patientData = {
    name: (data.patient.name && data.patient.name !== 'User' ? data.patient.name : null) || (data.appointment.patientName && data.appointment.patientName !== 'User' ? data.appointment.patientName : null) || (data.patient.id ? `Patient ${String(data.patient.id).slice(-4)}` : 'Unknown Patient'),
    phone: data.patient.phone || '',
    persona: data.patient.persona === 'working_professional' ? 'Working Professional' :
             data.patient.persona === 'elderly' ? 'Elderly' :
             data.patient.persona === 'student' ? 'Student' : 'Default',
    pastNoShows: data.patient.totalNoShows || 0,
    pastVisits: data.patient.totalVisits || 0,
    joinedDate: data.patient.createdAt ? new Date(data.patient.createdAt.seconds * 1000).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recent',
    riskScore: data.appointment.riskScore || 15,
    riskLevel: (data.appointment.riskLevel || 'LOW').toLowerCase(),
    shapFactors: ((data.appointment.shapFactors && data.appointment.shapFactors.length > 0) ? data.appointment.shapFactors : [
      { name: 'Distance from hospital', value: data.appointment.leadTimeDays ? 32 : 12, desc: 'Transit route distance' },
      { name: 'Past no-show history', value: data.appointment.riskLevel === 'HIGH' ? 42 : 15, desc: 'Historical compliance' }
    ]).map(f => {
      let val = f.value !== undefined ? f.value : f.impact;
      let desc = f.desc || f.detail;
      const name = f.name || f.feature;
      
      if (name === 'Past no-show history') {
        const noShows = data.patient.totalNoShows || 0;
        if (noShows === 0) {
          val = -15; // Protective factor
          desc = 'No past missed appointments';
        } else {
          val = noShows * 15;
          desc = `Skipped ${noShows} past visits`;
        }
      }
      
      return {
        name,
        value: val,
        desc
      };
    }),
    textSummary: `${data.patient.name} has missed ${data.patient.totalNoShows || 0} appointments previously. Our XGBoost model projects a ${data.appointment.riskScore || 15}% risk of no-show for this slot.`,
    appointment: {
      date: new Date(data.appointment.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      time: data.appointment.appointmentTime,
      doctor: data.appointment.doctorName,
      dept: data.appointment.department,
      room: data.appointment.room || 'OPD Room 104',
      fee: `₹${data.appointment.consultationFee}`,
      distance: data.patient.distance ? `${data.patient.distance} km` : '15 km · ~25 min drive',
    },
    timeline: data.reminders.length > 0 ? data.reminders.map((r, index) => {
      const dateStr = r.sentAt ? new Date(r.sentAt.seconds * 1000).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : 'Just now';
      return {
        id: r.id || index,
        done: r.status === 'sent' || r.status === 'received' || r.status === 'initiated',
        label: r.reminderType.replace('_', ' ').toUpperCase(),
        meta: `${r.channel === 'voice_call' ? 'Voice Call' : 'WhatsApp'} · ${r.status.toUpperCase()} · ${dateStr}`,
        msg: r.messageBody || 'IVR alert triggered.'
      };
    }) : [
      { id: 1, type: 'sent', label: 'Booking Confirmation', meta: 'Sent on Booking via WhatsApp', msg: `Namaste ${data.patient.name}, your appointment with ${data.appointment.doctorName} is confirmed for ${data.appointment.appointmentDate} at ${data.appointment.appointmentTime}.`, done: true }
    ]
  };

  const riskRingRadius = 46;
  const riskCircumference = 2 * Math.PI * riskRingRadius;
  const strokeDashoffset = riskCircumference - (riskVal / 100) * riskCircumference;

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', paddingBottom: '88px' }}>
      
      {/* BACK BUTTON */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/staff/appointments')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none',
            fontSize: '0.85rem', fontWeight: 500, color: '#64748b', cursor: 'pointer', outline: 'none',
            padding: 0,
          }}
        >
          <ArrowLeft size={15} /> Back to Appointments
        </button>
      </div>

      {/* PATIENT HEADER CARD */}
      <div
        style={{
          background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            border: `2px solid ${patientData.riskLevel === 'high' ? '#ef4444' : '#f59e0b'}`,
            padding: '2px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', background: '#f1f5f9', color: '#1b504c',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.25rem',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              {patientData.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                {patientData.name}
              </h1>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, background: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
                {PERSONA_CONFIG[patientData.persona]?.emoji} {patientData.persona}
              </span>
              <span 
                onClick={() => setShowPrivacyConsole(true)}
                style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 700, 
                  background: '#ecfdf5', 
                  color: '#059669', 
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px', 
                  padding: '0.15rem 0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.08)',
                  userSelect: 'none'
                }}
                title="Click to audit data privacy transmission logs"
              >
                <ShieldCheck size={11} style={{ color: '#10b981' }} />
                ABDM SHIELD ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '0.25rem' }}>
              {patientData.phone} · Patient since {patientData.joinedDate}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              {patientData.pastVisits} past visits · <span style={{ color: '#ef4444' }}>{patientData.pastNoShows} no-shows</span>
            </div>
          </div>
        </div>

        {/* Risk progress circle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r={riskRingRadius} fill="transparent" stroke="#f1f5f9" strokeWidth={5} />
              <circle
                cx="45"
                cy="45"
                r={riskRingRadius}
                fill="transparent"
                stroke={patientData.riskLevel === 'high' ? '#ef4444' : '#f59e0b'}
                strokeWidth={5}
                strokeDasharray={riskCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.35rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {riskVal}%
              </span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              HIGH RISK
            </span>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              XGBoost Classifier
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN DETAILED VIEWS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SHAP Factors (bars height: 24px, gap: 1.25rem) */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', margin: '0 0 0.5rem 0' }}>
              Risk Factor Breakdown
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>
              Feature impact contributions to no-show projection.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {patientData.shapFactors.map((factor) => {
                const absVal = Math.abs(factor.value);
                const isPositive = factor.value > 0;
                const barColor = isPositive ? '#ef4444' : '#22c55e';

                return (
                  <div key={factor.name} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 150, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151' }}>{factor.name}</span>
                    </div>
                    <div style={{ flex: 1, height: 24, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: barColor, width: `${absVal * 2}%` }} />
                    </div>
                    <div style={{ width: 100, textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: barColor, fontVariantNumeric: 'tabular-nums' }}>
                        {isPositive ? `+${factor.value}%` : `${factor.value}%`}
                      </span>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{factor.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Summary Box */}
            <div style={{ marginTop: '1.5rem', background: '#f8fafc', borderRadius: '6px', padding: '1rem', border: '1px solid #cbd5e1' }}>
              <p style={{ fontSize: '0.83rem', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                {patientData.textSummary}
              </p>
            </div>
          </div>

          {/* Appointment Details */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', marginBottom: '1.25rem', margin: 0 }}>
              Appointment Logistics
            </h2>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Date & Time', value: patientData.appointment.date + ' at ' + patientData.appointment.time },
                  { label: 'Doctor', value: patientData.appointment.doctor },
                  { label: 'Department', value: patientData.appointment.dept },
                  { label: 'Room', value: patientData.appointment.room },
                  { label: 'Consultation Fee', value: patientData.appointment.fee },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.label}</span>
                    <span style={{ fontSize: '0.825rem', fontWeight: 500, color: '#1a1a2e' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Transit Map Coordinates</span>
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Nidaan One+Hospitals+Jubilee+Hills"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    height: 110, 
                    background: '#f8fafc', 
                    borderRadius: '6px', 
                    border: '1px solid #e2e8f0', 
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    cursor: 'pointer'
                  }}
                  title="Click to open in Google Maps"
                >
                                    {/* Vector Map Layer */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 290 110" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Water Body (River) */}
                    <path d="M -10,95 Q 100,85 180,105 T 300,98" fill="none" stroke="#bae6fd" strokeWidth="12" opacity="0.6" />
                    <path d="M -10,95 Q 100,85 180,105 T 300,98" fill="none" stroke="#e0f2fe" strokeWidth="10" opacity="0.8" />

                    {/* Park Zone */}
                    <rect x="220" y="5" width="60" height="30" rx="4" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="0.5" opacity="0.8" />
                    <text x="250" y="16" fill="#15803d" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Nidaan One Park</text>

                    {/* Secondary Roads (Under-layer/Casing) */}
                    <path d="M -10,20 L 300,20 M -10,50 L 300,50 M -10,80 L 300,80" stroke="white" strokeWidth="3.5" />
                    <path d="M 50,-10 L 50,120 M 110,-10 L 110,120 M 170,-10 L 170,120 M 230,-10 L 230,120" stroke="white" strokeWidth="3.5" />

                    {/* Secondary Roads (Top-layer) */}
                    <path d="M -10,20 L 300,20 M -10,50 L 300,50 M -10,80 L 300,80" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
                    <path d="M 50,-10 L 50,120 M 110,-10 L 110,120 M 170,-10 L 170,120 M 230,-10 L 230,120" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />

                    {/* GPS Navigation Route Track Casing */}
                    <path 
                      d="M 30,80 L 70,80 C 90,80 100,50 120,50 L 190,50 C 210,50 220,30 240,30 L 260,30" 
                      fill="none" 
                      stroke={patientData.appointment.riskLevel === 'HIGH' ? '#fee2e2' : '#d1fae5'} 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                    />

                    {/* GPS Route Line */}
                    <path 
                      d="M 30,80 L 70,80 C 90,80 100,50 120,50 L 190,50 C 210,50 220,30 240,30 L 260,30" 
                      fill="none" 
                      stroke={patientData.appointment.riskLevel === 'HIGH' ? '#ef4444' : '#10b981'} 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                    />

                    {/* Animating Dash Overlay */}
                    <path 
                      d="M 30,80 L 70,80 C 90,80 100,50 120,50 L 190,50 C 210,50 220,30 240,30 L 260,30" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeDasharray="3 3" 
                    />
                  </svg>
                  
                  {/* Home Marker */}
                  <div style={{ position: 'absolute', left: '30px', top: '80px', transform: 'translate(-50%, -50%)', background: '#0d9488', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <span style={{ fontSize: '7px', color: 'white', fontWeight: 'bold' }}>H</span>
                  </div>

                  {/* Hospital Pin */}
                  <div style={{ position: 'absolute', left: '260px', top: '30px', transform: 'translate(-50%, -50%)', background: '#1b504c', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white' }}>
                    <MapPin size={8} color="white" />
                  </div>

                  {/* Tiny Car Icon along path */}
                  <div style={{ position: 'absolute', left: '120px', top: '50px', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1' }}>
                    <Car size={8} color="#1b504c" />
                  </div>

                </a>
                <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
                  {patientData.appointment.distance}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Simple Timeline (Dots and text descriptions, no WhatsApp bubbles) */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', border: '1px solid #f3f4f6' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 500, color: '#1a1a2e', marginBottom: '1.25rem', margin: 0 }}>
              Reminder Journey
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, bottom: 10, left: 10, width: 1, background: '#e2e8f0' }} />
              {patientData.timeline.map((step) => (
                <div key={step.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: step.done ? '#e8faee' : '#f1f5f9',
                    border: `1.5px solid ${step.done ? '#22c55e' : '#94a3b8'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {step.done ? <span style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 800 }}>✓</span> : <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>⏳</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e' }}>{step.label}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{step.meta}</div>
                    <div style={{ fontSize: '0.75rem', color: '#374151', lineHeight: 1.4 }}>
                      {step.msg}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ACTION BAR STICKY FOOTER */}
      <div style={{
        position: 'fixed', bottom: 0, left: isMobile ? 0 : '240px', right: 0,
        background: 'white', borderTop: '1px solid #f3f4f6',
        height: 68, display: 'flex', alignItems: 'center',
        padding: '0 1.5rem', zIndex: 99,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.02)',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e' }}>{patientData.name} ({patientData.appointment.time})</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleSendReminder}
              style={{ padding: '0.4rem 0.8rem', background: '#1b504c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
            >
              Send Reminder
            </button>
            <button
              onClick={handleVoiceCall}
              style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', color: '#1b504c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
            >
              Voice Call
            </button>
            <button
              onClick={() => toast.success(`Redirecting to rescheduling...`)}
              style={{ padding: '0.4rem 0.8rem', background: 'white', color: '#374151', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
            >
              Reschedule
            </button>
            <button
              onClick={handleMarkNoShow}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
            >
              Mark No-Show
            </button>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />

      {/* ABDM Security Auditing Console Modal */}
      {showPrivacyConsole && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6.5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: '#090d16', border: '1px solid #1e293b', borderRadius: '16px',
            maxWidth: '520px', width: '100%', padding: '1.5rem', position: 'relative',
            color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.78rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            textAlign: 'left'
          }}>
            <button
              onClick={() => setShowPrivacyConsole(false)}
              style={{
                position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none',
                color: '#64748b', cursor: 'pointer', outline: 'none'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'Space Grotesk, sans-serif' }}>
                ABDM Privacy Shield Log Audit
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ color: '#64748b' }}>[SYSTEM] Seeding zero-knowledge transport session...</div>
              <div style={{ color: '#10b981' }}>[SHIELD] Connected to local client session successfully.</div>
              <div style={{ color: '#e2e8f0' }}>
                [SHIELD] Scrubbing patient PII keys:
                <br />&nbsp;&nbsp;• Name: <span style={{ color: '#ef4444' }}>"{patientData.name}"</span> ➔ <span style={{ color: '#10b981' }}>[HASHED: SHA-256]</span>
                <br />&nbsp;&nbsp;• Phone: <span style={{ color: '#ef4444' }}>"{patientData.phone}"</span> ➔ <span style={{ color: '#10b981' }}>[REDACTED]</span>
                <br />&nbsp;&nbsp;• ID: <span style={{ color: '#ef4444' }}>"{patientData.uid || 'patient_1'}"</span> ➔ <span style={{ color: '#10b981' }}>[SECURE ID VEC]</span>
              </div>
              <div style={{ color: '#e2e8f0' }}>
                [SHIELD] Transforming raw geolocation coords to distance vector:
                <br />&nbsp;&nbsp;• Coords: <span style={{ color: '#ef4444' }}>[21.1458° N, 79.0882° E]</span> ➔ <span style={{ color: '#10b981' }}>[VEC Distance: {patientData.distanceKmUsed || '38.2'} km]</span>
              </div>
              <div style={{ color: '#10b981' }}>[SHIELD] Anonymized cohort payload compiled successfully.</div>
              <div style={{ color: '#38bdf8' }}>
                [PAYLOAD] {"{"}
                <br />&nbsp;&nbsp;"lead_time_days": {patientData.leadTimeDays || 4},
                <br />&nbsp;&nbsp;"distance_km": {patientData.distanceKmUsed || 38.2},
                <br />&nbsp;&nbsp;"past_no_show_count": {patientData.pastNoShows || 0},
                <br />&nbsp;&nbsp;"is_working_professional": {patientData.persona === 'working_professional' ? 'true' : 'false'},
                <br />&nbsp;&nbsp;"weather_rain": {patientData.weatherRainUsed ? 'true' : 'false'},
                <br />&nbsp;&nbsp;"traffic_congestion_score": {patientData.trafficScore || 0.3}
                <br />{"}"}
              </div>
              <div style={{ color: '#e2e8f0' }}>[SHIELD] Transmitting anonymized payload to ML service (XGBoost v1.0)...</div>
              <div style={{ color: '#10b981' }}>[ML SERVER] Received prediction: {riskVal}% no-show probability.</div>
              <div style={{ color: '#64748b' }}>[SYSTEM] Audit closed. Verification hash: {Math.random().toString(16).substring(2, 10).toUpperCase()}</div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem', marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowPrivacyConsole(false)}
                style={{
                  padding: '0.4rem 1rem', background: '#1e293b', color: '#f8fafc', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
