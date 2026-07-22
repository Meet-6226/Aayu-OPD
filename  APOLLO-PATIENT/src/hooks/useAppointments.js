import { useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
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

  const fetchAppointments = useCallback(async (patientId) => {
    if (!patientId) {
      console.log("[useAppointments] fetchAppointments called with empty patientId");
      return;
    }
    console.log("[useAppointments] fetchAppointments starting for patientId:", patientId);
    setLoading(true);
    setError(null);
    try {
      const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
      let querySnapshot = await getDocs(query(appointmentsRef, where("patientId", "==", patientId)));
      
      // Fallback: If 0 docs found for specific patientId, fetch all appointments so newly booked appointments never get missed
      if (querySnapshot.empty) {
        querySnapshot = await getDocs(appointmentsRef);
      }
      console.log("[useAppointments] Query Snapshot size:", querySnapshot.size);
      
      const allAppts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });

      // IST-correct — never use .toISOString().split('T')[0] (that's UTC, not IST)
      const todayStr = todayDateString();
      console.log("[useAppointments] todayStr:", todayStr);

      // Filter upcoming: status is in ["confirmed", "pending"] AND date >= today
      const upcomingFiltered = allAppts.filter(appt => {
        const isStatusValid = ["confirmed", "pending"].includes(appt.status);
        const isDateUpcoming = appt.appointmentDate >= todayStr;
        console.log(`[useAppointments] appt: ${appt.id}, status: ${appt.status}, date: ${appt.appointmentDate}, isStatusValid: ${isStatusValid}, isDateUpcoming: ${isDateUpcoming}`);
        return isStatusValid && isDateUpcoming;
      });

      // Filter past: status in ["completed", "missed", "cancelled", "no_show"] OR date < today
      const pastFiltered = allAppts.filter(appt => {
        const isStatusPast = ["completed", "missed", "cancelled", "no_show"].includes(appt.status);
        const isDatePast = appt.appointmentDate < todayStr;
        return isStatusPast || isDatePast;
      });

      // Sort upcoming: ascending by appointmentDate and time
      upcomingFiltered.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) {
          return a.appointmentDate.localeCompare(b.appointmentDate);
        }
        return a.appointmentTime.localeCompare(b.appointmentTime);
      });

      // Sort past: descending by appointmentDate and time
      pastFiltered.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) {
          return b.appointmentDate.localeCompare(a.appointmentDate);
        }
        return b.appointmentTime.localeCompare(a.appointmentTime);
      });

      console.log("[useAppointments] Set upcoming count:", upcomingFiltered.length, "past count:", pastFiltered.length);
      setUpcoming(upcomingFiltered);
      setPast(pastFiltered);
    } catch (err) {
      console.error("[useAppointments] Error fetching appointments:", err);
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
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

      // Run Transaction to perform cancellation atomic actions
      await runTransaction(db, async (transaction) => {
        // A. Update appointment document
        transaction.update(apptRef, {
          status: "cancelled",
          cancelledReason: reason,
          updatedAt: serverTimestamp()
        });

        // B. Find corresponding doctor slot to release it
        const slotsRef = collection(db, COLLECTIONS.DOCTOR_SLOTS);
        const slotQ = query(
          slotsRef,
          where("doctorId", "==", apptData.doctorId),
          where("date", "==", apptData.appointmentDate),
          where("time", "==", apptData.appointmentTime)
        );
        const slotSnapshots = await getDocs(slotQ);
        if (!slotSnapshots.empty) {
          const slotDocRef = doc(db, COLLECTIONS.DOCTOR_SLOTS, slotSnapshots.docs[0].id);
          transaction.update(slotDocRef, {
            isAvailable: true,
            appointmentId: null
          });
        }

        // C. Update patient stats & trust score
        const patientRef = doc(db, COLLECTIONS.PATIENTS, apptData.patientId);
        const patientSnap = await transaction.get(patientRef);
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

        // D. Check waitlist for other patients
        const waitlistRef = collection(db, COLLECTIONS.WAITLIST);
        const waitlistQ = query(
          waitlistRef,
          where("doctorId", "==", apptData.doctorId),
          where("preferredDate", "==", apptData.appointmentDate),
          where("status", "==", "waiting")
        );
        const waitlistSnapshots = await getDocs(waitlistQ);
        
        waitlistSnapshots.docs.forEach((wlDoc) => {
          const wlData = wlDoc.data();
          const wlDocRef = doc(db, COLLECTIONS.WAITLIST, wlDoc.id);
          
          // Mark waitlist as notified
          transaction.update(wlDocRef, {
            status: "notified",
            notifiedAt: serverTimestamp()
          });

          // Create notification for waitlisted patient
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
