require('dotenv').config();
const admin = require('firebase-admin');
const { initFirebase, getDb } = require('./services/firebase');
const { getCreatorBalance, sendSOL, checkHolding } = require('./services/solana');

initFirebase();

const ROUND_DURATION_MS = parseInt(process.env.ROUND_DURATION_MS) || 3600000;
const GAS_RESERVE = parseFloat(process.env.GAS_RESERVE_SOL) || 0.1;

async function getCurrentRound() {
  const db = getDb();
  const doc = await db.collection('dream_stats').doc('currentRound').get();
  return doc.exists ? doc.data() : null;
}

async function startNewRound(roundNumber) {
  const db = getDb();
  console.log(`[Engine] Starting round ${roundNumber}...`);
  const roundId = `round_${roundNumber}_${Date.now()}`;
  const endsAt = new Date(Date.now() + ROUND_DURATION_MS);

  const batch = db.batch();
  batch.set(db.collection('dream_stats').doc('currentRound'), {
    roundId, roundNumber,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    endsAt, currentPotSOL: 0,
  });

  const activeDreams = await db.collection('dreams')
    .where('isDeleted', '==', false).where('isRetired', '==', false).get();
  for (const doc of activeDreams.docs) batch.update(doc.ref, { recentBeliefs: 0 });

  await batch.commit();
  console.log(`[Engine] Round ${roundNumber} started. Ends: ${endsAt.toISOString()}`);
}

async function distributeBelievers(dreamId, roundId, pot, payouts) {
  const db = getDb();
  try {
    const snap = await db.collection('dream_beliefs_log')
      .where('dreamId', '==', dreamId).where('roundId', '==', roundId).get();
    const wallets = [...new Set(snap.docs.map(d => d.data().walletAddress))];
    if (!wallets.length || pot < 0.0001) return;
    const share = pot / wallets.length;
    const batch = db.batch();
    for (const wallet of wallets) {
      payouts[wallet] = (payouts[wallet] || 0) + share;
      const uSnap = await db.collection('dream_users').where('walletAddress', '==', wallet).limit(1).get();
      if (!uSnap.empty) batch.update(uSnap.docs[0].ref, { badges: admin.firestore.FieldValue.arrayUnion('kingmaker') });
    }
    await batch.commit();
    console.log(`[Engine] Splitting ${pot.toFixed(4)} SOL among ${wallets.length} believers`);
  } catch (err) {
    console.error('[Engine] distributeBelievers error:', err.message);
  }
}

