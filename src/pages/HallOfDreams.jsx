import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dreams as dreamsApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const MOOD_EMOJI = { Serious: '🎯', Funny: '😂', Delusional: '🌀', Beautiful: '✨', Degenerate: '🔥', Impossible: '🚀', Unfinished: '⏳' };
const PLACE_LABELS = { 1: '♛ Champion', 2: '◈ Runner-Up', 3: '◇ Third Place' };
const PLACE_COLORS = { 1: 'var(--crowned)', 2: '#C0C0D0', 3: '#CD7F32' };

const PLACE_RGB = { 1: '255,215,0', 2: '200,200,224', 3: '205,127,50' };

function WinnerCard({ winner, i }) {
  const wonAt = winner.wonAt?.seconds
    ? new Date(winner.wonAt.seconds * 1000)
    : winner.wonAt?.toDate ? winner.wonAt.toDate() : new Date(winner.wonAt || Date.now());
  const isChampion = winner.place === 1;
  const placeColor = PLACE_COLORS[winner.place] || 'var(--text-2)';
  const placeRgb   = PLACE_RGB[winner.place] || '255,255,255';

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: 'clamp(18px, 3vw, 26px) 22px clamp(16px, 2.5vw, 22px) 20px',
        borderRadius: 0,
        cursor: 'default',
        background: isChampion
          ? 'rgba(255,215,0,0.04)'
          : 'rgba(255,255,255,0.03)',
        borderLeft: `3px solid rgba(${placeRgb},${isChampion ? 0.75 : 0.4})`,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: isChampion
          ? `-8px 0 36px rgba(255,215,0,0.14), 0 8px 28px rgba(0,0,0,0.45)`
          : `-4px 0 18px rgba(${placeRgb},0.08), 0 6px 24px rgba(0,0,0,0.4)`,
        animation: `fade-up 0.5s ease-out ${i * 0.06}s both`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isChampion
          ? '-10px 0 50px rgba(255,215,0,0.22), 0 12px 36px rgba(0,0,0,0.5)'
          : `-6px 0 28px rgba(${placeRgb},0.14), 0 10px 32px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Corner cut */}
      <div style={{
        position: 'absolute', bottom: -1, right: -1, width: 22, height: 22,
        background: 'var(--void)',
        clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* SOL won — big watermark */}
      <div style={{
        position: 'absolute', right: 28, bottom: 16,
        fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1,
        fontSize: '3.2rem',
        color: `rgba(${placeRgb},0.055)`,
        pointerEvents: 'none', userSelect: 'none',
      }}>◎{(winner.solWon || 0).toFixed(1)}</div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            color: placeColor, fontSize: '0.68rem', fontWeight: 700,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
            textShadow: isChampion ? '0 0 14px rgba(255,215,0,0.5)' : 'none',
          }}>
            {PLACE_LABELS[winner.place] || `#${winner.place}`}
          </span>
          {winner.mood && (
            <span className={`tag mood-${winner.mood}`} style={{ fontSize: '0.6rem' }}>
              {MOOD_EMOJI[winner.mood]} {winner.mood}
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-3)', flexShrink: 0 }}>
          RND #{winner.roundNumber}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(0.86rem, 1.5vw, 1rem)',
        fontWeight: 700, lineHeight: 1.28, zIndex: 1,
        color: isChampion ? 'var(--crowned)' : 'var(--text)',
        textShadow: isChampion ? '0 0 24px rgba(255,215,0,0.18)' : 'none',
      }}>{winner.title}</h3>

      {/* Story */}
      <p style={{
        fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.62, zIndex: 1,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{winner.story}</p>

      {winner.fulfillmentProof && (
        <a href={winner.fulfillmentProof} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.74rem', color: 'var(--alive)', display: 'flex', alignItems: 'center', gap: 5, zIndex: 1 }}>
          🌱 Fulfillment proof →
        </a>
      )}

      {/* Perforated divider */}
      <div style={{
        borderTop: `1px dashed rgba(${placeRgb},0.16)`,
        margin: '0 -2px', zIndex: 1,
      }} />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, zIndex: 1 }}>
        <Link to={`/profile/${winner.walletAddress}`} style={{
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: '0.78rem',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: `linear-gradient(135deg, hsl(${(winner.walletAddress?.charCodeAt(0) || 0) * 7 % 360},70%,55%), hsl(${(winner.walletAddress?.charCodeAt(2) || 0) * 11 % 360},70%,45%))`,
          }} />
          @{winner.username}
        </Link>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>
              ◎{(winner.solWon || 0).toFixed(3)}
            </p>
            <p style={{ fontSize: '0.58rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>SOL WON</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>
              ★{winner.beliefCount || 0}
            </p>
            <p style={{ fontSize: '0.58rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>BELIEVERS</p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', zIndex: 1 }}>
        {formatDistanceToNow(wonAt, { addSuffix: true })}
      </p>
    </div>
  );
}

export default function HallOfDreams() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dreamsApi.hall().then(d => { setWinners(d.winners || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const champions = winners.filter(w => w.place === 1);
  const others = winners.filter(w => w.place !== 1);
  const totalSOL = winners.reduce((s, w) => s + (w.solWon || 0), 0);

  return (
    <div style={{
      minHeight: '100vh', paddingTop: 72, paddingBottom: 100,
      background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(255,215,0,0.05) 0%, transparent 55%)',
    }}>
      {/* Header */}
      <div style={{ padding: 'clamp(44px, 6vw, 64px) 0 48px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontSize: '2.5rem', marginBottom: 16, animation: 'crown-rise 4s ease-in-out infinite' }}>♛</div>
          <p className="section-label" style={{ justifyContent: 'center', display: 'flex', marginBottom: 10 }}>
            Permanent Archive
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #FFD700, #FFE566, #FF9900)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Hall of Dreams</h1>
          <p style={{
            color: 'var(--text-2)', marginTop: 14, fontSize: '0.9rem',
            maxWidth: 480, margin: '14px auto 0', lineHeight: 1.7,
          }}>
            Funded dreams live here forever. Winning retires your dream permanently — it can never compete again.
            This is the highest honor.
          </p>

          {winners.length > 0 && (
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
              {[
                { label: 'Dreams Funded', value: champions.length },
                { label: 'Rounds', value: winners.length > 0 ? Math.max(...winners.map(w => w.roundNumber || 0)) : 0 },
                { label: 'Total SOL Paid', value: `◎ ${totalSOL.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <p style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
                    color: 'var(--gold)', textShadow: '0 0 20px rgba(255,215,0,0.25)',
                  }}>{value}</p>
                  <p className="section-label" style={{ marginTop: 4 }}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 48 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--r-xl)' }} />)}
          </div>
        ) : winners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 20, opacity: 0.3 }}>🏛️</div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1.1rem',
              color: 'var(--text-3)', letterSpacing: '-0.02em',
            }}>The hall awaits its first legend.</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 8 }}>
              No dreams have been funded yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {champions.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <p className="section-label" style={{ color: 'var(--crowned)' }}>Champions</p>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.2), transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                  {champions.map((w, i) => <WinnerCard key={w.id} winner={w} i={i} />)}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <p className="section-label">Runners-Up</p>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {others.map((w, i) => <WinnerCard key={w.id} winner={w} i={i} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
