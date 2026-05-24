const admin = require('firebase-admin');
const { checkHolding } = require('../services/solana');
const { getDb } = require('../services/firebase');

const HOLD_TIME_MS = 30 * 60 * 1000;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function requireHolder(req, res, next) {
  const { walletAddress, holderStatus, lastHolderCheck, firstQualifiedAt, userId } = req.user;

  if (firstQualifiedAt) {
    const qualMs = firstQualifiedAt._seconds
      ? firstQualifiedAt._seconds * 1000
      : (firstQualifiedAt.toMillis ? firstQualifiedAt.toMillis() : new Date(firstQualifiedAt).getTime());
    const elapsed = Date.now() - qualMs;
    if (elapsed < HOLD_TIME_MS) {
      const minutesLeft = Math.ceil((HOLD_TIME_MS - elapsed) / 60000);
      return res.status(403).json({
        error: `Hold time protection active. ${minutesLeft} more minute(s) before actions unlock.`,
        holdTimeRequired: true,
        minutesLeft,
      });
    }
  }

  const lastCheckMs = lastHolderCheck
    ? (lastHolderCheck._seconds
        ? lastHolderCheck._seconds * 1000
        : (lastHolderCheck.toMillis ? lastHolderCheck.toMillis() : new Date(lastHolderCheck).getTime()))
    : 0;

  if (Date.now() - lastCheckMs > CACHE_TTL_MS) {
    const holding = await checkHolding(walletAddress);
    const db = getDb();
    const newStatus = holding.qualified
      ? holderStatus === 'faded' ? 'resurrected' : 'active'
      : 'faded';
    await db.collection('dream_users').doc(userId).update({
      tokenBalance: holding.tokenBalance,
      solValue: holding.solValue,
      holderStatus: newStatus,
      lastHolderCheck: admin.firestore.FieldValue.serverTimestamp(),
    });
    if (!holding.qualified) {
      return res.status(403).json({ error: 'Insufficient token holdings. Must hold ≥ 1 SOL worth.', faded: true });
    }
    req.user.tokenBalance = holding.tokenBalance;
    req.user.solValue = holding.solValue;
    req.user.holderStatus = newStatus;
  } else if (holderStatus === 'faded') {
    return res.status(403).json({ error: 'Account faded. Restore token holdings to resume.', faded: true });
  }

  next();
}

module.exports = { requireHolder };
