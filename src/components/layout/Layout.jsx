import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import StarField from '../ui/StarField';
import { useEffect } from 'react';
import { listenCurrentRound, listenGlobalStats } from '../../services/firebase';
import { useRoundStore } from '../../store/roundStore';

const NAV_ITEMS = [
  { to: '/',           icon: HomeIcon,      label: 'Home' },
  { to: '/dreamboard', icon: BoardIcon,     label: 'Board' },
  { to: '/arena',      icon: ArenaIcon,     label: 'Arena' },
  { to: '/hall',       icon: HallIcon,      label: 'Hall' },
  { to: '/well',       icon: WellIcon,      label: 'Well' },
];

export default function Layout() {
  const setCurrentRound = useRoundStore(s => s.setCurrentRound);
  const setGlobalStats  = useRoundStore(s => s.setGlobalStats);

  useEffect(() => {
    const unsubRound  = listenCurrentRound(setCurrentRound);
    const unsubStats  = listenGlobalStats(setGlobalStats);
    return () => { unsubRound(); unsubStats(); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StarField />
      <Navbar />
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 24px',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        background: 'rgba(3,3,8,0.6)',
        backdropFilter: 'blur(20px)',
      }}>
        1 SOL & A DREAM · POST YOUR DREAM · WIN REAL FUNDING · BUILT ON{' '}
        <span style={{ color: 'var(--alive)' }}>SOLANA</span>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}
function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function ArenaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
    </svg>
  );
}
function HallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 21V3M12 3l-4 5M12 3l4 5"/>
      <rect x="2" y="17" width="20" height="4" rx="1"/>
    </svg>
  );
}
function WellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>
  );
}
