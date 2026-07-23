import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getTodayDateString } from '../utils/dataFormat';

export function useStaffAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState({});
  const [doctors, setDoctors] = useState({});
  const [loading, setLoading] = useState(true);

  // Uses shared getTodayDateString (Asia/Kolkata timezone — same as patient app)

  useEffect(() => {
    // 1. Subscribe to all doctors
    const unsubscribeDoctors = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const docMap = {};
      snapshot.forEach(doc => {
        docMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      setDoctors(docMap);
    });

    // 2. Subscribe to all appointments from today onwards (>= today)
    const todayStr = getTodayDateString();
    const q = query(
      collection(db, 'appointments'),
      where('appointmentDate', '>=', todayStr)
    );

    const unsubscribeAppointments = onSnapshot(q, async (snapshot) => {
      const appts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side sort: by date ascending, then by time within the same day
      const parseTimeToMinutes = (t) => {
        if (!t) return 0;
        const [timePart, meridiem] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      appts.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) return a.appointmentDate.localeCompare(b.appointmentDate);
        return parseTimeToMinutes(a.appointmentTime) - parseTimeToMinutes(b.appointmentTime);
      });

      // Fetch missing patients details in batch queries to avoid downloading the entire patients collection
      const patientIds = [...new Set(appts.map(a => a.patientId))].filter(Boolean);
      if (patientIds.length > 0) {
        const fetchBatches = [];
        for (let i = 0; i < patientIds.length; i += 30) {
          const batch = patientIds.slice(i, i + 30);
          const qPats = query(collection(db, 'patients'), where('__name__', 'in', batch));
          fetchBatches.push(getDocs(qPats));
        }
        try {
          const results = await Promise.all(fetchBatches);
          const patMap = {};
          results.forEach(resSnap => {
            resSnap.forEach(pDoc => {
              patMap[pDoc.id] = { id: pDoc.id, ...pDoc.data() };
            });
          });
          setPatients(patMap);
        } catch (err) {
          console.error("Error fetching patient details:", err);
        }
      }

      setAppointments(appts);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to appointments:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeDoctors();
      unsubscribeAppointments();
    };
  }, []);

  // ── IDs that should NEVER appear in staff view ───────────────────────────
  // • demo user seeded in AuthContext loginDemoUser()
  // • old mock IDs from staffMockData.js (p-1, p-2, …)
  // • 9199750000 = hardcoded demo UID in AuthContext
  const DEMO_PATIENT_IDS = new Set([
    'patient_priya_demo',
    '9199750000',
    '919199750000',
  ]);
  const isDemoId = (id) =>
    !id ||
    DEMO_PATIENT_IDS.has(id) ||
    /^p-\d+$/.test(id);       // mock data IDs like p-1, p-2 …

  // ── Decide if a patient/appointment pair is a real booking ───────────────
  const isRealPatient = (appt, pat) => {
    if (isDemoId(appt.patientId)) return false;

    const apptName  = (appt.patientName || '').trim();
    const patName   = (pat.name || '').trim();
    const patPhone  = (pat.phone || '').trim();

    // Both name slots are placeholder AND no phone recorded → stub only
    const isStub =
      (apptName === 'User' || apptName === '') &&
      (patName  === 'User' || patName  === '') &&
      !patPhone;

    return !isStub;
  };

  // Expose populated appointments — real patients only
  const populatedAppointments = appointments
    .filter(appt => {
      const pat = patients[appt.patientId] || {};
      return isRealPatient(appt, pat);
    })
    .map(appt => {
    const pat = patients[appt.patientId] || {};
    const docInfo = doctors[appt.doctorId] || {};
    
    // Map status and risk levels for UI compatibility
    const riskLvl = (appt.riskLevel || 'LOW').toLowerCase();
    
    // Map reminders step status
    const step1 = 'success'; // confirmed on booking
    const step2 = (appt.reminderSent48h || appt.reminderSent24h) ? 'success' : 'pending';
    const step3 = (appt.reminderSentMorning || appt.patientConfirmed) ? 'success' : 'pending';

    // Map persona tags
    let personaTag = 'Default';
    if (pat.persona === 'working_professional') personaTag = 'Working Professional';
    else if (pat.persona === 'elderly') personaTag = 'Elderly';
    else if (pat.persona === 'student') personaTag = 'Student';

    return {
      ...appt,
      time: appt.appointmentTime || '',
      // Patient properties
      name: (pat.name && pat.name !== 'User' ? pat.name : null) || (appt.patientName && appt.patientName !== 'User' ? appt.patientName : null) || (appt.patientId ? `Patient ${String(appt.patientId).slice(-4)}` : 'Guest Patient'),
      phone: pat.phone || '',
      age: pat.age || 30,
      gender: pat.gender || 'M',
      persona: pat.persona === 'working_professional' ? 'Lifestyle Juggler' :
               pat.persona === 'elderly' ? 'Senior Dependent' :
               pat.persona === 'student' ? 'Chronic Worrier' : 'Health Conscious',
      personaTag: personaTag,
      pastNoShows: pat.totalNoShows || 0,
      pastVisits: pat.totalVisits || 0,
      
      // Doctor properties
      doctor: appt.doctorName || docInfo.name || 'Dr. Rajesh Mehta',
      specialty: appt.department || docInfo.department || 'Cardiology',
      docAvatar: docInfo.avatar || (appt.doctorName ? appt.doctorName.split(' ').map(n => n[0]).join('').replace('D', '') : 'RM'),
      
      // Risk properties
      riskLevel: riskLvl,
      riskScore: appt.riskScore !== null ? appt.riskScore : (riskLvl === 'high' ? 80 : riskLvl === 'medium' ? 50 : 15),
      
      // SHAP Explainability factors map for UI
      shapFactors: appt.shapFactors ? appt.shapFactors.map(f => ({
        name: f.feature || f.name,
        value: f.impact || f.value,
        desc: f.detail || f.desc
      })) : [
        { name: 'Lead time', value: appt.leadTimeDays ? appt.leadTimeDays * 2 : 10, desc: `Booked ${appt.leadTimeDays || 3} days ago` },
        { name: 'Past history', value: (pat.totalNoShows || 0) * 15, desc: `Skipped ${pat.totalNoShows || 0} visits` }
      ],

      // Reminders step tracking
      reminders: { step1, step2, step3 }
    };
  });

  const fetchTodayAppointments = () => {
    return populatedAppointments;
  };

  const fetchAppointmentsByDoctor = (doctorId) => {
    return populatedAppointments.filter(a => a.doctorId === doctorId);
  };

  const fetchHighRisk = () => {
    return populatedAppointments.filter(a => a.riskLevel === 'high');
  };

  const fetchTodaySummary = () => {
    const summary = {
      total: populatedAppointments.length,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      confirmed: 0,
      pending: 0,
      revenueAtRisk: 0
    };

    populatedAppointments.forEach(a => {
      const r = a.riskLevel;
      if (r === 'high') summary.highRisk++;
      else if (r === 'medium') summary.mediumRisk++;
      else summary.lowRisk++;

      if (a.reminders.step3 === 'success') {
        summary.confirmed++;
      } else {
        summary.pending++;
      }

      // sum consultationFee of high+medium risk
      if (r === 'high' || r === 'medium') {
        summary.revenueAtRisk += Number(a.consultationFee) || 0;
      }
    });

    return summary;
  };

  return {
    appointments: populatedAppointments,
    doctors,
    loading,
    fetchTodayAppointments,
    fetchAppointmentsByDoctor,
    fetchHighRisk,
    fetchTodaySummary
  };
}
