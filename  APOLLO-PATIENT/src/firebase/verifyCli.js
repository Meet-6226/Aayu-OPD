import { collection, getDocs } from 'firebase/firestore';
import { db } from './config.js';
import { COLLECTIONS } from './collections.js';

async function verifySeeding() {
  console.log("Fetching Firestore document counts...");
  
  // 1. Fetch Doctors
  const docQuery = await getDocs(collection(db, COLLECTIONS.DOCTORS));
  console.log(`\n1. Total Doctors: ${docQuery.size} (Expected: 10)`);

  // 2. Fetch Slots
  const slotQuery = await getDocs(collection(db, COLLECTIONS.DOCTOR_SLOTS));
  console.log(`2. Total Doctor Slots: ${slotQuery.size} (Expected: 1820)`);

  // 3. List all doctor IDs and Names
  console.log("\n3. Seeding Matches Checklist:");
  const docsList = docQuery.docs.map(d => ({ id: d.id, name: d.data().name }));
  // Sort by ID to compare easily
  docsList.sort((a, b) => a.id.localeCompare(b.id));
  
  docsList.forEach((docInfo) => {
    console.log(`   - ID: ${docInfo.id} -> Name: ${docInfo.name}`);
  });
}

verifySeeding()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
