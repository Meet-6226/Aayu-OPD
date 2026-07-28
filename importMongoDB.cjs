const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Determine MongoDB Connection URI
let mongoUri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

// Check CLI arguments for overriding URI
const args = process.argv.slice(2);
if (args.length > 0) {
  mongoUri = args[0];
}

if (!mongoUri) {
  console.log('⚠️ No MongoDB URI provided in environment or arguments. Falling back to local default.');
  mongoUri = 'mongodb://localhost:27017';
}

const dbName = 'nidaan_opd_intelligence';
const backupPath = path.resolve(__dirname, './backup.json');

if (!fs.existsSync(backupPath)) {
  console.error(`\n❌ ERROR: ${backupPath} not found!`);
  console.error('Please run "node exportFirestore.cjs" first to create the backup file.\n');
  process.exit(1);
}

const backup = require(backupPath);

async function importData() {
  console.log(`=== Starting MongoDB Import to ${dbName} ===`);
  console.log(`Connecting to: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`); // Hide passwords in log

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB server.');
    const db = client.db(dbName);

    for (const collectionName in backup) {
      if (!Object.prototype.hasOwnProperty.call(backup, collectionName)) continue;
      
      const docs = backup[collectionName];
      if (!docs || docs.length === 0) {
        console.log(`Collection "${collectionName}" is empty. Skipping.`);
        continue;
      }

      console.log(`Importing ${docs.length} documents into collection "${collectionName}"...`);
      
      // Clean up previous documents to ensure clean import
      await db.collection(collectionName).deleteMany({});

      // Insert all
      const result = await db.collection(collectionName).insertMany(docs);
      console.log(`  Successfully imported ${result.insertedCount} documents.`);
    }

    console.log('\n✅ All data imported successfully!\n');
  } catch (err) {
    console.error('\n❌ MongoDB Import failed:', err);
  } finally {
    await client.close();
  }
}

importData().catch(err => {
  console.error('\n❌ Import process crashed:', err);
  process.exit(1);
});
