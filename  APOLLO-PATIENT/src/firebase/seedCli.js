import { seedDatabase } from './seedData.js';

console.log("Initializing Firestore Seeding CLI...");

seedDatabase()
  .then((res) => {
    console.log("==========================================");
    console.log(" Firestore Database Seeded Successfully!");
    console.log("==========================================");
    console.log("Summary of documents added:");
    console.log(`- Doctors:       ${res.logs.doctors}`);
    console.log(`- Doctor Slots:  ${res.logs.doctor_slots}`);
    console.log(`- Patients:      ${res.logs.patients}`);
    console.log(`- Appointments:  ${res.logs.appointments}`);
    console.log(`- Notifications: ${res.logs.notifications}`);
    console.log(`- Waitlist:      ${res.logs.waitlist}`);
    console.log("==========================================");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed with error:", err);
    process.exit(1);
  });
