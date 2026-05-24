import { useEffect, useState, useCallback } from 'react';
import { dreams as dreamsApi, beliefs as beliefApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useRoundStore } from '../store/roundStore';
import DreamCard from '../components/dreams/DreamCard';
import PostDreamModal from '../components/dreams/PostDreamModal';
import CountdownTimer from '../components/ui/CountdownTimer';

const FILTERS = [
  { key: 'top',    label: 'Top',    icon: '🔥' },
  { key: 'rising', label: 'Rising', icon: '📈' },
  { key: 'new',    label: 'New',    icon: '✦' },
  { key: 'fading', label: 'Fading', icon: '⚠' },
];

export default function Dreamboard() {
  const { user } = useAuthStore();
  const { currentRound, potSOL } = useRoundStore();
  const [filter, setFilter] = useState('top');
  const [dreamsList, setDreamsList] = useState([]);
  const [myBeliefs, setMyBeliefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDreams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dreamsApi.list({ filter });
      setDreamsList(data.dreams || []);
    } catch { } finally { setLoading(false); }
  }, [filter]);

  const fetchBeliefs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await beliefApi.my();
      setMyBeliefs(data.beliefs || []);
    } catch { }
  }, [user]);

  useEffect(() => { fetchDreams(); }, [fetchDreams]);
  useEffect(() => { fetchBeliefs(); }, [fetchBeliefs]);

  const beliefsUsed = myBeliefs.length;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(13,13,40,0.6) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '36px 0 0',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 64, zIndex: 50,
      }}>
        <div className="container">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 20,
            flexWrap: 'wrap', gap: 14,
          }}>
            <div>
              <p className="section-label" style={{ marginBottom: 6 }}>Live</p>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800,
                letterSpacing: '-0.03em',
              }}>The Dreamboard</h1>
              <p style={{ color: 'var(--text-2)', marginTop: 4, fontSize: '0.85rem' }}>
                Round #{currentRound?.roundNumber || '—'}
                {currentRound && (
                  <> · Ends <CountdownTimer endsAt={currentRound.endsAt} compact /></>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {currentRound && (
                <div style={{
                  background: 'rgba(255,215,0,0.08)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: 'var(--r-full)',
                  padding: '7px 16px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--gold)',
                  fontWeight: 700,
                }}>
                  ◎ {potSOL.toFixed(2)} pot
                </div>
              )}
              {user && (
                <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
                  + Post Dream
                </button>
              )}
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 0 }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 0,
                  background: filter === f.key ? 'rgba(255,215,0,0.08)' : 'transparent',
                  color: filter === f.key ? 'var(--gold)' : 'var(--text-3)',
                  borderLeft: filter === f.key ? '2px solid rgba(255,215,0,0.6)' : '2px solid transparent',
                  borderTop: '1px solid transparent',
                  borderRight: '1px solid transparent',
                  borderBottom: '1px solid transparent',
                  fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em',
                  transition: 'all 0.18s', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >{f.icon} {f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Beliefs bar */}
      {user && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '10px 0',
        }}>
          <div className="container">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Beliefs this round:</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: i < beliefsUsed ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                    boxShadow: i < beliefsUsed ? '0 0 6px rgba(255,215,0,0.5)' : 'none',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
              <span style={{ color: 'var(--text-2)' }}>{beliefsUsed}/6</span>
            </div>
          </div>
        </div>
      )}

      {/* Dream masonry */}
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, marginBottom: 2, opacity: 0.5 }} />
            ))}
          </div>
        ) : dreamsList.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 'clamp(60px, 10vw, 100px) 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: '3rem', opacity: 0.4 }}>✦</div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem',
              color: 'var(--text-3)', letterSpacing: '-0.02em',
            }}>No dreams here yet.</p>
            {user ? (
              <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                Be the first to dream
              </button>
            ) : (
              <p style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>
                <a href="/signup" style={{ color: 'var(--gold)', fontWeight: 600 }}>Join</a> to post your dream.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)', borderBottom: 'none' }}>
            {dreamsList.map((dream, i) => (
              <div key={dream.id} style={{ animation: `fade-up 0.35s ease-out ${i * 0.035}s both` }}>
                <DreamCard
                  dream={dream}
                  myBeliefs={myBeliefs}
                  onBelief={fetchBeliefs}
                  rank={filter === 'top' || filter === 'rising' ? i + 1 : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <PostDreamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPosted={() => { fetchDreams(); setModalOpen(false); }}
      />
    </div>
  );
}
