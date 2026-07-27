const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB, getDB, client } = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '10mb' }));

// Helper to convert ISO dates or Firestore server timestamps
function parseDocValues(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(parseDocValues);
  }
  
  if (typeof data === 'object') {
    const parsed = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = data[key];
        
        // Handle serverTimestamp placeholder
        if (val && val.__type === 'serverTimestamp') {
          parsed[key] = new Date();
        } 
        // Handle date string conversions
        else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          parsed[key] = new Date(val);
        } else {
          parsed[key] = parseDocValues(val);
        }
      }
    }
    return parsed;
  }
  
  return data;
}

// Deep equality helper for preconditions (handles nested objects, dates, and strict comparisons)
function isEqual(val1, val2) {
  if (val1 === val2) return true;
  
  if (val1 && typeof val1 === 'object' && val2 && typeof val2 === 'object') {
    // If both are Dates
    if (val1 instanceof Date && val2 instanceof Date) {
      return val1.getTime() === val2.getTime();
    }
    // If one is Date and other is string date representation
    const time1 = val1 instanceof Date ? val1.getTime() : new Date(val1).getTime();
    const time2 = val2 instanceof Date ? val2.getTime() : new Date(val2).getTime();
    if (!isNaN(time1) && !isNaN(time2) && (val1 instanceof Date || val2 instanceof Date)) {
      return time1 === time2;
    }

    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!keys2.includes(key) || !isEqual(val1[key], val2[key])) return false;
    }
    return true;
  }
  
  // Date and string ISO check fallback
  if (typeof val1 === 'string' && val2 instanceof Date) {
    return new Date(val1).getTime() === val2.getTime();
  }
  if (val1 instanceof Date && typeof val2 === 'string') {
    return val1.getTime() === new Date(val2).getTime();
  }

  return false;
}

