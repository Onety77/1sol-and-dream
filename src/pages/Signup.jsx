import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { wallet as walletApi } from '../services/api';

const STEPS = ['Account', 'Wallet', 'Ready'];

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore(s => s.signup);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', walletAddress: '' });
  const [walletStatus, setWalletStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyWallet = async () => {
    if (!form.walletAddress) return;
    setVerifying(true); setError(''); setWalletStatus(null);
    try {
      const result = await walletApi.verify(form.walletAddress);
      setWalletStatus(result);
      if (result.qualified) setStep(2);
      else setError(`Need ≥ 1 SOL worth of tokens. Current value: ${result.solValue?.toFixed(4) || '0'} SOL`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify wallet');
    } finally { setVerifying(false); }
  };

  const handleSubmit = async () => {
    if (!walletStatus?.qualified) { setError('Please verify your wallet first'); return; }
    setSubmitting(true); setError('');
    try {
      await signup({ username: form.username, password: form.password, walletAddress: form.walletAddress });
      navigate('/dreamboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
      setStep(0);
    } finally { setSubmitting(false); }
  };

  const canStep0 = form.username.length >= 2
    && form.password.length >= 8
    && form.password === form.confirmPassword
    && /^[a-z0-9_]{2,24}$/.test(form.username);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 20px 40px',
      position: 'relative',
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 500, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,215,0,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #FFD700 0%, #FF9900 60%, #BF5FFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 900, color: '#030308', fontFamily: 'var(--font-display)',
            boxShadow: '0 0 28px rgba(255,215,0,0.35)',
          }}>1</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            JOIN THE DREAM
          </h1>
          <p style={{ color: 'var(--text-3)', marginTop: 6, fontSize: '0.84rem' }}>
            Hold the token. Post your dream. Win real SOL.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i < step
                    ? 'linear-gradient(135deg, var(--alive), #00D4B8)'
                    : i === step
                      ? 'linear-gradient(135deg, #FFD700, #FF9900)'
                      : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i === step ? 'rgba(255,215,0,0.4)' : i < step ? 'rgba(0,255,209,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: i <= step ? '#030308' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 700,
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: i === step ? '0 0 16px rgba(255,215,0,0.3)' : 'none',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.64rem', color: i === step ? 'var(--text)' : 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 48, height: 1, margin: '0 4px', marginTop: -16,
                  background: i < step ? 'rgba(0,255,209,0.3)' : 'rgba(255,255,255,0.06)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(13,13,40,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-xl)', padding: 'clamp(24px, 5vw, 36px)',
          backdropFilter: 'blur(24px) saturate(150%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.35), transparent)',
          }} />

          {/* Step 0: Account */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fade-up 0.3s ease-out' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Create your account
              </h2>

              <div>
                <label className="input-label">Username</label>
                <input
                  className="input"
                  placeholder="dream_hunter"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                  autoComplete="username" autoFocus
                />
                <p className="input-hint">Lowercase letters, numbers, underscores. 2–24 chars.</p>
                {form.username && !/^[a-z0-9_]{2,24}$/.test(form.username) && (
                  <p className="input-error">Invalid username format</p>
                )}
              </div>

              <div>
                <label className="input-label">Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password" />
                <p className="input-hint">Minimum 8 characters.</p>
              </div>

              <div>
                <label className="input-label">Confirm Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="input-error">Passwords don't match</p>
                )}
              </div>

              <button onClick={() => setStep(1)} disabled={!canStep0} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 1: Wallet */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fade-up 0.3s ease-out' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>
                  Connect your wallet
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                  No browser extension needed. Paste your Solana wallet address.
                  We verify your token holdings on-chain.
                </p>
              </div>

              <div style={{
                background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 'var(--r-md)', padding: '14px 16px',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>
                  ⚡ Requirement
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  Must hold ≥ 1 SOL worth of the project token. Wallet must have held for at least 30 minutes before actions unlock.
                </p>
              </div>

              <div>
                <label className="input-label">Solana Wallet Address</label>
                <textarea
                  className="input"
                  placeholder="Paste your Solana wallet address here..."
                  value={form.walletAddress}
                  onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value.trim() }))}
                  rows={2}
                  style={{ resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(255,31,90,0.08)', border: '1px solid rgba(255,31,90,0.25)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--fading)' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep(0); setError(''); }} className="btn btn-ghost" style={{ flex: 1 }}>← Back</button>
                <button onClick={handleVerifyWallet} disabled={!form.walletAddress || verifying} className="btn btn-primary" style={{ flex: 2 }}>
                  {verifying ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#030308', animation: 'spin 0.7s linear infinite' }} />
                      Verifying...
                    </span>
                  ) : 'Verify Wallet →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Ready */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fade-up 0.3s ease-out' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700 }}>
                Ready to dream?
              </h2>

              {walletStatus?.qualified && (
                <div style={{
                  background: 'rgba(0,255,209,0.06)', border: '1px solid rgba(0,255,209,0.2)',
                  borderRadius: 'var(--r-md)', padding: 16,
                }}>
                  <p style={{ color: 'var(--alive)', fontWeight: 700, marginBottom: 10, fontSize: '0.88rem' }}>✓ Wallet Verified</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.8rem' }}>
                    <div>
                      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>Token Balance</p>
                      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{walletStatus.tokenBalance?.toFixed(0) || 0} tokens</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>SOL Value</p>
                      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--alive)' }}>◎ {walletStatus.solValue?.toFixed(4) || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', padding: 14, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Username</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>@{form.username}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Wallet</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {form.walletAddress.slice(0, 6)}···{form.walletAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(255,31,90,0.08)', border: '1px solid rgba(255,31,90,0.25)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--fading)' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep(1); setError(''); }} className="btn btn-ghost" style={{ flex: 1 }}>← Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 2 }}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
                By joining, your wallet is permanently linked. One wallet per account.
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.84rem', color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
