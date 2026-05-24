const admin = require('firebase-admin');

let db = null;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return db;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || raw === '{}') {
    console.warn('[Firebase] No service account JSON. Using emulator or mock mode.');
    db = createMockDb();
    return db;
  }
  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  return db;
}

function getDb() {
  if (!db) return initFirebase();
  return db;
}

function createMockDb() {
  const store = {};
  const mockCollection = (name) => ({
    doc: (id) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data) => { store[`${name}/${id}`] = data; },
      update: async (data) => { store[`${name}/${id}`] = { ...(store[`${name}/${id}`] || {}), ...data }; },
      ref: { update: async () => {} },
    }),
    where: () => ({ where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }), orderBy: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }), limit: () => ({ get: async () => ({ empty: true, docs: [] }) }), get: async () => ({ empty: true, docs: [] }) }),
    add: async (data) => { const id = Math.random().toString(36); store[`${name}/${id}`] = data; return { id }; },
  });
  return { collection: mockCollection };
}

module.exports = { initFirebase, getDb };
