import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dreams as dreamsApi, beliefs as beliefApi } from '../services/api';
import { useRoundStore } from '../store/roundStore';
import { useAuthStore } from '../store/authStore';
import CountdownTimer from '../components/ui/CountdownTimer';
import DreamCard from '../components/dreams/DreamCard';

const MOOD_EMOJI = { Serious: '🎯', Funny: '😂', Delusional: '🌀', Beautiful: '✨', Degenerate: '🔥', Impossible: '🚀', Unfinished: '⏳' };

function TopDreamHero({ dream, myBeliefs, onBelief }) {
  const { user } = useAuthStore();
  const [believed, setBelieved] = useState(myBeliefs.includes(dream.id));
  const [count, setCount] = useState(dream.beliefCount || 0);
  const [loading, setLoading] = useState(false);

  const canBelieve = user && user.userId !== dream.userId && !believed && dream.state !== 'grey';

  const handleBelieve = async () => {
    if (!canBelieve || loading) return;
    setLoading(true);
    try {
      await beliefApi.place(dream.id);
      setBelieved(true); setCount(c => c + 1); onBelief?.();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--r-xl)',
      background: 'linear-gradient(135deg, rgba(30,20,5,0.96) 0%, rgba(15,10,35,0.96) 100%)',
      padding: 'clamp(28px, 4vw, 48px)',
      overflow: 'hidden',
      animation: 'crowned-breathe 3s ease-in-out infinite',
    }}>
      {/* Crown corona */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.8), rgba(255,215,0,1), rgba(255,215,0,0.8), transparent)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 80,
        background: 'radial-gradient(ellipse, rgba(255,215,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FFD700, #FF9900)',
            color: '#000',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '0.78rem',
            padding: '5px 14px', borderRadius: 'var(--r-full)',
            letterSpacing: '0.04em',
            boxShadow: '0 0 20px rgba(255,215,0,0.4)',
            animation: 'crown-rise 3.5s ease-in-out infinite',
          }}>♛ #1 DREAM</div>
          <span className={`tag mood-${dream.mood}`}>{MOOD_EMOJI[dream.mood]} {dream.mood}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, opacity: 0.6 }}>
          {dream.proofImageUrl && <span>📸</span>}
          {dream.proofLink && <a href={dream.proofLink} target="_blank" rel="noopener noreferrer">🔗</a>}
        </div>
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
        lineHeight: 1.18, letterSpacing: '-0.025em',
        color: 'var(--crowned)', marginBottom: 18,
        textShadow: '0 0 40px rgba(255,215,0,0.2)',
      }}>{dream.title}</h2>

      <p style={{
        fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.75,
        maxWidth: 640, marginBottom: 28,
      }}>{dream.story}</p>

      {dream.proofImageUrl && (
        <img src={dream.proofImageUrl} alt="proof" style={{
          maxHeight: 160, borderRadius: 'var(--r-md)', marginBottom: 24,
          objectFit: 'cover', border: '1px solid rgba(255,215,0,0.15)',
        }} onError={e => { e.target.style.display = 'none'; }} />
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid rgba(255,215,0,0.1)' }}>
        <Link to={`/profile/${dream.walletAddress}`} style={{
          display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', fontSize: '0.9rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg, hsl(${(dream.walletAddress?.charCodeAt(0) || 0) * 7 % 360},70%,55%), hsl(${(dream.walletAddress?.charCodeAt(2) || 0) * 11 % 360},70%,45%))`,
            border: '2px solid rgba(255,215,0,0.3)',
          }} />
          @{dream.username}
        </Link>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)', fontWeight: 700 }}>
              ★ {count}
            </span>
            <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>beliefs</span>
          </div>

          {canBelieve && (
            <button onClick={handleBelieve} disabled={loading} className="btn btn-primary">
              {loading ? '···' : 'Believe in This Dream'}
            </button>
          )}
          {believed && (
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.88rem' }}>✓ You believed</span>
          )}
          {!user && (
            <Link to="/signup" className="btn btn-ghost btn-sm">Join to believe</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Arena() {
  const { currentRound, potSOL } = useRoundStore();
  const { user } = useAuthStore();
  const [topDreams, setTopDreams] = useState([]);
  const [myBeliefs, setMyBeliefs] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeLeft = (() => {
    if (!currentRound?.endsAt) return null;
    const end = currentRound.endsAt?.toDate ? currentRound.endsAt.toDate()
      : currentRound.endsAt?.seconds ? new Date(currentRound.endsAt.seconds * 1000)
      : new Date(currentRound.endsAt);
    return end - Date.now();
  })();
  const isFinalHour = timeLeft !== null && timeLeft < 600000 && timeLeft > 0;

  const refreshBeliefs = () => beliefApi.my().then(d => setMyBeliefs(d.beliefs || [])).catch(() => {});

  useEffect(() => {
    dreamsApi.top()
      .then(d => { setTopDreams(d.dreams || []); setLoading(false); })
      .catch(() => setLoading(false));
    if (user) refreshBeliefs();
  }, [user]);

  return (
    <div style={{
      minHeight: '100vh', paddingTop: 72, paddingBottom: 100,
      background: isFinalHour
        ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,31,90,0.07) 0%, transparent 60%)'
        : 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,215,0,0.04) 0%, transparent 60%)',
    }}>

      {/* Header */}
      <div style={{ padding: '44px 0 36px', textAlign: 'center' }}>
        <div className="container">
          {isFinalHour && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 20, padding: '7px 18px',
              background: 'rgba(255,31,90,0.1)',
              border: '1px solid rgba(255,31,90,0.4)',
              borderRadius: 'var(--r-full)', fontSize: '0.78rem',
              color: 'var(--fading)', fontWeight: 700, letterSpacing: '0.05em',
              animation: 'fading-breathe 1.5s ease-in-out infinite',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fading)', animation: 'blink 1s ease-in-out infinite' }} />
              FINAL HOUR — Beliefs locking soon
            </div>
          )}

          <p className="section-label" style={{ justifyContent: 'center', display: 'flex', marginBottom: 8 }}>
            Round #{currentRound?.roundNumber || '—'}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900,
            letterSpacing: '-0.04em', marginBottom: 10,
          }}>The Arena</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Top dreams competing right now. Round closes in:
          </p>

          {currentRound && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <CountdownTimer endsAt={currentRound.endsAt} large />
            </div>
          )}

          {/* Stats strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p className="section-label" style={{ marginBottom: 4 }}>Prize Pool</p>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700,
                color: 'var(--gold)', textShadow: '0 0 24px rgba(255,215,0,0.3)',
              }}>◎ {potSOL.toFixed(2)}</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ textAlign: 'center' }}>
              <p className="section-label" style={{ marginBottom: 4 }}>Dreams Fighting</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>
                {topDreams.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 48 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="skeleton" style={{ height: 280, borderRadius: 'var(--r-xl)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="skeleton" style={{ height: 220, borderRadius: 'var(--r-lg)' }} />
              <div className="skeleton" style={{ height: 220, borderRadius: 'var(--r-lg)' }} />
            </div>
          </div>
        ) : topDreams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-3)', letterSpacing: '-0.02em' }}>
              The arena is empty.<br />No dreams this round yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* #1 Hero */}
            {topDreams[0] && (
              <TopDreamHero dream={topDreams[0]} myBeliefs={myBeliefs} onBelief={refreshBeliefs} />
            )}

            {/* #2 and #3 */}
            {topDreams.slice(1, 3).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {topDreams.slice(1, 3).map((d, i) => (
                  <DreamCard key={d.id} dream={d} myBeliefs={myBeliefs} onBelief={refreshBeliefs} rank={i + 2} />
                ))}
              </div>
            )}

            {/* #4–#10 */}
            {topDreams.slice(3).length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <p className="section-label">The Rest of the Field</p>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                  {topDreams.slice(3).map((d, i) => (
                    <DreamCard key={d.id} dream={d} myBeliefs={myBeliefs} onBelief={() => {}} rank={i + 4} compact />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
