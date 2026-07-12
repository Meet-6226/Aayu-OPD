/**
 * Data Integrity Checker
 * Run: node checkDataIntegrity.js
 * 
 * Checks all Firestore collections for schema contract violations
 * per FIRESTORE_SCHEMA.md.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

const VALID_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show', 'walk_in', 'recovered']);
const VALID_PERSONAS = new Set(['working_professional', 'elderly', 'student', 'default', null]);

function isCleanPatientId(id) {
  return /^\d+$/.test(id);
}

function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isValidTime(t) {
  return /^\d{2}:\d{2}\s*(AM|PM)$/.test(t);
}

function isValidDoctorId(id) {
  return /^doc_\d{3}$/.test(id);
}

async function run() {
  const issues = [];
  const log = (msg) => {
    console.log(msg);
    issues.push(msg);
  };

  console.log('\n=== Apollo OPD — Firestore Data Integrity Check ===\n');

  // ── 1. Patients ──────────────────────────────────────────────────────────────
  console.log('Checking patients collection…');
  const patientSnaps = await getDocs(collection(db, 'patients'));
  const patientIds = new Set();

  patientSnaps.forEach(docSnap => {
    const id = docSnap.id;
    const data = docSnap.data();
    patientIds.add(id);

    if (!isCleanPatientId(id)) {
      log(`  ❌ PATIENT: Document ID "${id}" contains non-digit characters. Expected digits-only (e.g. "919876543210").`);
    }
    if (data.phone && !/^\+\d+$/.test(data.phone)) {
      log(`  ❌ PATIENT "${id}": phone field "${data.phone}" must start with + followed by digits.`);
    }
    if (data.persona !== undefined && data.persona !== null && !VALID_PERSONAS.has(data.persona)) {
      log(`  ❌ PATIENT "${id}": persona "${data.persona}" is not one of the allowed values.`);
    }
  });
  console.log(`  Checked ${patientSnaps.size} patients.\n`);

  // ── 2. Appointments ──────────────────────────────────────────────────────────
  console.log('Checking appointments collection…');
  const apptSnaps = await getDocs(collection(db, 'appointments'));

  apptSnaps.forEach(docSnap => {
    const id = docSnap.id;
    const data = docSnap.data();

    if (!data.patientId) {
      log(`  ❌ APPOINTMENT "${id}": missing patientId field.`);
    } else if (!isCleanPatientId(data.patientId)) {
      log(`  ❌ APPOINTMENT "${id}": patientId "${data.patientId}" contains non-digit characters.`);
    } else if (!patientIds.has(data.patientId)) {
      log(`  ❌ APPOINTMENT "${id}": patientId "${data.patientId}" does not match any existing patients document.`);
    }

    if (!data.doctorId) {
      log(`  ❌ APPOINTMENT "${id}": missing doctorId field.`);
    } else if (!isValidDoctorId(data.doctorId)) {
      log(`  ❌ APPOINTMENT "${id}": doctorId "${data.doctorId}" must match doc_XXX format.`);
    }

    if (!data.appointmentDate) {
      log(`  ❌ APPOINTMENT "${id}": missing appointmentDate field.`);
    } else if (!isValidDate(data.appointmentDate)) {
      log(`  ❌ APPOINTMENT "${id}": appointmentDate "${data.appointmentDate}" must be YYYY-MM-DD.`);
    }

    if (!data.appointmentTime) {
      log(`  ❌ APPOINTMENT "${id}": missing appointmentTime field.`);
    } else if (!isValidTime(data.appointmentTime)) {
      log(`  ❌ APPOINTMENT "${id}": appointmentTime "${data.appointmentTime}" must be HH:MM AM/PM.`);
    }

    if (data.status && !VALID_STATUSES.has(data.status)) {
      log(`  ❌ APPOINTMENT "${id}": status "${data.status}" is not a valid status value.`);
    }
  });
  console.log(`  Checked ${apptSnaps.size} appointments.\n`);

  // ── 3. Doctor Slots ──────────────────────────────────────────────────────────
  console.log('Checking doctor_slots collection…');
  const slotSnaps = await getDocs(collection(db, 'doctor_slots'));
  let slotIssues = 0;

  slotSnaps.forEach(docSnap => {
    const id = docSnap.id;
    const data = docSnap.data();

    if (data.doctorId && !isValidDoctorId(data.doctorId)) {
      log(`  ❌ SLOT "${id}": doctorId "${data.doctorId}" does not match doc_XXX format.`);
      slotIssues++;
    }
    if (data.date && !isValidDate(data.date)) {
      log(`  ❌ SLOT "${id}": date "${data.date}" must be YYYY-MM-DD.`);
      slotIssues++;
    }
  });
  console.log(`  Checked ${slotSnaps.size} doctor slots (${slotIssues} field issues).\n`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  const errorCount = issues.length;
  console.log('════════════════════════════════════════');
  if (errorCount === 0) {
    console.log('✅  All data is clean — 0 issues found.');
  } else {
    console.log(`❌  ${errorCount} issue(s) found:`);
    issues.forEach(i => console.log(i));
  }
  console.log('════════════════════════════════════════\n');

  process.exit(0);
}

run().catch(err => {
  console.error('Integrity check failed with error:', err);
  process.exit(1);
});
