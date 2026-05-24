import { useRoundStore } from '../store/roundStore';
import CountdownTimer from '../components/ui/CountdownTimer';

function StatCard({ label, value, color = 'var(--text)', mono = false, i = 0 }) {
  return (
    <div
      className="glass"
      style={{
        padding: 'clamp(18px, 3vw, 24px)',
        textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8,
        animation: `fade-up 0.45s ease-out ${i * 0.05}s both`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 0 32px ${color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <p className="section-label">{label}</p>
      <p style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
        fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color, lineHeight: 1,
        textShadow: `0 0 20px ${color}44`,
      }}>{value}</p>
    </div>
  );
}

const HOW_IT_FILLS = [
  { icon: '📊', text: 'Creator fees accumulate from every token trade — buys, sells, and swaps.' },
  { icon: '🔥', text: 'Boost purchases (Spotlight, Color Burst, Megaphone) burn tokens — they do NOT add to the pot. They reduce supply.' },
  { icon: '💰', text: 'Extra Belief purchases also burn tokens. The pot and the burn are completely separate systems.' },
  { icon: '⚡', text: 'At round close, the creator wallet balance minus gas reserve becomes the round prize pool.' },
  { icon: '🌊', text: 'More volume = bigger pot = more funded dreams. The flywheel is real.' },
];

export default function WishingWell() {
  const { currentRound, potSOL, globalStats } = useRoundStore();
  const stats = globalStats || {};

  const timeLeft = (() => {
    if (!currentRound?.endsAt) return null;
    const end = currentRound.endsAt?.toDate ? currentRound.endsAt.toDate()
      : currentRound.endsAt?.seconds ? new Date(currentRound.endsAt.seconds * 1000)
      : new Date(currentRound.endsAt);
    return end - Date.now();
  })();
  const pct = currentRound ? Math.max(0, Math.min(100, (1 - (timeLeft || 0) / 3600000) * 100)) : 0;
  const isUrgent = timeLeft !== null && timeLeft < 600000 && timeLeft > 0;

  return (
    <div style={{
      minHeight: '100vh', paddingTop: 72, paddingBottom: 100,
      background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,209,0.04) 0%, transparent 55%)',
    }}>

      {/* Header */}
      <div style={{ padding: 'clamp(48px, 6vw, 72px) 0 48px', textAlign: 'center' }}>
        <div className="container">
          <p className="section-label" style={{ justifyContent: 'center', display: 'flex', marginBottom: 10 }}>
            Live Stats
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900,
            letterSpacing: '-0.04em',
          }}>The Wishing Well</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 10, fontSize: '0.9rem' }}>
            Every trade fills the well. Every round it empties into dreams.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 48 }}>

        {/* Current pot — hero orb */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(0,20,16,0.95) 0%, rgba(5,15,30,0.95) 100%)',
          border: '1px solid rgba(0,255,209,0.2)',
          borderRadius: 'var(--r-xl)', padding: 'clamp(36px, 5vw, 56px)',
          textAlign: 'center', marginBottom: 24,
          animation: 'alive-breathe 4s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,209,0.8), transparent)',
          }} />

          {/* Glowing orb behind number */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,209,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <p className="section-label" style={{ color: 'var(--alive)', marginBottom: 16 }}>
            Current Prize Pool
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, position: 'relative' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 900,
              color: 'var(--alive)', lineHeight: 1,
              textShadow: '0 0 60px rgba(0,255,209,0.4)',
            }}>{potSOL.toFixed(3)}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'clamp(1rem, 2vw, 1.6rem)',
              color: 'var(--alive)', opacity: 0.6,
            }}>SOL</span>
          </div>

          {/* Split breakdown */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 32, marginTop: 32 }}>
            {[
              { label: '1st Place Gets', value: `◎ ${(potSOL * 0.5).toFixed(3)}`, color: 'var(--gold)' },
              { label: 'Believers Split', value: `◎ ${(potSOL * 0.3).toFixed(3)}`, color: 'var(--alive)' },
              { label: '2nd + 3rd', value: `◎ ${(potSOL * 0.2).toFixed(3)}`, color: 'var(--text-2)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p className="section-label" style={{ marginBottom: 4 }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 700, fontSize: '1.1rem' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Round timer */}
        {currentRound && (
          <div className="glass" style={{ padding: 'clamp(24px, 4vw, 36px)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p className="section-label" style={{ marginBottom: 12 }}>Round #{currentRound.roundNumber} Closes In</p>
                <CountdownTimer endsAt={currentRound.endsAt} large="xl" />
              </div>

              {/* Progress bar */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  <span>START</span>
                  <span style={{ color: isUrgent ? 'var(--fading)' : 'var(--text-2)' }}>{pct.toFixed(0)}% elapsed</span>
                  <span>END</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 'var(--r-full)',
                    width: `${pct}%`, transition: 'width 1s linear',
                    background: isUrgent
                      ? 'linear-gradient(90deg, var(--fading), #FF6B8A)'
                      : 'linear-gradient(90deg, var(--alive), #00D4B8)',
                    boxShadow: isUrgent
                      ? '0 0 12px rgba(255,31,90,0.5)'
                      : '0 0 12px rgba(0,255,209,0.4)',
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label="Total SOL Distributed" value={`◎ ${(stats.totalSOLDistributed || 0).toFixed(2)}`} color="var(--gold)" mono i={0} />
          <StatCard label="Dreams Funded" value={stats.totalDreamsFunded || 0} color="var(--alive)" i={1} />
          <StatCard label="Beliefs Placed" value={(stats.totalBeliefsPlaced || 0).toLocaleString()} color="var(--text)" i={2} />
          <StatCard label="Rounds Completed" value={stats.totalRoundsCompleted || 0} color="var(--resurrected)" i={3} />
          <StatCard label="Total Dreams" value={stats.totalDreams || 0} color="var(--alive)" i={4} />
          <StatCard label="Total Dreamers" value={stats.totalUsers || 0} color="var(--text)" i={5} />
        </div>

        {/* How the pot works */}
        <div className="glass" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>
            How the pot fills
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {HOW_IT_FILLS.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
