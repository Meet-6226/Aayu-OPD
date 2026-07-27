const fs = require('fs');
const path = require('path');

const COLLECTIONS = [
  'patients',
  'doctors',
  'appointments',
  'doctor_slots',
  'waitlist',
  'reminders',
  'notifications'
];

const serviceAccountPath = path.resolve(__dirname, './serviceAccountKey.json');

// Helper to sanitize date types
function sanitizeValue(val) {
  if (!val) return val;
  // If it's a Firestore Timestamp (has toDate method)
  if (val && typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  // If it has seconds/nanoseconds properties (Timestamp object shape)
  if (val && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (typeof val === 'object') {
    const res = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        res[key] = sanitizeValue(val[key]);
      }
    }
    return res;
  }
  return val;
}

async function runExport() {
  const backup = {};
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔑 Found serviceAccountKey.json. Initializing Firebase Admin SDK...');
    const admin = require('firebase-admin');
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
      });
    }
    const db = admin.firestore();
    
    console.log('=== Starting Firestore Admin Export ===');
    for (const colName of COLLECTIONS) {
      console.log(`Exporting collection: "${colName}"...`);
      try {
        const snap = await db.collection(colName).get();
        backup[colName] = [];
        snap.forEach(doc => {
          backup[colName].push({
            _id: doc.id,
            ...sanitizeValue(doc.data())
          });
        });
        console.log(`  Exported ${backup[colName].length} docs.`);
      } catch (err) {
        console.error(`  ❌ Error exporting "${colName}":`, err.message);
      }
    }
  } else {
    console.log('⚠️ serviceAccountKey.json not found. Falling back to Public Web Client SDK...');
    
    // Initialize Web SDK in Node.js
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs } = require('firebase/firestore');
    
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
    
    console.log('=== Starting Firestore Client Export ===');
    for (const colName of COLLECTIONS) {
      console.log(`Exporting collection: "${colName}"...`);
      try {
        const snap = await getDocs(collection(db, colName));
        backup[colName] = [];
        snap.forEach(doc => {
          backup[colName].push({
            _id: doc.id,
            ...sanitizeValue(doc.data())
          });
        });
        console.log(`  Exported ${backup[colName].length} docs.`);
      } catch (err) {
        console.error(`  ❌ Error exporting "${colName}":`, err.message);
      }
    }
  }

  const outputPath = path.resolve(__dirname, './backup.json');
  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`\n✅ Success! Backup saved to: ${outputPath}\n`);
}

runExport().catch(err => {
  console.error('\n❌ Export crashed:', err);
  process.exit(1);
});
