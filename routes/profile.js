const express = require('express');
const admin = require('firebase-admin');
const { getDb } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const db = getDb();
    const snap = await db.collection('dream_users').where('walletAddress', '==', wallet).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Profile not found' });

    const user = snap.docs[0].data();
    const dreamsSnap = await db.collection('dreams')
      .where('walletAddress', '==', wallet)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    res.json({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      profilePicUrl: user.profilePicUrl,
      walletShort: user.walletAddress.slice(0, 4) + '...' + user.walletAddress.slice(-4),
      holderStatus: user.holderStatus,
      neverSoldStreak: user.neverSoldStreak || 0,
      roundsParticipated: user.roundsParticipated || 0,
      roundsWon: user.roundsWon || 0,
      totalBeliefsGiven: user.totalBeliefsGiven || 0,
      badges: user.badges || [],
      dreams: dreamsSnap.docs.map(d => ({
        id: d.id, title: d.data().title, story: d.data().story, mood: d.data().mood,
        state: d.data().state, beliefCount: d.data().beliefCount,
        createdAt: d.data().createdAt, isRetired: d.data().isRetired,
        winningRound: d.data().winningRound,
      })),
    });
  } catch (err) {
    console.error('[Profile] get error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const { displayName, profilePicUrl } = req.body;
    const { userId } = req.user;
    const db = getDb();
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (displayName !== undefined) {
      if (displayName.length > 50) return res.status(400).json({ error: 'Display name max 50 chars' });
      updates.displayName = displayName.trim();
    }
    if (profilePicUrl !== undefined) updates.profilePicUrl = profilePicUrl;
    await db.collection('dream_users').doc(userId).update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error('[Profile] update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
