import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { dreams as dreamsApi } from '../services/api';
import { useRoundStore } from '../store/roundStore';
import { useAuthStore } from '../store/authStore';
import CountdownTimer from '../components/ui/CountdownTimer';
import DreamCard from '../components/dreams/DreamCard';
import PostDreamModal from '../components/dreams/PostDreamModal';

const TICKER = [
  'Someone just believed in a dream', 'A new dream was posted',
  'The pot grows with every trade', 'Sell your tokens — lose your dream publicly',
  '1 SOL. 1 Dream. 1 Shot.', 'Post your dream. Win real funding.',
  'The 30% goes to believers of the winner', 'Round closes in less than an hour',
  'Dreams carry over. Winners retire forever.', 'Buy in. Believe. Win.',
  'Everyone says they have a dream. Now prove it.',
];

const STEPS = [
  { n: '01', icon: '🎫', title: 'Hold the Token', body: 'Must hold ≥ 1 SOL worth of the project token. No Phantom needed — just paste your wallet address.' },
  { n: '02', icon: '🌟', title: 'Post Your Dream', body: 'One dream per wallet. 20-word title. 280-character story. Pick a mood. Add proof if you have it.' },
  { n: '03', icon: '✨', title: 'Earn Beliefs', body: 'Every holder gets 3 free Beliefs per 6-hour round. Back the dreams you think deserve to win.' },
  { n: '04', icon: '💰', title: 'Win Real SOL', body: '50% to the top dream. 10% each to 2nd and 3rd. 30% split among everyone who believed in the winner.' },
  { n: '05', icon: '💀', title: 'Sell = Die', body: 'Drop below the threshold and your dream turns grey in public. The whole platform watches you fade.' },
  { n: '06', icon: '♛', title: 'Win & Retire', body: 'Winning dreams are retired to the Hall of Dreams forever. The highest honor. It cannot be undone.' },
];

