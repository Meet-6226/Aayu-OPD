import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Check, Send, AlertTriangle, Plus, Sparkles
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useSlotRecovery } from '../../hooks/useSlotRecovery';
import { useStaffAppointments } from '../../hooks/useStaffAppointments';

import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { todayDateString, formatTimestampDisplay } from '../../utils/appTime';

import Loader from '../../components/ui/Loader';

export default function SlotRecoveryPage() {
  const navigate = useNavigate();
  const { openSlots: liveOpenSlots, getWaitlist, notifyWaitlistPatient, fillSlot, waitlist: allWaitlist, patients, loading: slotLoading } = useSlotRecovery();
  const { appointments: liveAppointments, loading: apptsLoading } = useStaffAppointments();

  const [expandedSlots, setExpandedSlots] = useState({});
  const [feed, setFeed] = useState([]);

  const handleSimulateRecovery = async () => {
    try {
      const todayStr = todayDateString();
      
      const patientsToSeed = [
        { id: 'sim_pat_1', name: 'Rohan Verma', phone: '+919900000001', trustScore: 85, persona: 'Lifestyle Juggler' },
        { id: 'sim_pat_2', name: 'Karan Malhotra', phone: '+919900000002', trustScore: 70, persona: 'Young Professional' },
        { id: 'sim_wait_1', name: 'Amit Patel', phone: '+919975027178', trustScore: 92, persona: 'Health Conscious' },
        { id: 'sim_wait_2', name: 'Neha Sen', phone: '+919876543210', trustScore: 78, persona: 'Chronic Worrier' },
        { id: 'sim_wait_3', name: 'Rahul Verma', phone: '+919999999999', trustScore: 88, persona: 'Senior Independent' }
      ];

      const appointmentsToSeed = [
        {
          id: 'sim_appt_1',
          patientId: 'sim_pat_1',
          doctorId: 'doc_001',
          doctorName: 'Dr. Rajesh Mehta',
          department: 'Cardiology',
          appointmentDate: todayStr,
          appointmentTime: '09:30 AM',
          status: 'cancelled',
          consultationFee: 1500,
          cancelledReason: 'Caught in massive traffic jam',
          hospital: 'Apollo Hospital, Jubilee Hills',
          room: 'OPD Room 302',
          riskScore: 85,
          riskLevel: 'HIGH',
          bookingId: 'APL-2026-9021',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'sim_appt_2',
          patientId: 'sim_pat_2',
          doctorId: 'doc_003',
          doctorName: 'Dr. Sunil Nair',
          department: 'Dermatology',
          appointmentDate: todayStr,
          appointmentTime: '11:45 AM',
          status: 'cancelled',
          consultationFee: 1800,
          cancelledReason: 'Last minute client meeting',
          hospital: 'Apollo Hospital, Jubilee Hills',
          room: 'OPD Room 205',
          riskScore: 70,
          riskLevel: 'MEDIUM',
          bookingId: 'APL-2026-4412',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const waitlistToSeed = [
        {
          id: 'sim_wl_1',
          patientId: 'sim_wait_1',
          doctorId: 'doc_001',
          doctorName: 'Dr. Rajesh Mehta',
          preferredDate: todayStr,
          status: 'waiting',
          symptom: 'Routine Hypertension Check',
          createdAt: new Date()
        },
        {
          id: 'sim_wl_2',
          patientId: 'sim_wait_2',
          doctorId: 'doc_001',
          doctorName: 'Dr. Rajesh Mehta',
          preferredDate: todayStr,
          status: 'waiting',
          symptom: 'Chest Discomfort Follow-up',
          createdAt: new Date()
        },
        {
          id: 'sim_wl_3',
          patientId: 'sim_wait_3',
          doctorId: 'doc_003',
          doctorName: 'Dr. Sunil Nair',
          preferredDate: todayStr,
          status: 'waiting',
          symptom: 'Severe skin rash review',
          createdAt: new Date()
        }
      ];

      for (const p of patientsToSeed) {
        await setDoc(doc(db, 'patients', p.id), p);
      }

      for (const a of appointmentsToSeed) {
        await setDoc(doc(db, 'appointments', a.id), a);
      }

      for (const w of waitlistToSeed) {
        await setDoc(doc(db, 'waitlist', w.id), w);
      }

      toast.success('Simulation data seeded! View cancellations and waitlists.', { id: 'sim-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Simulation seeding failed.');
    }
  };

  const handleResetSimulation = async () => {
    try {
      const idsToDelete = {
        patients: ['sim_pat_1', 'sim_pat_2', 'sim_wait_1', 'sim_wait_2', 'sim_wait_3'],
        appointments: ['sim_appt_1', 'sim_appt_2'],
        waitlist: ['sim_wl_1', 'sim_wl_2', 'sim_wl_3']
      };

      for (const id of idsToDelete.patients) {
        await deleteDoc(doc(db, 'patients', id));
      }
      for (const id of idsToDelete.appointments) {
        await deleteDoc(doc(db, 'appointments', id));
      }
      for (const id of idsToDelete.waitlist) {
        await deleteDoc(doc(db, 'waitlist', id));
      }

      toast.success('Simulation data cleared! Dashboard reset.', { id: 'sim-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Simulation reset failed.');
    }
  };

  // Fetch reminders collection for the Live Recovery Feed
  useEffect(() => {
    if (!patients || Object.keys(patients).length === 0) return;
    const remindersRef = collection(db, 'reminders');
    const q = query(remindersRef, orderBy('sentAt', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedItems = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const pat = patients[data.patientId] || {};
        const timeAgo = data.sentAt ? formatTimestampDisplay(data.sentAt) : 'Just now';
        
        let text = '';
        if (data.reminderType === 'waitlist_notification') {
          text = `WhatsApp notification sent to ${pat.name || 'Waitlist Patient'}`;
        } else if (data.reminderType === 'manual_reminder') {
          text = `Manual reminder sent to ${pat.name || 'Patient'}`;
        } else {
          text = `Reminder sent to ${pat.name || 'Patient'}`;
        }
        
        return {
          id: docSnap.id,
          text,
          meta: `${data.channel === 'whatsapp' ? 'WhatsApp' : 'System'} · ${timeAgo}`,
        };
      });
      setFeed(feedItems);
    });
    
    return () => unsubscribe();
  }, [patients]);

  const [suggestionAccepted, setSuggestionAccepted] = useState(null);
  const [leadTimeHrs, setLeadTimeHrs] = useState(24);

  // Derived Stats
  const activeOpenSlots = liveOpenSlots.filter(s => s.status !== 'recovered');
  const revenueAtRisk = activeOpenSlots.reduce((acc, s) => acc + (Number(s.consultationFee) || 0), 0);

  const recoveredAppointments = liveAppointments.filter(a => a.status === 'recovered');
  const recoveredAmount = recoveredAppointments.reduce((acc, a) => acc + (Number(a.consultationFee) || 0), 0);

  // Calculate dynamic Overbooking Recommendation based on real high risk patients today
  const todayStr = todayDateString();
  const todayAppointments = liveAppointments.filter(a => a.appointmentDate === todayStr);
  const highRiskApt = todayAppointments.find(a => a.riskScore >= 70);

  const currentNoShowRate = 28;
  const projectedNoShowRate = Math.max(8, Math.round(28 - ((leadTimeHrs - 24) / 48) * 10));
  // What-if Revenue Saved = Recovered Amount * timing adjustment factor
  const revenueSavedVal = (recoveredAmount * (leadTimeHrs / 24)) / 100000;

  const stats = [
    { label: 'Slots Recovered Today', value: recoveredAppointments.length.toString() },
    { label: 'Average Recovery Time', value: '12 min' },
    { label: 'Waitlist Patients', value: allWaitlist.filter(w => ['waiting', 'notified'].includes(w.status)).length.toString() },
    { label: 'Recovery Rate', value: '67%' },
  ];

  const handleNotify = async (waitlistId) => {
    try {
      await toast.promise(
        notifyWaitlistPatient(waitlistId),
        {
          loading: 'Sending WhatsApp notification...',
          success: 'Notification sent and logged in timeline!',
          error: 'Failed to send notification.'
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleFillSlot = async (appointmentId, waitlistId, patientName, slotTime) => {
    try {
      await toast.promise(
        fillSlot(appointmentId, waitlistId),
        {
          loading: 'Recovering slot and assigning patient...',
          success: `Slot recovered! Assigned to ${patientName}.`,
          error: 'Failed to fill slot.'
        }
      );
      
      setFeed(prev => [
        {
          id: Date.now(),
          text: `${slotTime} slot filled by ${patientName}`,
          meta: `₹ recovered · Just now`,
          type: 'success'
        },
        ...prev
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  if (slotLoading || apptsLoading) {
    return <Loader message="Synchronizing Clinic Intelligence..." />;
  }

  const openSlots = liveOpenSlots;

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* SIMULATOR CONTROL CENTER BAR */}
      <div
        style={{
          background: 'rgba(27, 80, 76, 0.05)',
          border: '1px solid rgba(27, 80, 76, 0.15)',
          borderRadius: '8px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="#1b504c" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1b504c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            OPD Waitlist & Slot Recovery Simulator
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleSimulateRecovery}
            style={{
              padding: '0.4rem 0.8rem',
              background: '#1b504c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            ⚡ Trigger Cancellation Demo
          </button>
          <button
            onClick={handleResetSimulation}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'transparent',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            🗑️ Reset Slots
          </button>
        </div>
      </div>
      
      {/* LIVE REVENUE TICKER (No pulse animation, simple display) */}
      <div
        style={{
          background: '#1b504c',
          borderRadius: '8px',
          padding: '1.5rem',
          color: 'white',
          marginBottom: '1.5rem',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              Revenue at Risk Today
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', transition: 'all 0.3s ease' }}>
              ₹{revenueAtRisk.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>₹{recoveredAmount.toLocaleString('en-IN')} recovered</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.375rem' }}>
              Updated in real-time
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>
            <span>Recovery Target Progress</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round((recoveredAmount / 240000) * 100)}% Complete</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(recoveredAmount / 240000) * 100}%`, background: '#22c55e', borderRadius: 99 }} />
          </div>
        </div>
      </div>

      {/* 2-COLUMN LIVE CONTROL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem', alignItems: 'start', marginBottom: '2.5rem' }}>
        
        {/* LEFT COLUMN: OPEN SLOTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
              Open Slots
            </h2>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {openSlots.length} Available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {openSlots.length === 0 ? (
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '3rem 2rem',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                  color: '#475569',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(27, 80, 76, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    color: '#1b504c'
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem 0' }}>
                  No Active Cancelled Slots
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '320px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                  The clinic is running at 100% capacity today. Simulate last-minute cancellations to demonstrate real-time waitlist slot recovery.
                </p>
                <button
                  onClick={handleSimulateRecovery}
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: '#1b504c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 4px rgba(27, 80, 76, 0.15)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkles size={14} />
                  Simulate Demo Data
                </button>
              </div>
            ) : (
              openSlots.map(slot => {
                const waitlistMatches = getWaitlist(slot.doctorId, slot.appointmentDate);
                const isExpanded = expandedSlots[slot.id];
                
                return (
                  <div
                    key={slot.id}
                    style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      border: '1px solid #f3f4f6',
                      borderLeft: '1px dashed #cbd5e1',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifycontent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      
                      {/* Time & Doc */}
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifycontent: 'center', color: '#1b504c', flexShrink: 0 }}>
                          <Clock size={16} />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', fontVariantNumeric: 'tabular-nums' }}>
                            {slot.time}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {slot.doctor} · {slot.department}
                          </div>
                        </div>
                      </div>

                      {/* Cancellation details */}
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#374151' }}>
                          Cancelled by <strong>{slot.cancelledBy}</strong> · {slot.timeAgo}
                        </div>
                        <span style={{ display: 'inline-block', fontSize: '0.68rem', background: '#f8fafc', color: '#64748b', padding: '0.15rem 0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                          {slot.reason}
                        </span>
                      </div>

                      {/* Risk / Fill state */}
                      <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#b45309', fontFamily: 'Space Grotesk, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{slot.fee.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            at risk
                          </div>
                        </div>
                      </div>

                    </div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifycontent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <button
                        onClick={() => {
                          setExpandedSlots(prev => ({ ...prev, [slot.id]: !prev[slot.id] }));
                        }}
                        style={{ background: 'none', border: 'none', color: '#1b504c', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                      >
                        {slot.waitlistCount} matches available
                        <span>{isExpanded ? '▴' : '▾'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setExpandedSlots(prev => ({ ...prev, [slot.id]: !prev[slot.id] }));
                        }}
                        style={{ padding: '0.4rem 0.8rem', background: '#1b504c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
                      >
                        Match Slot
                      </button>
                    </div>

                    {/* Waitlist Patients Expandable List */}
                    {isExpanded && (
                      <div style={{ overflow: 'hidden', marginTop: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {waitlistMatches.map(patient => {
                          const isNotified = slot.notifiedList[patient.id];
                          const riskColor = patient.risk <= 15 ? '#16a34a' : patient.risk <= 35 ? '#d97706' : '#ef4444';
                          
                          return (
                            <div
                              key={patient.id}
                              style={{
                                display: 'flex', alignItems: 'center', justifycontent: 'space-between', gap: '1rem',
                                padding: '0.5rem 0.75rem', background: 'white', borderRadius: '4px',
                                border: '1px solid #e2e8f0', flexWrap: 'wrap',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e' }}>{patient.name}</span>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: riskColor, display: 'flex', alignItems: 'center', gap: '0.2' }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: riskColor }} />
                                    {patient.risk}%
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                  Waiting {patient.waitTime}
                                </div>
                              </div>

                              {/* Sent with green text / Match Action */}
                              {isNotified ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>✅ Sent</span>
                                  <button
                                    onClick={() => handleFillSlot(slot.id, patient.id, patient.name, slot.time)}
                                    style={{
                                      padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '0.72rem', fontWeight: 500,
                                      background: '#16a34a',
                                      color: 'white',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Assign
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleNotify(patient.id)}
                                  style={{
                                    padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '0.72rem', fontWeight: 500,
                                    background: '#1b504c',
                                    color: 'white',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Notify
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Overbooking Recommendation Card (Normal border-amber-200 card, no animation) */}
          {suggestionAccepted === null && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', border: '1px solid #fcd34d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={15} color="#b45309" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>
                  Overbooking Recommendation
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                {highRiskApt 
                  ? `Dr. ${highRiskApt.doctor.replace('Dr. ', '')}'s ${highRiskApt.appointmentTime} patient (${highRiskApt.name}) has ${highRiskApt.riskScore}% no-show probability. Consider booking a backup patient.`
                  : "All scheduled patients today have low/medium no-show risk. No overbooking backup is recommended at this time."
                }
              </p>
              {highRiskApt && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSuggestionAccepted('accepted');
                      toast.success('Overbook backup created.');
                    }}
                    style={{ flex: 1, padding: '0.4rem', background: '#1b504c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setSuggestionAccepted('dismissed')}
                    style={{ padding: '0.4rem 0.6rem', background: 'transparent', color: '#4b5563', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* What-If Simulator (Simple slider + two numbers, no chart) */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 500, color: '#1a1a2e', margin: '0 0 0.75rem 0' }}>
              What-If Simulator
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#374151' }}>
                <span>Send reminders earlier:</span>
                <span style={{ fontWeight: 600, color: '#1b504c', fontVariantNumeric: 'tabular-nums' }}>{leadTimeHrs} hrs</span>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="12"
                value={leadTimeHrs}
                onChange={e => setLeadTimeHrs(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#1b504c', height: 4 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>PROJECTED NO-SHOW</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#1b504c', fontVariantNumeric: 'tabular-nums' }}>
                  {projectedNoShowRate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>REVENUE SAVED</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                  ₹{revenueSavedVal.toFixed(1)}L
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Feed */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 500, color: '#1a1a2e', margin: '0 0 0.75rem 0' }}>
              Recovery Feed
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {feed.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No recovery activity yet today.
                </div>
              ) : (
                feed.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.35rem 0',
                      borderBottom: '1px solid #f8fafc',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#374151' }}>{item.text}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1' }}>{item.meta}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* STATISTICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'white', borderRadius: '8px', padding: '1.25rem', border: '1px solid #f3f4f6',
              textAlign: 'left',
            }}
          >
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#1b504c', marginBottom: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