// ── GET SINGLE DOCUMENT ──────────────────────────────────────────────────────
app.get('/api/doc', async (req, res) => {
  const { path, id } = req.query;
  if (!path || !id) {
    return res.status(400).json({ error: 'Missing path or id parameters' });
  }

  try {
    const db = getDB();
    const doc = await db.collection(path).findOne({ _id: id });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SET OR REPLACE DOCUMENT ──────────────────────────────────────────────────
app.post('/api/doc', async (req, res) => {
  const { path, id, data, merge } = req.body;
  if (!path || !id || !data) {
    return res.status(400).json({ error: 'Missing path, id, or data parameters' });
  }

  try {
    const db = getDB();
    const parsedData = parseDocValues(data);
    
    if (merge) {
      await db.collection(path).updateOne(
        { _id: id },
        { $set: parsedData },
        { upsert: true }
      );
    } else {
      await db.collection(path).replaceOne(
        { _id: id },
        { ...parsedData, _id: id },
        { upsert: true }
      );
    }
    
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE DOCUMENT FIELDS ───────────────────────────────────────────────────
app.patch('/api/doc', async (req, res) => {
  const { path, id, data } = req.body;
  if (!path || !id || !data) {
    return res.status(400).json({ error: 'Missing path, id, or data parameters' });
  }

  try {
    const db = getDB();
    const parsedData = parseDocValues(data);
    
    const updateDoc = {};
    const setDoc = {};
    const incDoc = {};
    
    for (const key in parsedData) {
      const val = parsedData[key];
      if (val && typeof val === 'object' && val.__type === 'increment') {
        incDoc[key] = val.value;
      } else {
        setDoc[key] = val;
      }
    }
    
    if (Object.keys(setDoc).length > 0) updateDoc.$set = setDoc;
    if (Object.keys(incDoc).length > 0) updateDoc.$inc = incDoc;
    
    await db.collection(path).updateOne({ _id: id }, updateDoc);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RUN QUERY ────────────────────────────────────────────────────────────────
app.post('/api/query', async (req, res) => {
  const { path, clauses, sorts, limitVal } = req.body;
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  try {
    const db = getDB();
    const andClauses = [];

    if (clauses && clauses.length > 0) {
      clauses.forEach(c => {
        let field = c.field === '__name__' ? '_id' : c.field;
        let val = c.value;

        // Support array list comparison or dates
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          val = new Date(val);
        }

        if (c.op === '==') {
          andClauses.push({ [field]: val });
        } else if (c.op === '>') {
          andClauses.push({ [field]: { $gt: val } });
        } else if (c.op === '<') {
          andClauses.push({ [field]: { $lt: val } });
        } else if (c.op === '>=') {
          andClauses.push({ [field]: { $gte: val } });
        } else if (c.op === '<=') {
          andClauses.push({ [field]: { $lte: val } });
        } else if (c.op === 'in') {
          andClauses.push({ [field]: { $in: val } });
        } else if (c.op === 'array-contains') {
          andClauses.push({ [field]: val });
        } else if (c.op === 'array-contains-any') {
          andClauses.push({ [field]: { $in: val } });
        }
      });
    }

    const query = andClauses.length > 0 ? { $and: andClauses } : {};
    let cursor = db.collection(path).find(query);

    // Apply Sorting
    if (sorts && sorts.length > 0) {
      const sortObj = {};
      sorts.forEach(s => {
        const field = s.field === '__name__' ? '_id' : s.field;
        sortObj[field] = s.direction === 'desc' ? -1 : 1;
      });
      cursor = cursor.sort(sortObj);
    }

    // Apply Limit
    if (limitVal !== undefined && limitVal !== null) {
      cursor = cursor.limit(Number(limitVal));
    }

    const results = await cursor.toArray();
    res.json({ docs: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RUN ATOMIC TRANSACTION ───────────────────────────────────────────────────
app.post('/api/transaction', async (req, res) => {
  const { preconditions, operations } = req.body;
  const db = getDB();

  // Define helper function to run checks & operations without transaction session
  const runWithoutTransaction = async () => {
    // 1. Verify preconditions
    if (preconditions && preconditions.length > 0) {
      for (const pre of preconditions) {
        const docId = pre.id;
        const colName = pre.collection;
        const doc = await db.collection(colName).findOne({ _id: docId });
        
        if (!doc) {
          throw new Error(`precondition-failed:doc-not-found:${colName}:${docId}`);
        }
        
        for (const key in pre.check) {
          if (!isEqual(doc[key], pre.check[key])) {
            throw new Error(`precondition-failed:value-mismatch:${colName}:${docId}:${key}`);
          }
        }
      }
    }

    // 2. Perform write operations
    if (operations && operations.length > 0) {
      for (const op of operations) {
        const docId = op.id;
        const colName = op.collection;
        const parsedData = parseDocValues(op.data);

        if (op.type === 'set') {
          await db.collection(colName).replaceOne(
            { _id: docId },
            { ...parsedData, _id: docId },
            { upsert: true }
          );
        } else if (op.type === 'update') {
          const updateDoc = {};
          const setDoc = {};
          const incDoc = {};
          
          for (const key in parsedData) {
            const val = parsedData[key];
            if (val && typeof val === 'object' && val.__type === 'increment') {
              incDoc[key] = val.value;
            } else {
              setDoc[key] = val;
            }
          }
          
          if (Object.keys(setDoc).length > 0) updateDoc.$set = setDoc;
          if (Object.keys(incDoc).length > 0) updateDoc.$inc = incDoc;
          
          await db.collection(colName).updateOne(
            { _id: docId },
            updateDoc
          );
        } else if (op.type === 'delete') {
          await db.collection(colName).deleteOne({ _id: docId });
        }
      }
    }
  };

  let session = null;
  try {
    session = client.startSession();
    await session.withTransaction(async () => {
      // 1. Verify preconditions
      if (preconditions && preconditions.length > 0) {
        for (const pre of preconditions) {
          const docId = pre.id;
          const colName = pre.collection;
          const doc = await db.collection(colName).findOne({ _id: docId }, { session });
          
          if (!doc) {
            throw new Error(`precondition-failed:doc-not-found:${colName}:${docId}`);
          }
          
          for (const key in pre.check) {
            if (!isEqual(doc[key], pre.check[key])) {
              throw new Error(`precondition-failed:value-mismatch:${colName}:${docId}:${key}`);
            }
          }
        }
      }

      // 2. Perform write operations
      if (operations && operations.length > 0) {
        for (const op of operations) {
          const docId = op.id;
          const colName = op.collection;
          const parsedData = parseDocValues(op.data);

          if (op.type === 'set') {
            await db.collection(colName).replaceOne(
              { _id: docId },
              { ...parsedData, _id: docId },
              { upsert: true, session }
            );
          } else if (op.type === 'update') {
            const updateDoc = {};
            const setDoc = {};
            const incDoc = {};
            
            for (const key in parsedData) {
              const val = parsedData[key];
              if (val && typeof val === 'object' && val.__type === 'increment') {
                incDoc[key] = val.value;
              } else {
                setDoc[key] = val;
              }
            }
            
            if (Object.keys(setDoc).length > 0) updateDoc.$set = setDoc;
            if (Object.keys(incDoc).length > 0) updateDoc.$inc = incDoc;
            
            await db.collection(colName).updateOne(
              { _id: docId },
              updateDoc,
              { session }
            );
          } else if (op.type === 'delete') {
            await db.collection(colName).deleteOne({ _id: docId }, { session });
          }
        }
      }
    });

    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('replica set member') || err.message.includes('Transaction numbers') || err.message.includes('startSession')) {
      console.warn("MongoDB replica set transaction unsupported. Falling back to non-transactional execution.");
      try {
        await runWithoutTransaction();
        res.json({ success: true });
      } catch (fallbackErr) {
        console.error("Non-transactional fallback failed:", fallbackErr);
        res.status(500).json({ error: fallbackErr.message });
      }
    } else {
      console.error("Transaction failed:", err);
      res.status(500).json({ error: err.message });
    }
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (e) {
        // Ignore session end errors
      }
    }
  }
});

// Start DB then Express Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 [Server] MongoDB Express Backend listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ [Server] Failed to initialize backend:', err.message);
  process.exit(1);
});
