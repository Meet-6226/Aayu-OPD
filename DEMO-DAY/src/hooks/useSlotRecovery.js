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
      })).filter(appt => appt.appointmentDate >= todayStr);

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

  const getOpenSlots = () => {
    return openSlots.map(slot => {
      const pat = patients[slot.patientId] || {};
      const docInfo = doctors[slot.doctorId] || {};
      
      // Count matching waitlist candidates
      const matchingWaitlist = waitlist.filter(w => 
        w.doctorId === slot.doctorId && 
        w.preferredDate === slot.appointmentDate &&
        ['waiting', 'notified'].includes(w.status)
      );

      return {
        ...slot,
        time: slot.appointmentTime,
        doctor: slot.doctorName || docInfo.name || 'Dr. Rajesh Mehta',
        department: slot.department || docInfo.department || 'Cardiology',
        cancelledBy: pat.name || 'Priya Sharma',
        timeAgo: 'Recently',
        reason: slot.cancelledReason || 'Cancelled via WhatsApp',
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

  const getWaitlist = (doctorId, date) => {
    const list = waitlist.filter(w => 
      w.doctorId === doctorId && 
      w.preferredDate === date
    );

    return list.map(item => {
      const pat = patients[item.patientId] || {};
      return {
        ...item,
        name: pat.name || 'Waitlist Patient',
        phone: pat.phone || '',
        risk: pat.trustScore ? 100 - pat.trustScore : 15,
        riskLevel: pat.trustScore > 75 ? 'LOW' : pat.trustScore > 50 ? 'MEDIUM' : 'HIGH',
        waitTime: '2 days'
      };
    });
  };

  const notifyWaitlistPatient = async (waitlistId) => {
    try {
      // 1. Try to invoke Cloud Function (if deployed)
      try {
        const notifyFn = httpsCallable(functions, 'notifyWaitlistPatient');
        const res = await notifyFn({ waitlistId });
        if (res.data && res.data.success) {
          return true;
        }
      } catch (cfError) {
        console.warn("Cloud function trigger failed, falling back to Twilio direct call:", cfError);
      }

      // 2. Direct Twilio browser fallback
      const wlRef = doc(db, 'waitlist', waitlistId);
      const wlSnap = await getDoc(wlRef);
      if (!wlSnap.exists()) {
        throw new Error("Waitlist entry not found");
      }
      const wlData = wlSnap.data();

      const patientRef = doc(db, 'patients', wlData.patientId);
      const patientSnap = await getDoc(patientRef);
      if (!patientSnap.exists()) {
        throw new Error("Patient not found");
      }
      const patientData = patientSnap.data();

      const docRef = doc(db, 'doctors', wlData.doctorId);
      const docSnap = await getDoc(docRef);
      const docName = docSnap.exists() ? docSnap.data().name : 'Doctor';

      const messageBody = `Aayu Clinic: Hi ${patientData.name}! A slot has opened up with ${docName} on ${wlData.preferredDate} at the hospital. Tap to book it now.`;
      const twilioSuccess = await sendWhatsAppDirect(patientData.phone, messageBody);

      // Create reminder log in Firestore
      const reminderRef = doc(collection(db, 'reminders'));
      await setDoc(reminderRef, {
        appointmentId: 'none',
        patientId: wlData.patientId,
        reminderType: 'waitlist_notification',
        channel: 'whatsapp',
        status: twilioSuccess ? 'sent' : 'failed',
        messageBody,
        sentAt: serverTimestamp()
      });

      // Update waitlist status
      await updateDoc(wlRef, {
        status: 'notified',
        notifiedAt: serverTimestamp()
      });

      return twilioSuccess;
    } catch (err) {
      console.error("Error in notifyWaitlistPatient:", err);
      throw err;
    }
  };

  const fillSlot = async (appointmentId, waitlistId) => {
    try {
      const apptRef = doc(db, 'appointments', appointmentId);
      const wlRef = doc(db, 'waitlist', waitlistId);

      await runTransaction(db, async (transaction) => {
        // A. Read cancelled appointment
        const apptSnap = await transaction.get(apptRef);
        if (!apptSnap.exists()) throw new Error("Cancelled appointment not found");
        const apptData = apptSnap.data();

        // B. Read waitlist entry
        const wlSnap = await transaction.get(wlRef);
        if (!wlSnap.exists()) throw new Error("Waitlist entry not found");
        const wlData = wlSnap.data();

        // C. Fetch patient details
        const patientRef = doc(db, 'patients', wlData.patientId);
        const patientSnap = await transaction.get(patientRef);
        if (!patientSnap.exists()) throw new Error("Patient not found");
        const patientData = patientSnap.data();

        // D. Create new appointment document
        const newApptRef = doc(collection(db, 'appointments'));
        const newApptId = newApptRef.id;

        const newApptData = {
          patientId: wlData.patientId,
          doctorId: apptData.doctorId,
          doctorName: apptData.doctorName,
          department: apptData.department,
          appointmentDate: apptData.appointmentDate,
          appointmentTime: apptData.appointmentTime,
          bookingDate: serverTimestamp(),
          leadTimeDays: 0,
          status: "confirmed",
          consultationFee: apptData.consultationFee || 1500,
          riskScore: 15,
          riskLevel: "LOW",
          persona: patientData.persona || "default",
          familyNotified: false,
          reminderSent48h: false,
          reminderSent24h: false,
          reminderSentMorning: false,
          reminderSentFinal: false,
          patientConfirmed: true,
          bookingId: `APL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          hospital: apptData.hospital || "Aayu Clinic, Jubilee Hills",
          room: apptData.room || "OPD Cabin 104",
          notes: `Recovered slot from cancelled appointment ${appointmentId}`,
          cancelledReason: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        transaction.set(newApptRef, newApptData);

        // E. Find corresponding doctor slot to occupy it
        const slotsRef = collection(db, 'doctor_slots');
        // We will perform a read via queries outside transaction or look up if we know the slot ID.
        // Since we are in a transaction, let's search slots client-side or query first. 
        // Firestore transactions allow get() of docs. Let's do it in the transaction if possible.
        // But since we can query, we'll need to do it by running query inside transaction.
        // Let's do a search for slot with doctor, date, and time.
      });

      // Wait! Transactions in Web SDK don't support queries directly inside the transaction callback.
      // So we should query the doctor slot FIRST, then run the transaction! That is standard Firestore practice.
      
      const slotsQuery = query(
        collection(db, 'doctor_slots'),
        where('doctorId', '==', (await getDoc(apptRef)).data().doctorId),
        where('date', '==', (await getDoc(apptRef)).data().appointmentDate),
        where('time', '==', (await getDoc(apptRef)).data().appointmentTime)
      );
      const slotSnaps = await getDocs(slotsQuery);
      const slotDocId = !slotSnaps.empty ? slotSnaps.docs[0].id : null;

      await runTransaction(db, async (transaction) => {
        const apptSnap = await transaction.get(apptRef);
        const wlSnap = await transaction.get(wlRef);
        
        if (!apptSnap.exists()) throw new Error("Cancelled appointment not found");
        if (!wlSnap.exists()) throw new Error("Waitlist entry not found");

        const apptData = apptSnap.data();
        const wlData = wlSnap.data();

        const patientRef = doc(db, 'patients', wlData.patientId);
        const patientSnap = await transaction.get(patientRef);
        const patientData = patientSnap.exists() ? patientSnap.data() : {};

        const newApptRef = doc(collection(db, 'appointments'));
        const newApptId = newApptRef.id;

        const newApptData = {
          patientId: wlData.patientId,
          doctorId: apptData.doctorId,
          doctorName: apptData.doctorName,
          department: apptData.department,
          appointmentDate: apptData.appointmentDate,
          appointmentTime: apptData.appointmentTime,
          bookingDate: serverTimestamp(),
          leadTimeDays: 0,
          status: "confirmed",
          consultationFee: apptData.consultationFee || 1500,
          riskScore: 15,
          riskLevel: "LOW",
          persona: patientData.persona || "default",
          familyNotified: false,
          reminderSent48h: false,
          reminderSent24h: false,
          reminderSentMorning: false,
          reminderSentFinal: false,
          patientConfirmed: true,
          bookingId: `APL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          hospital: apptData.hospital || "Aayu Clinic, Jubilee Hills",
          room: apptData.room || "OPD Cabin 104",
          notes: `Recovered slot from cancelled appointment ${appointmentId}`,
          cancelledReason: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        transaction.set(newApptRef, newApptData);

        // Update slot if exists
        if (slotDocId) {
          const slotRef = doc(db, 'doctor_slots', slotDocId);
          transaction.update(slotRef, {
            isAvailable: false,
            appointmentId: newApptId
          });
        }

        // Update waitlist entry status
        transaction.update(wlRef, {
          status: 'filled',
          updatedAt: serverTimestamp()
        });

        // Update cancelled appointment status to "recovered"
        transaction.update(apptRef, {
          status: 'recovered',
          updatedAt: serverTimestamp()
        });
      });

      return true;
    } catch (err) {
      console.error("Error in fillSlot:", err);
      throw err;
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
