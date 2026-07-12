/**
 * Database Cleanup Script
 * Run: node cleanupDatabase.js
 * 
 * Cleans up appointments that:
 * 1. Are older than 30 days in the past.
 * 2. Are orphaned (referencing a patientId that doesn't exist).
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

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

// Simple date parser helper
function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

async function run() {
  console.log('\n=== Database Cleanup: Removing Stale & Orphaned Data ===\n');

  // Fetch all patients
  const patientSnaps = await getDocs(collection(db, 'patients'));
  const patientIds = new Set();
  patientSnaps.forEach(d => patientIds.add(d.id));
  console.log(`Loaded ${patientIds.size} valid patient documents.`);

  // Fetch all appointments
  const apptSnaps = await getDocs(collection(db, 'appointments'));
  console.log(`Loaded ${apptSnaps.size} total appointments.`);

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const cutoffMs = today.getTime() - (30 * 24 * 60 * 60 * 1000); // 30 days ago

  let deletedCount = 0;

  for (const docSnap of apptSnaps.docs) {
    const id = docSnap.id;
    const data = docSnap.data();
    let shouldDelete = false;
    let reason = '';

    // Check 1: Orphaned patient reference
    if (!data.patientId || !patientIds.has(data.patientId)) {
      shouldDelete = true;
      reason = `Orphaned patientId: "${data.patientId}"`;
    }

    // Check 2: Stale date (older than 30 days)
    if (!shouldDelete && data.appointmentDate) {
      try {
        const apptDate = parseDateStr(data.appointmentDate);
        if (apptDate.getTime() < cutoffMs) {
          shouldDelete = true;
          reason = `Stale appointment date: "${data.appointmentDate}" (older than 30 days)`;
        }
      } catch (err) {
        shouldDelete = true;
        reason = `Invalid date format: "${data.appointmentDate}"`;
      }
    }

    if (shouldDelete) {
      console.log(`🗑️ Deleting appointment "${id}" - Reason: ${reason}`);
      await deleteDoc(doc(db, 'appointments', id));
      deletedCount++;
    }
  }

  console.log(`\nCleanup complete! Deleted ${deletedCount} stale/orphaned appointment(s).`);
  process.exit(0);
}

run().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
