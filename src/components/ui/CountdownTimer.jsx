import { useState, useEffect } from 'react';

function getTimeLeft(endsAt) {
  if (!endsAt) return null;
  const end = endsAt?.toDate ? endsAt.toDate()
    : endsAt?.seconds ? new Date(endsAt.seconds * 1000) : new Date(endsAt);
  const diff = end - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0 };
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    total: diff,
  };
}

export default function CountdownTimer({ endsAt, compact = false, large = false }) {
  const [time, setTime] = useState(() => getTimeLeft(endsAt));
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!time) return null;
  const urgent = time.total > 0 && time.total < 3600000;
  const color  = urgent ? 'var(--fading)' : compact ? 'var(--text-2)' : 'var(--gold)';
  const pad    = n => String(n).padStart(2, '0');

  if (compact) {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color,
        letterSpacing: '0.04em',
        textShadow: urgent ? '0 0 8px rgba(255,31,90,0.6)' : 'none',
      }}>
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
    );
  }

  if (large) {
    const fs = large === 'xl' ? '3.5rem' : '2.5rem';
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        {[{ val: time.h, label: 'hrs' }, { val: time.m, label: 'min' }, { val: time.s, label: 'sec' }].map(({ val, label }, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: i < 2 ? 12 : 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: fs, fontWeight: 700,
                color, lineHeight: 1,
                textShadow: `0 0 30px ${urgent ? 'rgba(255,31,90,0.5)' : 'rgba(255,215,0,0.35)'}`,
                minWidth: fs === '3.5rem' ? 88 : 64,
              }}>{pad(val)}</div>
              <div style={{
                fontSize: '0.58rem', color: 'var(--text-3)',
                letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6,
                fontFamily: 'var(--font-mono)',
              }}>{label}</div>
            </div>
            {i < 2 && (
              <div style={{
                color: 'var(--text-3)', marginBottom: 22, fontSize: '1.5rem',
                fontFamily: 'var(--font-mono)',
                animation: 'blink 1.2s ease-in-out infinite',
              }}>:</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[{ val: time.h }, { val: time.m }, { val: time.s }].map(({ val }, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          {i > 0 && <span style={{ color: 'var(--text-3)', margin: '0 1px', fontFamily: 'var(--font-mono)' }}>:</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color, fontWeight: 700 }}>{pad(val)}</span>
        </span>
      ))}
    </div>
  );
}
