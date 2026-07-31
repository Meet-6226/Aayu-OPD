import { useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  onSnapshot,
  doc, 
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { todayDateString } from '../utils/appTime';

export function useAppointments() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback((patientId) => {
    if (!patientId) {
      console.log("[useAppointments] fetchAppointments called with empty patientId");
      return () => {};
    }
    console.log("[useAppointments] Subscribing real-time for patientId:", patientId);
    setLoading(true);
    setError(null);

    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const cleanId = String(patientId).replace(/\D/g, '');
    const possibleIds = [...new Set([patientId, cleanId, `91${cleanId}`])].filter(Boolean);

    const q = query(appointmentsRef, where("patientId", "in", possibleIds.slice(0, 10)));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("[useAppointments] Real-time Snapshot size:", querySnapshot.size);
      
      const allAppts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const todayStr = todayDateString();

      const upcomingFiltered = allAppts.filter(appt => {
        const isStatusValid = ["confirmed", "pending"].includes(appt.status);
        const isDateUpcoming = appt.appointmentDate >= todayStr;
        return isStatusValid && isDateUpcoming;
      });

      const pastFiltered = allAppts.filter(appt => {
        const isStatusPast = ["completed", "missed", "cancelled", "no_show"].includes(appt.status);
        const isDatePast = appt.appointmentDate < todayStr;
        return isStatusPast || isDatePast || Boolean(appt.prescription);
      });

      upcomingFiltered.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) {
          return a.appointmentDate.localeCompare(b.appointmentDate);
        }
        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
      });

      pastFiltered.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) {
          return b.appointmentDate.localeCompare(a.appointmentDate);
        }
        return (b.appointmentTime || '').localeCompare(a.appointmentTime || '');
      });

      setUpcoming(upcomingFiltered);
      setPast(pastFiltered);
      setLoading(false);
    }, (err) => {
      console.error("[useAppointments] Error in real-time snapshot listener:", err);
      setError(err.message || "Failed to load appointments");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const cancelAppointment = useCallback(async (appointmentId, reason) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch appointment details
      const apptRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      const apptSnap = await getDoc(apptRef);
      if (!apptSnap.exists()) {
        throw new Error("Appointment not found");
      }
      const apptData = apptSnap.data();

      if (apptData.status === 'cancelled') {
        throw new Error("Appointment is already cancelled");
      }

      // 2. Perform external queries BEFORE transaction
      const slotsRef = collection(db, COLLECTIONS.DOCTOR_SLOTS);
      const slotQ = query(
        slotsRef,
        where("doctorId", "==", apptData.doctorId),
        where("date", "==", apptData.appointmentDate),
        where("time", "==", apptData.appointmentTime)
      );
      const slotSnapshots = await getDocs(slotQ);
      const slotDocRef = !slotSnapshots.empty ? doc(db, COLLECTIONS.DOCTOR_SLOTS, slotSnapshots.docs[0].id) : null;

      const waitlistRef = collection(db, COLLECTIONS.WAITLIST);
      const waitlistQ = query(
        waitlistRef,
        where("doctorId", "==", apptData.doctorId),
        where("preferredDate", "==", apptData.appointmentDate),
        where("status", "==", "waiting")
      );
      const waitlistSnapshots = await getDocs(waitlistQ);

      const patientRef = doc(db, COLLECTIONS.PATIENTS, apptData.patientId);

      // 3. Run Transaction to perform cancellation atomic actions
      await runTransaction(db, async (transaction) => {
        // --- ALL READS FIRST ---
        const patientSnap = await transaction.get(patientRef);

        // --- ALL WRITES AFTER READS ---
        // A. Update appointment document
        transaction.update(apptRef, {
          status: "cancelled",
          cancelledReason: reason,
          updatedAt: serverTimestamp()
        });

        // B. Update slot if exists
        if (slotDocRef) {
          transaction.update(slotDocRef, {
            isAvailable: true,
            appointmentId: null
          });
        }

        // C. Update patient stats & trust score
        if (patientSnap.exists()) {
          const patientData = patientSnap.data();
          const currentNoShows = patientData.totalNoShows || 0;
          const currentVisits = patientData.totalVisits || 0;
          
          const newNoShows = currentNoShows + 1;
          const rawScore = 100 - (newNoShows * 12) + (currentVisits * 3);
          const newTrustScore = Math.max(0, Math.min(100, rawScore));

          transaction.update(patientRef, {
            totalNoShows: newNoShows,
            trustScore: newTrustScore,
            updatedAt: serverTimestamp()
          });
        }

        // D. Mark waitlisted patients as notified
        waitlistSnapshots.docs.forEach((wlDoc) => {
          const wlData = wlDoc.data();
          const wlDocRef = doc(db, COLLECTIONS.WAITLIST, wlDoc.id);
          
          transaction.update(wlDocRef, {
            status: "notified",
            notifiedAt: serverTimestamp()
          });

          const wlNotifyRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
          transaction.set(wlNotifyRef, {
            patientId: wlData.patientId,
            type: "update",
            title: "Slot Available",
            body: `A slot opened with Dr. ${apptData.doctorName} on ${apptData.appointmentDate}. Tap to book.`,
            read: false,
            channel: "system",
            createdAt: serverTimestamp()
          });
        });

        // E. Create notification for current patient
        const currentPatientNotifyRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
        transaction.set(currentPatientNotifyRef, {
          patientId: apptData.patientId,
          type: "update",
          title: "Appointment Cancelled",
          body: `Your appointment with Dr. ${apptData.doctorName} on ${apptData.appointmentDate} at ${apptData.appointmentTime} has been cancelled.`,
          read: false,
          channel: "system",
          createdAt: serverTimestamp()
        });

        // F. Create real-time cancellation alert for Staff Dashboard & Doctor's View
        const cancelAlertRef = doc(collection(db, 'cancellations'));
        transaction.set(cancelAlertRef, {
          appointmentId: apptId,
          patientName: apptData.patientName || 'Patient',
          doctorName: apptData.doctorName || 'Dr. Rajesh Mehta',
          doctorId: apptData.doctorId || 'doc_001',
          appointmentTime: apptData.appointmentTime || '10:30 AM',
          appointmentDate: apptData.appointmentDate || todayDateString(),
          reason: reason || 'Cancelled via Patient App',
          createdAt: serverTimestamp()
        });
      });

      // Refetch appointments list
      await fetchAppointments(apptData.patientId);

    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setError(err.message || "Cancellation failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  return {
    upcoming,
    past,
    loading,
    error,
    fetchAppointments,
    cancelAppointment
  };
}

export default useAppointments;
