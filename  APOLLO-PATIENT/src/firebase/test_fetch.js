import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './config.js';
import { COLLECTIONS } from './collections.js';
import { todayDateString } from '../utils/appTime.js';

async function testFetch() {
  const patientId = "919876543212";
  console.log(`Running testFetch for patientId: ${patientId}`);
  
  const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
  const q = query(appointmentsRef, where("patientId", "==", patientId));
  const querySnapshot = await getDocs(q);
  
  console.log(`Query returned ${querySnapshot.size} docs.`);
  
  const allAppts = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const todayStr = todayDateString();
  console.log(`todayStr: "${todayStr}"`);

  allAppts.forEach(appt => {
    const isStatusValid = ["confirmed", "pending"].includes(appt.status);
    const isDateUpcoming = appt.appointmentDate >= todayStr;
    console.log(`Appt ID: ${appt.id}`);
    console.log(`  appointmentDate: "${appt.appointmentDate}"`);
    console.log(`  status: "${appt.status}"`);
    console.log(`  isStatusValid: ${isStatusValid}`);
    console.log(`  isDateUpcoming: ${isDateUpcoming}`);
  });
}

testFetch()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
