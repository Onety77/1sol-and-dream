import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dreams as dreamsApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const MOOD_EMOJI = { Serious: '🎯', Funny: '😂', Delusional: '🌀', Beautiful: '✨', Degenerate: '🔥', Impossible: '🚀', Unfinished: '⏳' };

function GraveCard({ dream, i }) {
  const isResurrected = dream.state === 'resurrected';
  const updatedAt = dream.updatedAt?.seconds
    ? new Date(dream.updatedAt.seconds * 1000)
    : dream.updatedAt?.toDate ? dream.updatedAt.toDate() : new Date();

  const stripeRgb   = isResurrected ? '191,95,255' : '58,58,90';
  const stripeAlpha = isResurrected ? 0.65 : 0.12;

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '16px 18px 14px 16px',
        borderRadius: 0,
        background: isResurrected ? 'rgba(191,95,255,0.04)' : 'rgba(4,4,10,0.75)',
        borderLeft: `3px solid rgba(${stripeRgb},${stripeAlpha})`,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: isResurrected
          ? '-5px 0 22px rgba(191,95,255,0.1), 0 5px 20px rgba(0,0,0,0.45)'
          : '0 4px 16px rgba(0,0,0,0.5)',
        animation: `fade-up 0.45s ease-out ${i * 0.04}s both`,
        filter: isResurrected ? 'none' : 'grayscale(65%) brightness(0.62)',
        transition: 'filter 0.3s, transform 0.22s, box-shadow 0.22s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        if (!isResurrected) e.currentTarget.style.filter = 'grayscale(35%) brightness(0.82)';
        if (isResurrected) e.currentTarget.style.boxShadow = '-7px 0 32px rgba(191,95,255,0.18), 0 8px 28px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.filter = isResurrected ? 'none' : 'grayscale(65%) brightness(0.62)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Corner cut */}
      <div style={{
        position: 'absolute', bottom: -1, right: -1, width: 16, height: 16,
        background: 'var(--void)',
        clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
        zIndex: 10, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: isResurrected ? 'var(--resurrected)' : 'var(--text-3)',
            textShadow: isResurrected ? '0 0 10px rgba(191,95,255,0.6)' : 'none',
          }}>
            {isResurrected ? '⚡ Resurrected' : '✕ Faded'}
          </span>
          {dream.mood && (
            <span className={`tag mood-${dream.mood}`} style={{ fontSize: '0.6rem', opacity: isResurrected ? 1 : 0.35 }}>
              {MOOD_EMOJI[dream.mood]} {dream.mood}
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)', flexShrink: 0 }}>
          {formatDistanceToNow(updatedAt, { addSuffix: true })}
        </span>
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.28,
        color: isResurrected ? 'var(--resurrected)' : 'var(--text-3)',
        zIndex: 1,
      }}>{dream.title}</h3>

      <p style={{
        fontSize: '0.76rem', lineHeight: 1.55, zIndex: 1,
        color: isResurrected ? 'var(--text-2)' : 'var(--text-3)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        opacity: isResurrected ? 1 : 0.6,
      }}>{dream.story}</p>

      {/* Perforated divider */}
      <div style={{
        borderTop: `1px dashed rgba(${stripeRgb},${isResurrected ? 0.2 : 0.06})`,
        margin: '0 -2px', zIndex: 1,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <Link to={`/profile/${dream.walletAddress}`} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem',
          color: isResurrected ? 'var(--text-3)' : 'rgba(100,100,140,0.5)',
          textDecoration: 'none',
        }}>
          <div style={{
            width: 13, height: 13, borderRadius: '50%',
            background: isResurrected
              ? `linear-gradient(135deg, hsl(${(dream.walletAddress?.charCodeAt(0)||0)*7%360},65%,55%), hsl(${(dream.walletAddress?.charCodeAt(2)||0)*11%360},65%,45%))`
              : 'rgba(58,58,90,0.4)',
          }} />
          @{dream.username}
        </Link>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: isResurrected ? 'var(--resurrected)' : 'rgba(58,58,90,0.5)',
        }}>★ {dream.beliefCount || 0}</span>
      </div>
    </div>
  );
}

export default function Graveyard() {
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dreamsApi.graveyard().then(d => { setDreams(d.dreams || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? dreams.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()) || d.username?.toLowerCase().includes(search.toLowerCase()))
    : dreams;

  const faded = filtered.filter(d => d.state === 'grey');
  const resurrected = filtered.filter(d => d.state === 'resurrected');

  return (
    <div style={{
      minHeight: '100vh', paddingTop: 72, paddingBottom: 100,
      background: 'linear-gradient(180deg, rgba(5,5,15,1) 0%, rgba(3,3,8,1) 100%)',
    }}>

      {/* Atmospheric header */}
      <div style={{
        padding: 'clamp(48px, 6vw, 72px) 0 44px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* fog glow at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: 120,
          background: 'radial-gradient(ellipse, rgba(191,95,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16, filter: 'grayscale(80%) brightness(0.5)' }}>🪦</div>
          <p className="section-label" style={{
            justifyContent: 'center', display: 'flex', marginBottom: 8,
            color: '#2A2A4A',
          }}>The Forgotten</p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800,
            color: '#3A3A5A', letterSpacing: '-0.03em',
          }}>The Graveyard</h1>
          <p style={{
            color: '#1E1E38', marginTop: 10, fontSize: '0.85rem',
            maxWidth: 420, margin: '10px auto 0', lineHeight: 1.6,
          }}>
            Dreams that lost color when their dreamers sold. Some found their way back. Most haven't.
          </p>

          {/* Search */}
          <div style={{ marginTop: 28, maxWidth: 360, margin: '28px auto 0' }}>
            <input
              className="input"
              placeholder="Search faded dreams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'rgba(10,10,25,0.8)',
                borderColor: 'rgba(255,255,255,0.04)',
                color: '#4A4A6A',
              }}
            />
          </div>

          {/* Counts */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#2A2A4A' }}>
              <span style={{ color: '#3A3A5A', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{faded.length}</span> faded
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
              <span style={{ color: 'var(--resurrected)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{resurrected.length}</span> resurrected
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 48 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--r-lg)', opacity: 0.3 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1rem',
              color: '#2A2A4A', letterSpacing: '-0.01em',
            }}>
              {search ? 'No matching faded dreams.' : 'The graveyard is empty. For now.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {resurrected.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                    color: 'var(--resurrected)', letterSpacing: '0.15em', textTransform: 'uppercase',
                  }}>⚡ They came back</p>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(191,95,255,0.2), transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {resurrected.map((d, i) => <GraveCard key={d.id} dream={d} i={i} />)}
                </div>
              </div>
            )}

            {faded.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                    color: '#2A2A4A', letterSpacing: '0.15em', textTransform: 'uppercase',
                  }}>✕ Still grey</p>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.03)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {faded.map((d, i) => <GraveCard key={d.id} dream={d} i={i} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
