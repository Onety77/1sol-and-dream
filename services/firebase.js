import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, collection, onSnapshot, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAx-AyJ1lUI4Rgh2rqxXUTLYqoIcBddFco",
  authDomain: "sol-153d8.firebaseapp.com",
  projectId: "sol-153d8",
  storageBucket: "sol-153d8.firebasestorage.app",
  messagingSenderId: "329991144311",
  appId: "1:329991144311:web:977fd10874b7b42c8c1772"
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
