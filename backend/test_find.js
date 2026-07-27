const { connectDB, getDB } = require('./db');

async function test() {
  const db = await connectDB();
  const appointments = await db.collection('appointments').find({}).toArray();
  console.log('Total appointments:', appointments.length);
  console.log('First 5 appointments:');
  appointments.slice(0, 5).forEach(a => {
    console.log(`- _id: "${a._id}", patientId: "${a.patientId}", doctorId: "${a.doctorId}"`);
  });
  process.exit(0);
}

test().catch(console.error);
