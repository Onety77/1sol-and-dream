require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initFirebase } = require('./services/firebase');

initFirebase();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many auth attempts.' } });

app.use('/api', limiter);

const authRouter = require('./routes/auth');
const dreamsRouter = require('./routes/dreams');
const beliefsRouter = require('./routes/beliefs');
const profileRouter = require('./routes/profile');
const walletRouter = require('./routes/wallet');

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/me', authRouter);
app.use('/api/dreams', dreamsRouter);
app.use('/api/beliefs', beliefsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/verify-wallet', walletRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 1 SOL and a Dream API on port ${PORT}`));
