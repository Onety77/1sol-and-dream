import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, collection, onSnapshot, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

let app;
let db;

function getFirebaseApp() {
  if (!firebaseConfig.apiKey) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return app;
}

export function getDb() {
  if (!db) getFirebaseApp();
  return db;
}

export function listenCurrentRound(callback) {
  const database = getDb();
  if (!database) return () => {};
  const ref = doc(database, 'dream_stats', 'currentRound');
  return onSnapshot(ref, snap => callback(snap.exists() ? snap.data() : null));
}

export function listenGlobalStats(callback) {
  const database = getDb();
  if (!database) return () => {};
  const ref = doc(database, 'dream_stats', 'global');
  return onSnapshot(ref, snap => callback(snap.exists() ? snap.data() : null));
}

export function listenTopDreams(callback) {
  const database = getDb();
  if (!database) return () => {};
  const q = query(
    collection(database, 'dreams'),
    where('isDeleted', '==', false),
    where('isRetired', '==', false),
    orderBy('beliefCount', 'desc'),
    limit(10)
  );
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function listenDream(dreamId, callback) {
  const database = getDb();
  if (!database) return () => {};
  const ref = doc(database, 'dreams', dreamId);
  return onSnapshot(ref, snap => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null));
}

export { getApps };
