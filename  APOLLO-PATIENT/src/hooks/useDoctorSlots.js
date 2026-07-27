import { useState, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

const STANDARD_TIMES = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "05:00 PM"
];

export function useDoctorSlots() {
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDoctor = useCallback(async (doctorId) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, COLLECTIONS.DOCTORS, doctorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() };
        setDoctor(docData);
        return docData;
      } else {
        setError("Doctor not found");
        setDoctor(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching doctor:", err);
      setError(err.message || "Failed to load doctor");
      setDoctor(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(async (doctorId, dateString) => {
    setLoading(true);
    setError(null);
    try {
      const slotsRef = collection(db, COLLECTIONS.DOCTOR_SLOTS);
      const q = query(
        slotsRef,
        where("doctorId", "==", doctorId),
        where("date", "==", dateString)
      );

      const querySnapshot = await getDocs(q);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fallback: If no slots exist in Firestore for this date, generate standard slots
      if (docsData.length === 0) {
        const apptsRef = collection(db, COLLECTIONS.APPOINTMENTS);
        const apptQ = query(
          apptsRef,
          where("doctorId", "==", doctorId),
          where("appointmentDate", "==", dateString)
        );
        const bookedTimes = new Set();
        try {
          const apptSnap = await getDocs(apptQ);
          apptSnap.forEach(d => {
            const appt = d.data();
            if (["confirmed", "pending", "walk-in"].includes(appt.status)) {
              bookedTimes.add(appt.appointmentTime);
            }
          });
        } catch (e) {
          console.warn("Could not check booked appointments for fallback slots:", e);
        }

        docsData = STANDARD_TIMES.map((time) => ({
          id: `${doctorId}_${dateString}_${time.replace(/[:\s]/g, '')}`,
          doctorId,
          date: dateString,
          time,
          isAvailable: !bookedTimes.has(time),
        }));
      }

      // Sort client-side by time
      const parseTimeToMinutes = (t) => {
        if (!t) return 0;
        const [timePart, meridiem] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      docsData.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
      setSlots(docsData);
      return docsData;
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError(err.message || "Failed to load slots");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    doctor,
    slots,
    loading,
    error,
    fetchDoctor,
    fetchSlots
  };
}

export default useDoctorSlots;
