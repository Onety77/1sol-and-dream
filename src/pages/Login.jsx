import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      navigate('/dreamboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 20px 40px',
      position: 'relative',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191,95,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #FFD700 0%, #FF9900 60%, #BF5FFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 900, color: '#030308',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 0 32px rgba(255,215,0,0.35)',
          }}>1</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '0.85rem',
            fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text)',
          }}>1 SOL AND A DREAM</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 6, fontSize: '0.85rem' }}>
            Welcome back, dreamer.
          </p>
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
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)',
          }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="input-label">Username</label>
              <input
                className="input"
                placeholder="your_username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                required autoFocus
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,31,90,0.08)',
                border: '1px solid rgba(255,31,90,0.25)',
                borderRadius: 'var(--r-md)', padding: '10px 14px',
                fontSize: '0.82rem', color: 'var(--fading)',
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#030308', animation: 'spin 0.7s linear infinite' }} />
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.84rem', color: 'var(--text-3)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--gold)', fontWeight: 600 }}>Join the dream</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
