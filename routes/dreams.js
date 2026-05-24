const express = require('express');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const { getDb } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');
const { requireHolder } = require('../middleware/holderCheck');

const router = express.Router();
const VALID_MOODS = ['Serious', 'Funny', 'Delusional', 'Beautiful', 'Degenerate', 'Impossible', 'Unfinished'];

router.get('/', async (req, res) => {
  try {
    const { filter, limit = 50 } = req.query;
    const db = getDb();
    let query = db.collection('dreams').where('isDeleted', '==', false).where('isRetired', '==', false);
    if (filter === 'fading') {
      query = query.where('state', 'in', ['fading', 'grey']);
    } else if (filter === 'new') {
      query = query.orderBy('createdAt', 'desc');
    } else if (filter === 'rising') {
      query = query.orderBy('recentBeliefs', 'desc');
    } else {
      query = query.orderBy('beliefCount', 'desc');
    }
    const snap = await query.limit(parseInt(limit)).get();
    res.json({ dreams: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error('[Dreams] list error:', err);
    res.status(500).json({ error: 'Failed to fetch dreams' });
  }
});

router.get('/top', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('dreams')
      .where('isDeleted', '==', false)
      .where('isRetired', '==', false)
      .where('state', 'in', ['alive', 'fading', 'resurrected'])
      .orderBy('beliefCount', 'desc')
      .limit(10)
      .get();
    res.json({ dreams: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error('[Dreams] top error:', err);
    res.status(500).json({ error: 'Failed to fetch top dreams' });
  }
});

router.get('/hall', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('dream_winners').orderBy('wonAt', 'desc').limit(50).get();
    res.json({ winners: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error('[Dreams] hall error:', err);
    res.status(500).json({ error: 'Failed to fetch hall of dreams' });
  }
});

router.get('/graveyard', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('dreams')
      .where('state', 'in', ['grey', 'resurrected'])
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();
    res.json({ dreams: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error('[Dreams] graveyard error:', err);
    res.status(500).json({ error: 'Failed to fetch graveyard' });
  }
});

router.post('/', requireAuth, requireHolder, async (req, res) => {
  try {
    const { title, story, mood, proofImageUrl, proofLink } = req.body;
    const { userId, walletAddress, username } = req.user;

    if (!title || !story || !mood) {
      return res.status(400).json({ error: 'Title, story, and mood are required' });
    }
    if (title.trim().split(/\s+/).length > 20) {
      return res.status(400).json({ error: 'Title must be 20 words or fewer' });
    }
    if (story.length > 280) {
      return res.status(400).json({ error: 'Story must be 280 characters or fewer' });
    }
    if (!VALID_MOODS.includes(mood)) {
      return res.status(400).json({ error: `Mood must be one of: ${VALID_MOODS.join(', ')}` });
    }

    const db = getDb();
    const roundDoc = await db.collection('dream_stats').doc('currentRound').get();
    if (!roundDoc.exists) {
      return res.status(503).json({ error: 'No active round. Please wait.' });
    }
    const { roundId } = roundDoc.data();

    const existingSnap = await db.collection('dreams')
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .where('isRetired', '==', false)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return res.status(409).json({ error: 'You already have an active dream. Delete it first.' });
    }

    const dreamId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const titleLockedAt = new Date(Date.now() + 30 * 60 * 1000);

    const dreamData = {
      dreamId, userId, walletAddress, username,
      title: title.trim(), story: story.trim(), mood,
      proofImageUrl: proofImageUrl || '', proofLink: proofLink || '',
      state: 'alive', beliefCount: 0, recentBeliefs: 0,
      roundId, isRetired: false, isDeleted: false, deleteCount: 0,
      titleLockedAt, winningRound: null,
      boosts: { spotlight: null, colorBurst: null, megaphone: null },
      createdAt: now, updatedAt: now,
    };

    await db.collection('dreams').doc(dreamId).set(dreamData);
    await db.collection('dream_stats').doc('global').set(
      { totalDreams: admin.firestore.FieldValue.increment(1) },
      { merge: true }
    );

    res.status(201).json({ dream: { id: dreamId, ...dreamData } });
  } catch (err) {
    console.error('[Dreams] post error:', err);
    res.status(500).json({ error: 'Failed to post dream' });
  }
});

router.put('/:id', requireAuth, requireHolder, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, story, mood, proofImageUrl, proofLink } = req.body;
    const { userId } = req.user;
    const db = getDb();
    const dreamRef = db.collection('dreams').doc(id);
    const dreamDoc = await dreamRef.get();

    if (!dreamDoc.exists) return res.status(404).json({ error: 'Dream not found' });
    const dream = dreamDoc.data();
    if (dream.userId !== userId) return res.status(403).json({ error: 'Not your dream' });
    if (dream.isDeleted) return res.status(400).json({ error: 'Dream is deleted' });

    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    if (title !== undefined) {
      const lockTime = dream.titleLockedAt?.toDate ? dream.titleLockedAt.toDate() : new Date(dream.titleLockedAt);
      if (new Date() > lockTime) return res.status(400).json({ error: 'Title locked after 30 minutes' });
      if (title.trim().split(/\s+/).length > 20) return res.status(400).json({ error: 'Title: 20 words max' });
      updates.title = title.trim();
    }
    if (story !== undefined) {
      if (story.length > 280) return res.status(400).json({ error: 'Story: 280 chars max' });
      updates.story = story.trim();
    }
    if (mood !== undefined) {
      if (!VALID_MOODS.includes(mood)) return res.status(400).json({ error: 'Invalid mood' });
      updates.mood = mood;
    }
    if (proofImageUrl !== undefined) updates.proofImageUrl = proofImageUrl;
    if (proofLink !== undefined) updates.proofLink = proofLink;

    await dreamRef.update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error('[Dreams] edit error:', err);
    res.status(500).json({ error: 'Failed to edit dream' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const db = getDb();
    const dreamRef = db.collection('dreams').doc(id);
    const dreamDoc = await dreamRef.get();

    if (!dreamDoc.exists) return res.status(404).json({ error: 'Dream not found' });
    const dream = dreamDoc.data();
    if (dream.userId !== userId) return res.status(403).json({ error: 'Not your dream' });
    if (dream.isDeleted) return res.status(400).json({ error: 'Already deleted' });
    if (dream.deleteCount >= 1) return res.status(400).json({ error: 'Can only delete once per round' });

    const batch = db.batch();
    batch.update(dreamRef, {
      isDeleted: true,
      deleteCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const beliefsSnap = await db.collection('dream_beliefs_log')
      .where('dreamId', '==', id)
      .where('roundId', '==', dream.roundId)
      .where('isFree', '==', true)
      .get();

    const returnMap = {};
    for (const doc of beliefsSnap.docs) {
      const { userId: bid, roundId } = doc.data();
      const key = `${roundId}_${bid}`;
      returnMap[key] = (returnMap[key] || 0) + 1;
    }
    for (const [key, count] of Object.entries(returnMap)) {
      batch.update(db.collection('dream_beliefs').doc(key), {
        returnedBeliefs: admin.firestore.FieldValue.increment(count),
      });
    }

    await batch.commit();
    res.json({ success: true, message: 'Dream deleted. Free beliefs returned.' });
  } catch (err) {
    console.error('[Dreams] delete error:', err);
    res.status(500).json({ error: 'Failed to delete dream' });
  }
});

module.exports = router;
