// Determine backend URL:
// - If VITE_BACKEND_URL is set in environment (e.g. on Vercel), use it.
// - Otherwise, fallback to localhost or LAN IP depending on where it's run.
function getBackendURL() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window === 'undefined') return 'http://localhost:5002';
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' 
    || hostname === '127.0.0.1'
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)   // 172.16–31.x.x (private)
    || /^192\.168\./.test(hostname)                    // 192.168.x.x
    || /^10\./.test(hostname);                         // 10.x.x.x
  if (!isLocal) {
    console.warn(`[Bridge] ⚠️ Running on public host "${hostname}". Backend (localhost:5002) is NOT reachable. Configure VITE_BACKEND_URL environment variable.`);
  }
  return `http://${hostname}:5002`;
}

const BACKEND_URL = getBackendURL();

export function getFirestore() {
  return { type: 'db' };
}

export function collection(db, path) {
  return { type: 'collection', path };
}

export function doc(first, second, third) {
  if (first && first.type === 'collection') {
    return { type: 'doc', path: first.path, id: second };
  }
  if (third) {
    return { type: 'doc', path: second, id: third };
  }
  const parts = second.split('/');
  return { type: 'doc', path: parts[0], id: parts[1] };
}

export function where(field, op, value) {
  return { type: 'where', field, op, value };
}

export function limit(value) {
  return { type: 'limit', value };
}

export function orderBy(field, direction = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function query(collectionRef, ...clauses) {
  return { type: 'query', ref: collectionRef, clauses: clauses.filter(Boolean) };
}

export function serverTimestamp() {
  return { __type: 'serverTimestamp' };
}

export function increment(value) {
  return { __type: 'increment', value };
}

export async function getDoc(docRef) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/doc?path=${encodeURIComponent(docRef.path)}&id=${encodeURIComponent(docRef.id)}`);
    const { data } = await res.json();
    return {
      id: docRef.id,
      ref: docRef,
      exists: () => data !== null && data !== undefined,
      data: () => data
    };
  } catch (err) {
    console.error('[Bridge] getDoc failed:', err.message);
    throw err;
  }
}

export async function getDocs(ref) {
  try {
    const payload = {
      path: ref.type === 'query' ? ref.ref.path : ref.path,
      clauses: [],
      sorts: [],
      limitVal: null
    };

    if (ref.type === 'query') {
      ref.clauses.forEach(c => {
        if (c.type === 'where') payload.clauses.push({ field: c.field, op: c.op, value: c.value });
        else if (c.type === 'orderBy') payload.sorts.push({ field: c.field, direction: c.direction });
        else if (c.type === 'limit') payload.limitVal = c.value;
      });
    }

    const res = await fetch(`${BACKEND_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const { docs } = await res.json();

    const docSnaps = (docs || []).map(d => ({
      id: d._id || d.id,
      ref: { type: 'doc', path: payload.path, id: d._id || d.id },
      exists: () => true,
      data: () => d
    }));

    return {
      size: docSnaps.length,
      empty: docSnaps.length === 0,
      docs: docSnaps,
      forEach: (cb) => docSnaps.forEach(cb),
      map: (cb) => docSnaps.map(cb),
      filter: (cb) => docSnaps.filter(cb)
    };
  } catch (err) {
    console.error('[Bridge] getDocs failed:', err.message);
    throw err;
  }
}

export async function addDoc(collectionRef, data) {
  const id = 'mongo_' + Math.random().toString(36).substring(2, 15);
  try {
    const res = await fetch(`${BACKEND_URL}/api/doc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: collectionRef.path,
        id,
        data,
        merge: false
      })
    });
    await res.json();
    return { id, ref: { type: 'doc', path: collectionRef.path, id } };
  } catch (err) {
    console.error('[Bridge] addDoc failed:', err.message);
    throw err;
  }
}

export async function setDoc(docRef, data, options) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/doc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: docRef.path,
        id: docRef.id,
        data,
        merge: options?.merge || false
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Bridge] setDoc failed:', err.message);
    throw err;
  }
}

export async function updateDoc(docRef, data) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/doc`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: docRef.path,
        id: docRef.id,
        data
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Bridge] updateDoc failed:', err.message);
    throw err;
  }
}

export async function deleteDoc(docRef) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preconditions: [],
        operations: [{ type: 'delete', collection: docRef.path, id: docRef.id }]
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Bridge] deleteDoc failed:', err.message);
    throw err;
  }
}

// Emulates onSnapshot using high-efficiency polling checking for changes
export function onSnapshot(ref, callback, errorCallback) {
  let lastDataString = '';
  
  const checkUpdate = async () => {
    try {
      const snap = await getDocs(ref);
      const docsData = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      const currentDataString = JSON.stringify(docsData);
      
      if (currentDataString !== lastDataString) {
        lastDataString = currentDataString;
        callback(snap);
      }
    } catch (err) {
      if (errorCallback) errorCallback(err);
      else console.error('[Bridge] onSnapshot poll failed:', err.message);
    }
  };

  // Run initial resolution immediately
  checkUpdate();

  // Poll for subsequent changes
  const intervalId = setInterval(checkUpdate, 2500);

  // Return unsubscribe handle
  return () => {
    clearInterval(intervalId);
  };
}

export async function runTransaction(db, callback) {
  const preconditions = [];
  const operations = [];

  const transaction = {
    get: async (docRef) => {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        preconditions.push({
          collection: docRef.path,
          id: docRef.id,
          check: { ...snap.data() }
        });
      } else {
        preconditions.push({
          collection: docRef.path,
          id: docRef.id,
          check: null
        });
      }
      return snap;
    },
    set: (docRef, data) => {
      operations.push({
        type: 'set',
        collection: docRef.path,
        id: docRef.id,
        data
      });
    },
    update: (docRef, data) => {
      operations.push({
        type: 'update',
        collection: docRef.path,
        id: docRef.id,
        data
      });
    },
    delete: (docRef) => {
      operations.push({
        type: 'delete',
        collection: docRef.path,
        id: docRef.id
      });
    }
  };

  await callback(transaction);

  const res = await fetch(`${BACKEND_URL}/api/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preconditions, operations })
  });

  const resData = await res.json();
  if (!resData.success) {
    throw new Error(resData.error || 'Transaction aborted by backend');
  }
}

export function writeBatch(db) {
  const operations = [];
  return {
    set: (docRef, data) => {
      operations.push({ type: 'set', collection: docRef.path, id: docRef.id, data });
    },
    update: (docRef, data) => {
      operations.push({ type: 'update', collection: docRef.path, id: docRef.id, data });
    },
    delete: (docRef) => {
      operations.push({ type: 'delete', collection: docRef.path, id: docRef.id });
    },
    commit: async () => {
      const res = await fetch(`${BACKEND_URL}/api/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preconditions: [], operations })
      });
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Batch commit failed');
      }
    }
  };
}

export const Timestamp = {
  now: () => new Date(),
  fromDate: (date) => date,
  fromMillis: (ms) => new Date(ms)
};
