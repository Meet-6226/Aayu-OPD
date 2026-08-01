import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAW6B2V0QzKouT3T7Rf4DGyzcEcamLcCQ4",
  authDomain: "apollo-opd.firebaseapp.com",
  projectId: "apollo-opd",
  storageBucket: "apollo-opd.firebasestorage.app",
  messagingSenderId: "297620250848",
  appId: "1:297620250848:web:ab85ae9ea382b87e6a7085",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeAllAppointments() {
  console.log('\n=== Wiping ALL Dummy Appointments from Firestore ===\n');

  // 1. Fetch & Delete all appointments
  const apptSnaps = await getDocs(collection(db, 'appointments'));
  console.log(`Found ${apptSnaps.size} appointments to delete.`);

  let deletedCount = 0;
  for (const docSnap of apptSnaps.docs) {
    console.log(`🗑️ Deleting appointment "${docSnap.id}" (${docSnap.data().patientId || 'unknown'})`);
    await deleteDoc(doc(db, 'appointments', docSnap.id));
    deletedCount++;
  }

  // 2. Reset Doctor Slots to Available
  const slotSnaps = await getDocs(collection(db, 'doctor_slots'));
  console.log(`\nResetting ${slotSnaps.size} doctor slots to available...`);
  for (const slotSnap of slotSnaps.docs) {
    await updateDoc(doc(db, 'doctor_slots', slotSnap.id), { isAvailable: true });
  }

  // 3. Delete Notifications
  const notifSnaps = await getDocs(collection(db, 'notifications'));
  for (const notifSnap of notifSnaps.docs) {
    await deleteDoc(doc(db, 'notifications', notifSnap.id));
  }

  console.log(`\n✅ Clean Wiped! Deleted ${deletedCount} appointments. Doctor queue is now 100% EMPTY.`);
  process.exit(0);
}

wipeAllAppointments().catch(err => {
  console.error('Wipe failed:', err);
  process.exit(1);
});