async function closeRound(round) {
  const db = getDb();
  console.log(`[Engine] Closing round ${round.roundNumber}...`);
  try {
    const dreamsSnap = await db.collection('dreams')
      .where('isDeleted', '==', false).where('isRetired', '==', false)
      .where('state', 'in', ['alive', 'fading', 'resurrected'])
      .orderBy('beliefCount', 'desc').limit(3).get();
    const topDreams = dreamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!topDreams.length) {
      console.log('[Engine] No dreams this round.');
      return startNewRound(round.roundNumber + 1);
    }

    const balance = await getCreatorBalance();
    const pot = Math.max(0, balance - GAS_RESERVE);
    const payouts = {};
    const winners = {};

    if (pot > 0.001) {
      payouts[topDreams[0].walletAddress] = (payouts[topDreams[0].walletAddress] || 0) + pot * 0.5;
      if (topDreams[1]) payouts[topDreams[1].walletAddress] = (payouts[topDreams[1].walletAddress] || 0) + pot * 0.1;
      if (topDreams[2]) payouts[topDreams[2].walletAddress] = (payouts[topDreams[2].walletAddress] || 0) + pot * 0.1;
      await distributeBelievers(topDreams[0].id, round.roundId, pot * 0.3, payouts);
    }

    const places = ['first', 'second', 'third'];
    topDreams.forEach((d, i) => {
      winners[places[i]] = { dreamId: d.id, userId: d.userId, walletAddress: d.walletAddress, solPaid: payouts[d.walletAddress] || 0, beliefCount: d.beliefCount };
    });

    if (pot > 0.001) {
      for (const [wallet, amount] of Object.entries(payouts)) {
        if (amount > 0.0001) {
          try {
            const sig = await sendSOL(wallet, amount);
            console.log(`[Engine] Paid ${amount.toFixed(4)} SOL → ${wallet} (${sig})`);
          } catch (err) {
            console.error(`[Engine] Payout failed for ${wallet}:`, err.message);
          }
        }
      }
    }

    const batch = db.batch();
    const placeLabels = ['first', 'second', 'third'];
    topDreams.forEach((d, i) => {
      batch.update(db.collection('dreams').doc(d.id), {
        isRetired: true, state: 'crowned', winningRound: round.roundId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.set(db.collection('dream_winners').doc(`${round.roundId}_${d.id}`), {
        dreamId: d.id, userId: d.userId, walletAddress: d.walletAddress,
        username: d.username, title: d.title, story: d.story, mood: d.mood,
        beliefCount: d.beliefCount, roundId: round.roundId, roundNumber: round.roundNumber,
        solWon: payouts[d.walletAddress] || 0, place: i + 1,
        wonAt: admin.firestore.FieldValue.serverTimestamp(), fulfillmentProof: '',
      });
      batch.update(db.collection('dream_users').doc(d.userId), {
        badges: admin.firestore.FieldValue.arrayUnion('funded'),
        roundsWon: admin.firestore.FieldValue.increment(1),
      });
    });
    batch.set(db.collection('dream_rounds').doc(round.roundId), {
      roundId: round.roundId, roundNumber: round.roundNumber,
      startedAt: round.startedAt, endsAt: round.endsAt,
      status: 'closed', potSOL: pot, winners,
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(db.collection('dream_stats').doc('global'), {
      totalSOLDistributed: admin.firestore.FieldValue.increment(pot),
      totalDreamsFunded: admin.firestore.FieldValue.increment(topDreams.length),
      totalRoundsCompleted: admin.firestore.FieldValue.increment(1),
    }, { merge: true });

    await batch.commit();
    console.log(`[Engine] Round ${round.roundNumber} complete.`);
    return startNewRound(round.roundNumber + 1);
  } catch (err) {
    console.error('[Engine] closeRound error:', err);
    setTimeout(() => startNewRound(round.roundNumber + 1), 5000);
  }
}

async function roundLoop() {
  try {
    const round = await getCurrentRound();
    if (!round) { await startNewRound(1); return; }
    const endsAt = round.endsAt?.toDate ? round.endsAt.toDate() : new Date(round.endsAt);
    if (Date.now() >= endsAt.getTime()) await closeRound(round);
  } catch (err) { console.error('[Engine] roundLoop error:', err.message); }
}

async function holderMonitorLoop() {
  const db = getDb();
  try {
    const snap = await db.collection('dreams')
      .where('isDeleted', '==', false).where('isRetired', '==', false).get();
    for (const doc of snap.docs) {
      const dream = doc.data();
      const holding = await checkHolding(dream.walletAddress);
      let newState = dream.state;
      if (!holding.qualified) newState = 'grey';
      else if (dream.state === 'grey') newState = 'resurrected';
      else if (dream.state !== 'crowned') newState = 'alive';
      if (newState !== dream.state) {
        await doc.ref.update({ state: newState, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        const uSnap = await db.collection('dream_users').where('userId', '==', dream.userId).limit(1).get();
        if (!uSnap.empty) {
          const status = holding.qualified ? (dream.state === 'grey' ? 'resurrected' : 'active') : 'faded';
          const upd = { holderStatus: status };
          if (status === 'faded') { upd.neverSoldStreak = 0; upd.badges = admin.firestore.FieldValue.arrayUnion('faded'); }
          if (status === 'resurrected') upd.badges = admin.firestore.FieldValue.arrayUnion('resurrected');
          await uSnap.docs[0].ref.update(upd);
        }
        console.log(`[Engine] Dream ${dream.dreamId}: ${dream.state} → ${newState}`);
      }
    }
  } catch (err) { console.error('[Engine] holderMonitorLoop error:', err.message); }
}

async function balanceLoop() {
  const db = getDb();
  try {
    const bal = await getCreatorBalance();
    await db.collection('dream_stats').doc('currentRound')
      .update({ currentPotSOL: Math.max(0, bal - GAS_RESERVE) })
      .catch(() => {});
  } catch (err) { console.error('[Engine] balanceLoop error:', err.message); }
}

console.log('🔮 Round Engine starting...');
roundLoop();
balanceLoop();
setInterval(roundLoop, 10000);
setInterval(holderMonitorLoop, 300000);
setInterval(balanceLoop, 15000);
