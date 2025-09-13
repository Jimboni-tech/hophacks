import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const navStyle = {
  width: '100%',
  background: '#222',
  color: '#fff',
  padding: '12px 0',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000,
};

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  margin: '0 24px',
  fontSize: 18,
  fontWeight: 500,
};


const Navbar = () => {
  const [fullName, setFullName] = useState('');
  const [Icon, setIcon] = useState(null);

  useEffect(() => {
    // load current user fullName from localStorage
    const loadUser = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        setFullName(user?.fullName || '');
      } catch {
        setFullName('');
      }
    };
    loadUser();

    // listen for storage events (other tabs) and custom userChanged events
    const onStorage = (e) => {
      if (!e || e.key === 'user') loadUser();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('userChanged', loadUser);

    let mounted = true;
    import('react-icons/fa')
      .then((mod) => {
        if (mounted && mod?.FaUserCircle) {
          // debug log to surface in browser console
          // eslint-disable-next-line no-console
          console.debug('Navbar: react-icons FaUserCircle loaded');
          setIcon(() => mod.FaUserCircle);
        }
      })
      .catch(() => {
        // eslint-disable-next-line no-console
        console.debug('Navbar: failed to load react-icons, will use fallback');
      });
    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('userChanged', loadUser);
    };
  }, []);

  const FallbackIcon = ({ size = 32 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-3.3137 3.5817-6 8-6s8 2.6863 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <nav style={{ ...navStyle, padding: '12px 32px', display: 'flex', alignItems: 'center', position: 'fixed' }}>
      <span style={{ fontSize: 18 }}>{`Hello${fullName ? `, ${fullName}` : ''}`}</span>

      {/* absolutely centered links so they don't shift when left/right change */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
        <Link to="/home" style={linkStyle}>Home</Link>
        <Link to="/about" style={linkStyle}>About</Link>
        <Link to="/recent" style={linkStyle}>Recents</Link>
        <Link to="/leaderboard" style={linkStyle}>Leaderboard</Link>
      </div>

      <div style={{ marginLeft: 'auto', position: 'relative' }}>
        <Link to="/profile" style={{ color: '#fff', display: 'inline-flex', alignItems: 'center' }}>
          {Icon ? <Icon size={32} /> : <FallbackIcon size={32} />}
          <span style={{marginLeft: 30, fontSize: 12, opacity: 0.85}}>
            {Icon ? 'icon' : 'fallback'}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
