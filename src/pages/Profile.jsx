import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profile as profileApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';

const BADGE_META = {
  'day-one':      { icon: '🌅', label: 'Day One', desc: 'Joined in the first week' },
  'funded':       { icon: '💰', label: 'Funded', desc: 'Won a round' },
  'kingmaker':    { icon: '♛',  label: 'Kingmaker', desc: 'Believed in a winning dream' },
  'never-sold':   { icon: '🔒', label: 'Never Sold', desc: '30 consecutive days above threshold' },
  'true-believer':{ icon: '⭐', label: 'True Believer', desc: 'Backed 20+ winning dreams' },
  'faded':        { icon: '💀', label: 'Faded', desc: 'Dropped below threshold once' },
  'resurrected':  { icon: '⚡', label: 'Resurrected', desc: 'Came back after fading' },
  'fulfilled':    { icon: '🌱', label: 'Fulfilled', desc: 'Posted proof after winning' },
  'all-in':       { icon: '🎲', label: 'All In', desc: 'Used all 6 beliefs in one round' },
  'unbroken':     { icon: '🔥', label: 'Unbroken', desc: '100-day streak' },
};

const STATE_COLOR = { alive: 'var(--alive)', fading: 'var(--fading)', grey: 'var(--text-3)', resurrected: 'var(--resurrected)', crowned: 'var(--crowned)' };
const STATE_ICON  = { alive: '◉', fading: '⚠', grey: '✕', resurrected: '⚡', crowned: '♛' };

export default function Profile() {
  const { wallet } = useParams();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', profilePicUrl: '' });
  const [saving, setSaving] = useState(false);

  const isMe = me?.walletAddress === wallet;

  useEffect(() => {
    profileApi.get(wallet)
      .then(d => {
        setProfile(d);
        setEditForm({ displayName: d.displayName || '', profilePicUrl: d.profilePicUrl || '' });
        setLoading(false);
      })
      .catch(() => { setError('Profile not found.'); setLoading(false); });
  }, [wallet]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.update(editForm);
      setProfile(p => ({ ...p, ...editForm }));
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 72 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--gold)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: 72 }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-3)' }}>
        {error || 'Profile not found.'}
      </p>
    </div>
  );

  const holderColor = profile.holderStatus === 'active' ? 'var(--alive)' : profile.holderStatus === 'resurrected' ? 'var(--resurrected)' : 'var(--text-3)';
  const activeDream = profile.dreams?.find(d => !d.isRetired && d.state !== 'grey');

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, paddingBottom: 100 }}>
      <div className="container" style={{ paddingTop: 36, paddingBottom: 48, maxWidth: 900 }}>

        {/* Profile header */}
        <div className="glass" style={{ padding: 'clamp(24px, 4vw, 36px)', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'start' }}>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              {profile.profilePicUrl ? (
                <img src={profile.profilePicUrl} alt="" style={{
                  width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
                  border: `2px solid ${holderColor}44`,
                }} onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: `linear-gradient(135deg, hsl(${(wallet?.charCodeAt(0) || 0) * 7 % 360},65%,55%), hsl(${(wallet?.charCodeAt(2) || 0) * 11 % 360},65%,45%))`,
                  border: `2px solid ${holderColor}44`,
                }} />
              )}
              {/* Status dot */}
              <div style={{
                position: 'absolute', bottom: 3, right: 3,
                width: 14, height: 14, borderRadius: '50%',
                background: holderColor,
                border: '2px solid rgba(7,7,26,0.9)',
                boxShadow: `0 0 8px ${holderColor}80`,
              }} />
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  {editing ? (
                    <input className="input" value={editForm.displayName}
                      onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                      placeholder="Display name" style={{ marginBottom: 8 }} autoFocus />
                  ) : (
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 3 }}>
                      {profile.displayName || profile.username}
                    </h1>
                  )}
                  <p style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>@{profile.username}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 3 }}>
                    {profile.walletShort}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '4px 12px', borderRadius: 'var(--r-full)',
                    background: `${holderColor}14`,
                    border: `1px solid ${holderColor}40`,
                    color: holderColor, fontSize: '0.73rem', fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {profile.holderStatus === 'active' ? '◉ Active' : profile.holderStatus === 'resurrected' ? '⚡ Resurrected' : '✕ Faded'}
                  </div>
                  {isMe && !editing && (
                    <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm">Edit</button>
                  )}
                  {isMe && editing && (
                    <>
                      <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">{saving ? '...' : 'Save'}</button>
                      <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Cancel</button>
                    </>
                  )}
                </div>
              </div>

              {editing && (
                <input className="input" value={editForm.profilePicUrl}
                  onChange={e => setEditForm(f => ({ ...f, profilePicUrl: e.target.value }))}
                  placeholder="Profile picture URL (https://...)" />
              )}

              {/* Stats */}
              <div style={{
                display: 'flex', gap: 20, flexWrap: 'wrap',
                paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                {[
                  { label: 'Streak', value: `${profile.neverSoldStreak || 0}d` },
                  { label: 'Rounds', value: profile.roundsParticipated || 0 },
                  { label: 'Wins', value: profile.roundsWon || 0 },
                  { label: 'Beliefs Given', value: profile.totalBeliefsGiven || 0 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="section-label" style={{ marginBottom: 3 }}>{label}</p>
                    <p style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active dream */}
        {activeDream && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Active Dream</p>
            <div
              className={`dc-${activeDream.state} glass`}
              style={{ padding: 22, borderRadius: 'var(--r-lg)' }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <span style={{
                  color: STATE_COLOR[activeDream.state] || 'var(--text-2)',
                  fontSize: '0.75rem', fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {STATE_ICON[activeDream.state]} {activeDream.state}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                {activeDream.title}
              </h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{activeDream.story}</p>
              <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', marginTop: 12, fontSize: '0.82rem' }}>
                ★ {activeDream.beliefCount || 0} beliefs
              </p>
            </div>
          </div>
        )}

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Badges</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.badges.map(badge => {
                const meta = BADGE_META[badge] || { icon: '🏅', label: badge, desc: '' };
                return (
                  <div key={badge} title={meta.desc} className="glass" style={{
                    padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: '0.8rem', cursor: 'help',
                    transition: 'transform 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                  >
                    <span>{meta.icon}</span>
                    <span style={{ color: 'var(--text-2)' }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dream history */}
        {profile.dreams?.length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>Dream History</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.dreams.map(d => {
                const createdAt = d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000) : new Date();
                const sc = STATE_COLOR[d.state] || 'var(--text-3)';
                const si = STATE_ICON[d.state] || '●';
                return (
                  <div key={d.id} className="glass" style={{
                    padding: 16, borderRadius: 'var(--r-md)',
                    opacity: d.state === 'grey' ? 0.5 : 1,
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: 12,
                    transition: 'opacity 0.3s',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ color: d.isRetired && d.state === 'crowned' ? 'var(--crowned)' : sc, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {d.isRetired && d.state === 'crowned' ? '♛ Crowned' : `${si} ${d.state}`}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>{d.title}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                        {formatDistanceToNow(createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>★ {d.beliefCount || 0}</p>
                      {d.winningRound && <p style={{ fontSize: '0.68rem', color: 'var(--gold)', marginTop: 3 }}>Won ◎</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