export default function Home() {
  const { currentRound, potSOL } = useRoundStore();
  const { user } = useAuthStore();
  const [topDream, setTopDream] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    dreamsApi.top().then(d => setTopDream(d.dreams?.[0] || null)).catch(() => {});
  }, []);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const phrases = [...TICKER, ...TICKER];

  return (
    <div style={{ paddingTop: 0 }}>

      {/* ═══════════════════════════════════════════
          HERO  —  full-viewport, everything centered
      ═══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', position: 'relative',
          padding: '80px 24px 60px',
        }}
      >
        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 40, padding: '7px 18px',
          background: 'rgba(0,255,209,0.06)',
          border: '1px solid rgba(0,255,209,0.2)',
          borderRadius: 'var(--r-full)',
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
          letterSpacing: '0.14em', color: 'var(--alive)',
          animation: 'fade-up 0.6s ease-out both',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--alive)', flexShrink: 0,
            animation: 'blink 1.4s ease-in-out infinite',
          }} />
          {currentRound ? `ROUND ${currentRound.roundNumber} — LIVE` : 'BUILT ON SOLANA'}
        </div>

        {/* The BIG text */}
        <div style={{
          animation: 'fade-up 0.7s ease-out 0.1s both',
          marginBottom: 40,
          /* subtle parallax with scroll */
          transform: `translateY(${scrollY * 0.18}px)`,
        }}>
          {/* Giant "1" */}
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(8rem, 28vw, 22rem)',
            lineHeight: 0.82, letterSpacing: '-0.05em',
            background: 'linear-gradient(160deg, #FFD700 0%, #FF9900 40%, #FF5500 80%, #FF0080 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 60px rgba(255,215,0,0.25))',
            userSelect: 'none',
          }}>1</div>

          {/* SOL & A DREAM */}
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(1.4rem, 5vw, 4rem)',
            letterSpacing: '0.04em', color: 'var(--text)',
            marginTop: 'clamp(8px, 1.5vw, 20px)',
            lineHeight: 1,
          }}>
            SOL{' '}
            <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '0.55em', letterSpacing: '0.18em' }}>AND A</span>{' '}
            DREAM
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)', color: 'var(--text-2)',
          lineHeight: 1.8, maxWidth: 480, marginBottom: 36,
          animation: 'fade-up 0.7s ease-out 0.2s both',
        }}>
          Post your real dream. Compete for community belief.
          Win <span style={{ color: 'var(--gold)', fontWeight: 600 }}>real SOL</span> from trading fees every 6 hours.
          Selling kills your dream — <span style={{ color: 'var(--fading)' }}>publicly</span>.
        </p>

        {/* CTA row */}
        <div style={{
          display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
          animation: 'fade-up 0.7s ease-out 0.3s both',
          marginBottom: 52,
        }}>
          {user ? (
            <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-lg">
              Post Your Dream
            </button>
          ) : (
            <Link to="/signup" className="btn btn-primary btn-lg">Join the Dream</Link>
          )}
          <Link to="/arena" className="btn btn-ghost btn-lg">Watch the Arena →</Link>
        </div>

        {/* Live stats pill */}
        {currentRound && (
          <div style={{
            display: 'inline-flex', gap: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--r-xl)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            animation: 'fade-up 0.7s ease-out 0.4s both',
          }}>
            <div style={{ padding: '18px 28px', textAlign: 'center' }}>
              <p className="section-label" style={{ marginBottom: 6 }}>Prize Pot</p>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 900,
                fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
                color: 'var(--gold)', lineHeight: 1,
                animation: 'gold-pulse 2.5s ease-in-out infinite',
              }}>◎ {potSOL.toFixed(2)}</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            <div style={{ padding: '18px 28px', textAlign: 'center' }}>
              <p className="section-label" style={{ marginBottom: 6 }}>Closes In</p>
              <CountdownTimer endsAt={currentRound.endsAt} large />
            </div>
          </div>
        )}

        {/* Scroll cue */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          opacity: 0.3, animation: 'float 2.5s ease-in-out infinite',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.2em' }}>SCROLL</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="6" y="3" width="4" height="4" rx="2" fill="currentColor" opacity="0.5"/>
            <path d="M8 10l-4 6h8l-4-6z" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {phrases.map((p, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CURRENTLY LEADING — the top dream
      ═══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 0' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Currently Leading</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', letterSpacing: '-0.03em',
            }}>The dream in first place</h2>
          </div>
          {topDream ? (
            <div style={{ animation: 'drift 7s ease-in-out infinite' }}>
              <DreamCard dream={topDream} rank={1} />
            </div>
          ) : (
            <div className="glass" style={{
              textAlign: 'center', padding: '60px 32px',
              borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-3)' }}>
                No dreams posted yet this round.<br />Be the first.
              </p>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/arena" style={{
              fontSize: '0.8rem', color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
            >VIEW ALL DREAMS IN THE ARENA →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — editorial zigzag
      ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(64px, 8vw, 100px) 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* big background text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 'clamp(8rem, 20vw, 20rem)', color: 'rgba(255,255,255,0.015)',
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
          letterSpacing: '-0.05em', lineHeight: 1,
        }}>DREAM</div>

        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)' }}>
            <p className="section-label" style={{ marginBottom: 10 }}>The Mechanism</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', letterSpacing: '-0.04em',
            }}>How it works</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map(({ n, icon, title, body }, i) => (
              <div key={n} style={{
                display: 'flex',
                flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
                gap: 'clamp(24px, 5vw, 80px)',
                alignItems: 'center',
                padding: 'clamp(28px, 4vw, 48px) 0',
                borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                animation: `fade-up 0.5s ease-out ${i * 0.08}s both`,
              }}>
                {/* Number + Icon block */}
                <div style={{
                  flexShrink: 0, width: 'clamp(80px, 12vw, 140px)',
                  textAlign: 'center', position: 'relative',
                }}>
                  {/* Giant watermark number */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 900,
                    fontSize: 'clamp(5rem, 10vw, 8rem)', lineHeight: 1,
                    color: 'rgba(255,255,255,0.05)', userSelect: 'none',
                    letterSpacing: '-0.04em',
                  }}>{n}</div>
                  {/* Icon floating over it */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                  }}>{icon}</div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, textAlign: i % 2 === 0 ? 'left' : 'right' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: 'clamp(1rem, 2vw, 1.35rem)', letterSpacing: '-0.02em',
                    marginBottom: 12,
                    color: n === '05' ? 'var(--fading)' : n === '06' ? 'var(--gold)' : 'var(--text)',
                  }}>{title}</h3>
                  <p style={{
                    fontSize: 'clamp(0.84rem, 1.2vw, 0.95rem)',
                    color: 'var(--text-2)', lineHeight: 1.75,
                    maxWidth: 460,
                    marginLeft: i % 2 !== 0 ? 'auto' : 0,
                  }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          THE SPLIT — make the numbers the design
      ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(64px, 8vw, 100px) 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 60px)' }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Prize Distribution</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', letterSpacing: '-0.04em',
            }}>The Split</h2>
            <p style={{ color: 'var(--text-2)', marginTop: 12, fontSize: '0.9rem', lineHeight: 1.7 }}>
              Every 6 hours, trading fees get redistributed. Dreamers fight for it. Believers bet on it.
            </p>
          </div>

          {/* Four massive percentage blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(8px, 2vw, 20px)' }}>
            {[
              { pct: '50', label: '1st Place\nDream',    color: '#FFD700', glow: 'rgba(255,215,0,0.35)' },
              { pct: '10', label: '2nd Place\nDream',    color: '#C8C8E0', glow: 'rgba(200,200,224,0.2)' },
              { pct: '10', label: '3rd Place\nDream',    color: '#CD7F32', glow: 'rgba(205,127,50,0.25)' },
              { pct: '30', label: 'Believers\nof #1',    color: '#00FFD1', glow: 'rgba(0,255,209,0.3)' },
            ].map(({ pct, label, color, glow }, i) => (
              <div key={pct + i} style={{
                padding: 'clamp(16px, 3vw, 28px) 12px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${color}22`,
                borderRadius: 'var(--r-lg)',
                cursor: 'default',
                transition: 'transform 0.25s, box-shadow 0.25s',
                animation: `fade-up 0.5s ease-out ${i * 0.1}s both`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 0 60px ${glow}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 900,
                  fontSize: 'clamp(2.2rem, 6vw, 4rem)', color, lineHeight: 1,
                  textShadow: `0 0 40px ${glow}`,
                  letterSpacing: '-0.04em',
                }}>{pct}%</div>
                <div style={{
                  fontSize: 'clamp(0.65rem, 1vw, 0.75rem)', color: 'var(--text-2)',
                  lineHeight: 1.4, marginTop: 10, whiteSpace: 'pre-line',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
                }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 24, textAlign: 'center', padding: '16px 24px',
            background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.7,
          }}>
            The 30% to believers makes this a <strong style={{ color: 'var(--text)' }}>prediction game</strong>,
            not just voting. Back the right dream and you earn alongside the dreamer.
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(80px, 10vw, 140px) 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Big glow behind */}
        <div style={{
          position: 'absolute', bottom: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,215,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(1.8rem, 5vw, 4rem)', letterSpacing: '-0.04em',
            lineHeight: 1.1, marginBottom: 20,
          }}>
            Everyone says they have a dream.<br />
            <span className="shimmer-gold">Now prove it.</span>
          </h2>
          <p style={{
            color: 'var(--text-2)', marginBottom: 40,
            maxWidth: 400, margin: '0 auto 40px',
            lineHeight: 1.75, fontSize: '0.95rem',
          }}>
            Get the token. Post your dream. Fight for your funding.
            The pot fills every time someone trades.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Start with 1 SOL →
          </Link>
        </div>
      </section>

      <PostDreamModal open={modalOpen} onClose={() => setModalOpen(false)} onPosted={() => {}} />
    </div>
  );
}
