const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend directory or root or patient app
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, './.env') });

const uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'nidaan_opd_intelligence';

console.log(`[Database] Connecting to URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

const client = new MongoClient(uri);

let dbInstance = null;

async function connectDB() {
  if (dbInstance) return dbInstance;
  
  try {
    await client.connect();
    console.log('✅ [Database] MongoDB Connected Successfully.');
    dbInstance = client.db(dbName);
    return dbInstance;
  } catch (err) {
    console.error('❌ [Database] MongoDB Connection Failed:', err.message);
    throw err;
  }
}

module.exports = {
  connectDB,
  client,
  getDB: () => {
    if (!dbInstance) {
      throw new Error('[Database] DB not connected. Call connectDB() first.');
    }
    return dbInstance;
  }
};
