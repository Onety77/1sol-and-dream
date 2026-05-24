const express = require('express');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const { getDb } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');
const { requireHolder } = require('../middleware/holderCheck');

const router = express.Router();
const FREE_BELIEFS = 3;
const MAX_BELIEFS = 6;
const LOCK_MS = 60 * 60 * 1000;

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const db = getDb();
    const roundDoc = await db.collection('dream_stats').doc('currentRound').get();
    if (!roundDoc.exists) return res.json({ beliefs: [], remaining: FREE_BELIEFS, total: 0 });
    const { roundId } = roundDoc.data();
    const doc = await db.collection('dream_beliefs').doc(`${roundId}_${userId}`).get();
    if (!doc.exists) return res.json({ beliefs: [], lockedBeliefs: [], timestamps: {}, total: 0, remaining: FREE_BELIEFS, purchasedBeliefs: 0 });
    const data = doc.data();
    const available = Math.min(MAX_BELIEFS, FREE_BELIEFS + (data.returnedBeliefs || 0) + (data.purchasedBeliefs || 0));
    res.json({
      beliefs: data.dreamIds || [],
      lockedBeliefs: data.lockedDreamIds || [],
      timestamps: data.beliefTimestamps || {},
      total: data.totalBeliefs || 0,
      remaining: Math.max(0, available - (data.totalBeliefs || 0)),
      purchasedBeliefs: data.purchasedBeliefs || 0,
    });
  } catch (err) {
    console.error('[Beliefs] me error:', err);
    res.status(500).json({ error: 'Failed to get beliefs' });
  }
});

router.post('/:dreamId', requireAuth, requireHolder, async (req, res) => {
  try {
    const { dreamId } = req.params;
    const { userId, walletAddress } = req.user;
    const db = getDb();

    const roundDoc = await db.collection('dream_stats').doc('currentRound').get();
    if (!roundDoc.exists) return res.status(503).json({ error: 'No active round' });
    const { roundId } = roundDoc.data();

    const dreamDoc = await db.collection('dreams').doc(dreamId).get();
    if (!dreamDoc.exists || dreamDoc.data().isDeleted) return res.status(404).json({ error: 'Dream not found' });
    const dream = dreamDoc.data();

    if (dream.userId === userId) return res.status(400).json({ error: "Can't believe in your own dream" });
    if (['grey'].includes(dream.state)) return res.status(400).json({ error: 'Dream is faded — cannot receive beliefs' });

    const beliefRef = db.collection('dream_beliefs').doc(`${roundId}_${userId}`);
    const beliefDoc = await beliefRef.get();
    const bs = beliefDoc.exists ? beliefDoc.data() : {
      roundId, userId, walletAddress, dreamIds: [], lockedDreamIds: [],
      beliefTimestamps: {}, totalBeliefs: 0, purchasedBeliefs: 0, returnedBeliefs: 0,
    };

    if (bs.dreamIds.includes(dreamId)) return res.status(400).json({ error: 'Already believed in this dream' });
    if (bs.totalBeliefs >= MAX_BELIEFS) return res.status(400).json({ error: `Max ${MAX_BELIEFS} beliefs per round` });

    const available = Math.min(MAX_BELIEFS, FREE_BELIEFS + (bs.returnedBeliefs || 0) + (bs.purchasedBeliefs || 0));
    if (bs.totalBeliefs >= available) {
      return res.status(400).json({ error: 'No beliefs remaining. Purchase more with project tokens.', canPurchase: bs.totalBeliefs < MAX_BELIEFS });
    }

    const isFree = bs.totalBeliefs < (FREE_BELIEFS + (bs.returnedBeliefs || 0));
    const now = Date.now();
    const batch = db.batch();

    const update = {
      dreamIds: admin.firestore.FieldValue.arrayUnion(dreamId),
      [`beliefTimestamps.${dreamId}`]: now,
      totalBeliefs: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    beliefDoc.exists ? batch.update(beliefRef, update) : batch.set(beliefRef, { ...bs, ...update, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    batch.set(db.collection('dream_beliefs_log').doc(uuidv4()), {
      roundId, userId, walletAddress, dreamId, isFree,
      placedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.update(db.collection('dreams').doc(dreamId), {
      beliefCount: admin.firestore.FieldValue.increment(1),
      recentBeliefs: admin.firestore.FieldValue.increment(1),
    });
    batch.set(db.collection('dream_stats').doc('global'), {
      totalBeliefsPlaced: admin.firestore.FieldValue.increment(1),
    }, { merge: true });

    await batch.commit();
    await db.collection('dream_users').doc(userId).update({
      totalBeliefsGiven: admin.firestore.FieldValue.increment(1),
    });

    const newTotal = (bs.totalBeliefs || 0) + 1;
    res.json({ success: true, total: newTotal, remaining: Math.max(0, available - newTotal) });
  } catch (err) {
    console.error('[Beliefs] place error:', err);
    res.status(500).json({ error: 'Failed to place belief' });
  }
});

router.delete('/:dreamId', requireAuth, async (req, res) => {
  try {
    const { dreamId } = req.params;
    const { userId } = req.user;
    const db = getDb();

    const roundDoc = await db.collection('dream_stats').doc('currentRound').get();
    if (!roundDoc.exists) return res.status(503).json({ error: 'No active round' });
    const { roundId } = roundDoc.data();

    const beliefRef = db.collection('dream_beliefs').doc(`${roundId}_${userId}`);
    const beliefDoc = await beliefRef.get();
    if (!beliefDoc.exists || !beliefDoc.data().dreamIds.includes(dreamId)) {
      return res.status(404).json({ error: 'Belief not found' });
    }
    const bs = beliefDoc.data();

    if (bs.lockedDreamIds?.includes(dreamId)) return res.status(400).json({ error: 'Belief locked after 1 hour' });
    const placed = bs.beliefTimestamps?.[dreamId] || 0;
    if (Date.now() - placed > LOCK_MS) {
      await beliefRef.update({ lockedDreamIds: admin.firestore.FieldValue.arrayUnion(dreamId) });
      return res.status(400).json({ error: 'Belief locked after 1 hour' });
    }

    const batch = db.batch();
    batch.update(beliefRef, { dreamIds: admin.firestore.FieldValue.arrayRemove(dreamId), totalBeliefs: admin.firestore.FieldValue.increment(-1) });
    batch.update(db.collection('dreams').doc(dreamId), { beliefCount: admin.firestore.FieldValue.increment(-1), recentBeliefs: admin.firestore.FieldValue.increment(-1) });
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('[Beliefs] remove error:', err);
    res.status(500).json({ error: 'Failed to remove belief' });
  }
});

module.exports = router;
