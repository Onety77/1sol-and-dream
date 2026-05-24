import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoundStore } from '../../store/roundStore';
import { useState, useEffect } from 'react';
import CountdownTimer from '../ui/CountdownTimer';

const NAV_LINKS = [
  { to: '/dreamboard', label: 'Dreamboard' },
  { to: '/arena',      label: 'Arena' },
  { to: '/hall',       label: 'Hall' },
  { to: '/graveyard',  label: 'Graveyard' },
  { to: '/well',       label: 'Wishing Well' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { currentRound, potSOL } = useRoundStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--gold)' : 'var(--text-2)',
    fontSize: '0.8rem', fontWeight: 500, transition: 'color 0.18s',
    textDecoration: 'none', letterSpacing: '0.01em',
  });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      background: scrolled ? 'rgba(0,0,8,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      transition: 'all 0.3s',
    }}>
      <div style={{
        maxWidth: 1300, margin: '0 auto', padding: '0 24px',
        height: '100%', display: 'flex', alignItems: 'center', gap: 20,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700, #FF9900, #FF0080)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.88rem', fontWeight: 900, color: '#000',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 0 20px rgba(255,215,0,0.4)',
          }}>1</div>
          <span className="hide-mobile" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', color: 'var(--text)',
          }}>SOL & A DREAM</span>
        </Link>

        {/* Nav links */}
        <div className="hide-mobile" style={{ display: 'flex', gap: 18, flex: 1 }}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={l.to} style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; }}
            >{l.label}</NavLink>
          ))}
        </div>

        {/* Round pill */}
        {currentRound && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 'var(--r-full)', padding: '5px 14px',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{ color: 'var(--gold)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ◎ {typeof potSOL === 'number' ? potSOL.toFixed(2) : '0.00'}
            </span>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)' }} />
            <CountdownTimer endsAt={currentRound.endsAt} compact />
          </div>
        )}

        {/* Auth */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {user ? (
            <>
              <Link to={`/profile/${user.walletAddress}`} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 'var(--r-full)', padding: '5px 12px 5px 6px',
                fontSize: '0.8rem', color: 'var(--text)', backdropFilter: 'blur(10px)',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                {user.profilePicUrl
                  ? <img src={user.profilePicUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, hsl(${(user.walletAddress?.charCodeAt(0)||0)*7%360},70%,55%), hsl(${(user.walletAddress?.charCodeAt(2)||0)*11%360},70%,45%))`,
                    }} />
                }
                <span className="hide-mobile">{user.username}</span>
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="btn btn-ghost btn-sm">Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm hide-mobile">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Join</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
