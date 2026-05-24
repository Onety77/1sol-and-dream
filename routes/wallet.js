const express = require('express');
const { checkHolding } = require('../services/solana');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: 'Wallet address required' });
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address format' });
    }
    const result = await checkHolding(wallet);
    res.json(result);
  } catch (err) {
    console.error('[Wallet] verify error:', err);
    res.status(500).json({ error: 'Failed to verify wallet' });
  }
});

module.exports = router;
