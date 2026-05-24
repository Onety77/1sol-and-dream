const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const { getDb } = require('../services/firebase');
const { checkHolding } = require('../services/solana');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, password, walletAddress } = req.body;
    if (!username || !password || !walletAddress) {
      return res.status(400).json({ error: 'Username, password, and wallet address are required' });
    }
    if (!/^[a-z0-9_]{2,24}$/.test(username)) {
      return res.status(400).json({ error: 'Username: 2–24 chars, lowercase letters, numbers, underscores only' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    const db = getDb();

    const [usernameSnap, walletSnap] = await Promise.all([
      db.collection('dream_users').where('username', '==', username).limit(1).get(),
      db.collection('dream_users').where('walletAddress', '==', walletAddress).limit(1).get(),
    ]);
    if (!usernameSnap.empty) return res.status(409).json({ error: 'Username already taken' });
    if (!walletSnap.empty) return res.status(409).json({ error: 'Wallet already linked to an account' });

    const holding = await checkHolding(walletAddress);
    if (!holding.qualified) {
      return res.status(403).json({
        error: `Need ≥ 1 SOL worth of tokens. Current: ${holding.solValue.toFixed(4)} SOL`,
        solValue: holding.solValue,
        qualified: false,
      });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('dream_users').doc(userId).set({
      userId,
      username,
      passwordHash,
      walletAddress,
      displayName: username,
      profilePicUrl: '',
      holderStatus: 'active',
      neverSoldStreak: 0,
      roundsParticipated: 0,
      roundsWon: 0,
      totalBeliefsGiven: 0,
      badges: [],
      tokenBalance: holding.tokenBalance,
      solValue: holding.solValue,
      firstQualifiedAt: now,
      lastHolderCheck: now,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('dream_stats').doc('global').set(
      { totalUsers: admin.firestore.FieldValue.increment(1) },
      { merge: true }
    );

    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { userId, username, walletAddress, displayName: username, holderStatus: 'active', badges: [], tokenBalance: holding.tokenBalance, solValue: holding.solValue },
    });
  } catch (err) {
    console.error('[Auth] signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db = getDb();
    const snap = await db.collection('dream_users').where('username', '==', username).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'Invalid username or password' });

    const user = snap.docs[0].data();
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' });
    res.json({
      token,
      user: {
        userId: user.userId, username: user.username, walletAddress: user.walletAddress,
        displayName: user.displayName, profilePicUrl: user.profilePicUrl,
        holderStatus: user.holderStatus, badges: user.badges || [],
        tokenBalance: user.tokenBalance, solValue: user.solValue,
        neverSoldStreak: user.neverSoldStreak || 0, roundsParticipated: user.roundsParticipated || 0,
        roundsWon: user.roundsWon || 0, totalBeliefsGiven: user.totalBeliefsGiven || 0,
      },
    });
  } catch (err) {
    console.error('[Auth] login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    userId: u.userId, username: u.username, walletAddress: u.walletAddress,
    displayName: u.displayName, profilePicUrl: u.profilePicUrl,
    holderStatus: u.holderStatus, badges: u.badges || [],
    tokenBalance: u.tokenBalance, solValue: u.solValue,
    neverSoldStreak: u.neverSoldStreak || 0, roundsParticipated: u.roundsParticipated || 0,
    roundsWon: u.roundsWon || 0, totalBeliefsGiven: u.totalBeliefsGiven || 0,
  });
});

module.exports = router;
