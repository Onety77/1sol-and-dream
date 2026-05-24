import { Link } from 'react-router-dom';
import { beliefs as beliefApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useState, useRef } from 'react';

const STATE_META = {
  alive:       { label: 'Alive',       icon: '◉', color: '#00FFD1', rgb: '0,255,209' },
  fading:      { label: 'Fading',      icon: '⚠', color: '#FF1F5A', rgb: '255,31,90' },
  grey:        { label: 'Faded',       icon: '✕', color: '#3A3A5A', rgb: '58,58,90' },
  resurrected: { label: 'Resurrected', icon: '⚡', color: '#BF5FFF', rgb: '191,95,255' },
  crowned:     { label: 'Crowned',     icon: '♛', color: '#FFD700', rgb: '255,215,0' },
};

const MOOD_EMOJI = {
  Serious: '🎯', Funny: '😂', Delusional: '🌀', Beautiful: '✨',
  Degenerate: '🔥', Impossible: '🚀', Unfinished: '⏳',
};

const RANK_COLOR = { 1: '#FFD700', 2: '#C0C0D0', 3: '#CD7F32' };

export default function DreamCard({ dream, myBeliefs = [], onBelief, rank, compact = false }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [localCount, setLocalCount] = useState(dream.beliefCount || 0);
  const [believed, setBelieved] = useState(myBeliefs.includes(dream.id));
  const [hovered, setHovered] = useState(false);

  const state      = dream.state || 'alive';
  const meta       = STATE_META[state] || STATE_META.alive;
  const isOwn      = user?.userId === dream.userId;
  const canBelieve = user && !isOwn && !believed && state !== 'grey';
  const isGrey     = state === 'grey';

  const glowLevel  = Math.min(localCount, 40) / 40;
  const stripeGlow = 8 + glowLevel * 20;

  const handleBelieve = async e => {
    e.preventDefault();
    if (!user || believed || loading) return;
    setLoading(true);
    try {
      await beliefApi.place(dream.id);
      setBelieved(true);
      setLocalCount(c => c + 1);
      onBelief?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to place belief');
    } finally { setLoading(false); }
  };

  const dim = isGrey ? 'grayscale(75%) brightness(0.5)' : 'none';

  /* ── COMPACT strip (Arena #4+) ─────────────────────────────────── */
  if (compact) {
    return (
      <div
        style={{
          display: 'flex', gap: 0, alignItems: 'stretch',
          borderBottom: '1px solid rgba(255,255,255,0.045)',
          background: hovered ? `rgba(${meta.rgb},0.028)` : 'transparent',
          transition: 'background 0.18s',
          filter: dim,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* State stripe */}
        <div style={{
          width: 3, flexShrink: 0,
          background: `rgba(${meta.rgb},${isGrey ? 0.1 : 0.65 + glowLevel * 0.28})`,
          boxShadow: isGrey ? 'none' : `0 0 ${stripeGlow}px rgba(${meta.rgb},0.3)`,
        }} />

        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {rank !== undefined && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              color: RANK_COLOR[rank] || 'var(--text-3)',
              flexShrink: 0, minWidth: 22, letterSpacing: '0.06em',
            }}>#{rank}</span>
          )}
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700,
            color: state === 'crowned' ? 'var(--gold)' : isGrey ? 'var(--text-3)' : 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            lineHeight: 1.2,
          }}>{dream.title}</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderLeft: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem',
            color: localCount > 0 ? 'var(--gold)' : 'var(--text-3)',
          }}>{believed ? '★' : '☆'} {localCount}</span>
          {canBelieve && (
            <button onClick={handleBelieve} disabled={loading} className="btn btn-gold btn-sm"
              style={{ padding: '3px 9px', fontSize: '0.68rem' }}>
              {loading ? '···' : '+'}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── FULL list entry ──────────────────────────────────────────── */
  return (
    <div
      style={{
        display: 'flex', gap: 0, alignItems: 'stretch',
        borderBottom: '1px solid rgba(255,255,255,0.052)',
        background: hovered ? `rgba(${meta.rgb},0.03)` : 'transparent',
        transition: 'background 0.2s',
        filter: dim,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* State stripe */}
      <div style={{
        width: 3, flexShrink: 0,
        background: `rgba(${meta.rgb},${isGrey ? 0.09 : 0.6 + glowLevel * 0.3})`,
        boxShadow: isGrey ? 'none' : `0 0 ${stripeGlow}px rgba(${meta.rgb},0.35)`,
        transition: 'box-shadow 0.3s',
      }} />

      {/* Content */}
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Header: state label + mood + rank */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 700,
            color: meta.color, letterSpacing: '0.14em', textTransform: 'uppercase',
            textShadow: isGrey ? 'none' : `0 0 10px rgba(${meta.rgb},0.65)`,
          }}>{meta.icon} {meta.label}</span>
          <span className={`tag mood-${dream.mood}`} style={{ fontSize: '0.58rem' }}>
            {MOOD_EMOJI[dream.mood]} {dream.mood}
          </span>
          {rank !== undefined && rank <= 3 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
              color: RANK_COLOR[rank],
              textShadow: rank === 1 ? '0 0 12px rgba(255,215,0,0.5)' : 'none',
            }}>#{rank}</span>
          )}
          {rank !== undefined && rank > 3 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)' }}>
              #{rank}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(0.88rem, 1.4vw, 1rem)', lineHeight: 1.26,
          color: isGrey ? 'var(--text-3)' : state === 'crowned' ? 'var(--gold)' : 'var(--text)',
          textShadow: state === 'crowned' ? '0 0 20px rgba(255,215,0,0.22)' : 'none',
        }}>{dream.title}</h3>

        {/* Story */}
        <p style={{
          fontSize: '0.8rem', lineHeight: 1.64,
          color: isGrey ? 'var(--text-3)' : 'var(--text-2)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{dream.story}</p>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to={`/profile/${dream.walletAddress}`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)', fontSize: '0.7rem' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg,
                hsl(${((dream.walletAddress?.charCodeAt(0)||0)*7)%360},65%,55%),
                hsl(${((dream.walletAddress?.charCodeAt(2)||0)*11)%360},65%,45%))`,
            }} />
            @{dream.username}
          </Link>
          {(dream.proofImageUrl || dream.proofLink) && (
            <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>
              {dream.proofImageUrl ? '📸' : '🔗'}
            </span>
          )}
          {isGrey && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontStyle: 'italic', opacity: 0.5 }}>
              dreamer sold
            </span>
          )}
        </div>
      </div>

      {/* Right column: belief count + action */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4, padding: '18px 16px',
        borderLeft: '1px solid rgba(255,255,255,0.042)',
        flexShrink: 0, minWidth: 76,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1,
          fontSize: localCount >= 10 ? '1.65rem' : '1.4rem',
          color: localCount > 0 ? 'var(--gold)' : 'var(--text-3)',
          textShadow: localCount > 5 ? '0 0 26px rgba(255,215,0,0.55)' : 'none',
        }}>{believed ? '★' : '☆'} {localCount}</span>
        <span style={{
          fontSize: '0.46rem', color: 'var(--text-3)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.14em',
        }}>BELIEFS</span>

        {canBelieve && (
          <button onClick={handleBelieve} disabled={loading}
            className="btn btn-gold btn-sm"
            style={{ marginTop: 6, padding: '5px 12px', fontSize: '0.7rem' }}>
            {loading ? '···' : 'Believe'}
          </button>
        )}
        {believed && (
          <span style={{ marginTop: 4, fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700 }}>✓</span>
        )}
        {!canBelieve && !believed && !isOwn && !user && (
          <Link to="/signup" style={{ marginTop: 4, fontSize: '0.62rem', color: 'var(--text-3)' }}>Join →</Link>
        )}
      </div>
    </div>
  );
}
