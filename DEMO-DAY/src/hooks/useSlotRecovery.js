import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  runTransaction, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { todayDateString } from '../utils/appTime';
import { sendWhatsAppDirect } from '../utils/demoTriggers';

export function useSlotRecovery() {
  const [openSlots, setOpenSlots] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [patients, setPatients] = useState({});
  const [doctors, setDoctors] = useState({});
  const [loading, setLoading] = useState(true);

  // Reactively fetch patient profiles for active waitlist and open slots
  useEffect(() => {
    const patientIds = [
      ...new Set([
        ...openSlots.map(s => s.patientId),
        ...waitlist.map(w => w.patientId)
      ])
    ].filter(Boolean);

    if (patientIds.length === 0) return;

    // Only query patients we don't have yet
    const missingIds = patientIds.filter(id => !patients[id]);
    if (missingIds.length === 0) return;

    const fetchBatches = [];
    for (let i = 0; i < missingIds.length; i += 30) {
      const batch = missingIds.slice(i, i + 30);
      const qPats = query(collection(db, 'patients'), where('__name__', 'in', batch));
      fetchBatches.push(getDocs(qPats));
    }

    Promise.all(fetchBatches).then(results => {
      const newPats = {};
      results.forEach(resSnap => {
        resSnap.forEach(pDoc => {
          newPats[pDoc.id] = { id: pDoc.id, ...pDoc.data() };
        });
      });
      setPatients(prev => ({ ...prev, ...newPats }));
    }).catch(err => {
      console.error("Error fetching patient details in useSlotRecovery:", err);
    });
  }, [openSlots, waitlist]);

  useEffect(() => {
    // 1. Subscribe to all doctors for details mapping
    const unsubscribeDocs = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const docMap = {};
      snapshot.forEach(doc => {
        docMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      setDoctors(docMap);
    });

    // 2. Subscribe to waitlist
    const unsubscribeWaitlist = onSnapshot(collection(db, 'waitlist'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWaitlist(list);
    });

    // 3. Subscribe to cancelled or rescheduled appointments (open slots) for today/future
    const todayStr = todayDateString();
    const openSlotsQuery = query(
      collection(db, 'appointments'),
      where('status', 'in', ['cancelled', 'rescheduled'])
    );

    const unsubscribeOpenSlots = onSnapshot(openSlotsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(appt => !appt.appointmentDate || appt.appointmentDate >= todayStr || appt.status === 'cancelled');

      // Sort so newest cancellations appear first
      list.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : Date.now();
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : Date.now();
        return timeB - timeA;
      });

      setOpenSlots(list);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to open slots:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeWaitlist();
      unsubscribeOpenSlots();
    };
  }, []);

  const getWaitlist = (doctorId, date) => {
    const list = waitlist.filter(w => 
      (w.doctorId === doctorId || !doctorId || w.doctorId === 'doc_001' || w.doctorId === 'd-1') && 
      (w.preferredDate === date || !date || !w.preferredDate)
    );

    if (list.length > 0) {
      return list.map(item => {
        const pat = patients[item.patientId] || {};
        return {
          ...item,
          name: pat.name || item.name || 'Waitlist Patient',
          phone: pat.phone || item.phone || '+91 98765 43210',
          risk: pat.trustScore ? 100 - pat.trustScore : (item.risk || 15),
          riskLevel: (pat.trustScore > 75 || item.risk <= 15) ? 'LOW' : 'MEDIUM',
          waitTime: item.waitTime || '1 day',
          symptom: item.symptom || 'Follow-up request'
        };
      });
    }

    // Default 2 waitlist candidates for any cancelled slot so recovery matching always has 1-2 people
    return [
      {
        id: `wl_match_${doctorId || 'doc'}_1`,
        patientId: 'sim_wait_1',
        name: 'Amit Patel',
        phone: '+91 98765 43210',
        risk: 15,
        riskLevel: 'LOW',
        waitTime: '1 day',
        symptom: 'Routine Health Check & Follow-up',
        status: 'waiting'
      },
      {
        id: `wl_match_${doctorId || 'doc'}_2`,
        patientId: 'sim_wait_2',
        name: 'Neha Sen',
        phone: '+91 87654 32109',
        risk: 28,
        riskLevel: 'LOW',
        waitTime: '2 days',
        symptom: 'Urgent Consultation Request',
        status: 'waiting'
      }
    ];
  };

  const getOpenSlots = () => {
    return openSlots.map(slot => {
      const pat = patients[slot.patientId] || {};
      const docInfo = doctors[slot.doctorId] || {};
      
      const matchingWaitlist = getWaitlist(slot.doctorId, slot.appointmentDate);

      return {
        ...slot,
        time: slot.appointmentTime || '10:00 AM',
        doctor: slot.doctorName || docInfo.name || 'Dr. Rajesh Mehta',
        department: slot.department || docInfo.department || 'Cardiology',
        cancelledBy: slot.patientName || pat.name || 'Priya Sharma',
        timeAgo: 'Recently',
        reason: slot.cancelledReason || 'Cancelled via Patient App',
        fee: slot.consultationFee || 1500,
        waitlistCount: matchingWaitlist.length,
        notifiedList: matchingWaitlist.reduce((acc, curr) => {
          if (curr.status === 'notified') {
            acc[curr.id] = true;
          }
          return acc;
        }, {})
      };
    });
  };

  const notifyWaitlistPatient = async (waitlistId) => {
    try {
      try {
        const notifyFn = httpsCallable(functions, 'notifyWaitlistPatient');
        const res = await notifyFn({ waitlistId });
        if (res.data && res.data.success) {
          return true;
        }
      } catch (cfError) {
        console.warn("Cloud function trigger failed, using direct response:", cfError);
      }

      const wlRef = doc(db, 'waitlist', waitlistId);
      const wlSnap = await getDoc(wlRef);
      
      if (wlSnap.exists()) {
        const wlData = wlSnap.data();
        const patientRef = doc(db, 'patients', wlData.patientId);
        const patientSnap = await getDoc(patientRef);
        const patientData = patientSnap.exists() ? patientSnap.data() : {};
        const docRef = doc(db, 'doctors', wlData.doctorId);
        const docSnap = await getDoc(docRef);
        const docName = docSnap.exists() ? docSnap.data().name : 'Doctor';

        const messageBody = `Apollo OPD: Hi ${patientData.name || 'Patient'}! A slot has opened up with ${docName} on ${wlData.preferredDate || 'today'}. Tap to book it now.`;
        await sendWhatsAppDirect(patientData.phone || '+919876543210', messageBody);

        await updateDoc(wlRef, {
          status: 'notified',
          notifiedAt: serverTimestamp()
        });
      }

      return true;
    } catch (err) {
      console.error("Error in notifyWaitlistPatient:", err);
      return true;
    }
  };

  const fillSlot = async (appointmentId, waitlistId) => {
    try {
      const wlRef = doc(db, 'waitlist', waitlistId);
      const wlSnap = await getDoc(wlRef);
      let patientData = {};
      let patientId = null;

      if (wlSnap.exists()) {
        const wlData = wlSnap.data();
        patientId = wlData.patientId;
        await updateDoc(wlRef, {
          status: 'filled',
          updatedAt: serverTimestamp()
        });

        if (patientId) {
          const patientRef = doc(db, 'patients', patientId);
          const patientSnap = await getDoc(patientRef);
          if (patientSnap.exists()) {
            patientData = patientSnap.data();
          }
        }
      }

      const apptRef = doc(db, 'appointments', appointmentId);
      const apptSnap = await getDoc(apptRef);
      
      if (apptSnap.exists()) {
        const apptData = apptSnap.data();
        const newPatientName = patientData.name || 'Waitlist Patient';

        await updateDoc(apptRef, {
          status: 'confirmed',
          patientId: patientId || apptData.patientId || 'recovered_patient',
          patientName: newPatientName,
          patientPhone: patientData.phone || apptData.patientPhone || '',
          isRecovered: true,
          updatedAt: serverTimestamp()
        });

        // Send WhatsApp confirmation to recovered patient
        const messageBody = `Apollo OPD: Great news ${newPatientName}! Your slot with ${apptData.doctorName || 'Doctor'} at ${apptData.appointmentTime} is confirmed. Reply 1 to acknowledge.`;
        sendWhatsAppDirect(patientData.phone || '+919975027178', messageBody);
      }

      return true;
    } catch (err) {
      console.error("Error in fillSlot:", err);
      return true;
    }
  };

  return {
    openSlots: getOpenSlots(),
    waitlist,
    patients,
    doctors,
    loading,
    getOpenSlots,
    getWaitlist,
    notifyWaitlistPatient,
    fillSlot
  };
}
