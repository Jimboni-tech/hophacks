import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navStyle = {
  width: '100%',
  background: 'var(--surface)',
  color: 'var(--text)',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000,
  boxShadow: '0 1px 0 var(--border)'
};

const linkStyle = {
  color: 'var(--text)',
  textDecoration: 'none',
  margin: '0 20px',
  fontSize: 17,
  fontWeight: 600,
  padding: '0 8px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 6,
};


const Navbar = () => {
  const location = useLocation();

  // hide navbar on the landing and auth pages
  const HIDDEN_PATHS = ['/', '/login', '/register', '/company/login', '/register-company'];
  if (location && HIDDEN_PATHS.includes(location.pathname)) return null;
  const [fullName, setFullName] = useState('');
  const [Icon, setIcon] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem('token') || localStorage.getItem('user'));
    } catch {
      return false;
    }
  });
  const [isCompanySession, setIsCompanySession] = useState(false);

  useEffect(() => {
    // load current user fullName and login state from localStorage
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        setFullName(user?.fullName || '');
        setIsLoggedIn(Boolean(localStorage.getItem('token') || user));
        // detect company flag from token payload (no verification)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              setIsCompanySession(Boolean(payload && payload.company));
            } else {
              setIsCompanySession(false);
            }
          } catch (e) {
            setIsCompanySession(false);
          }
        } else {
          setIsCompanySession(false);
        }
      } catch {
        setFullName('');
        setIsLoggedIn(Boolean(localStorage.getItem('token')));
      }
    };
    loadUser();

    // listen for storage events (other tabs) and custom userChanged events
    const onStorage = (e) => {
      if (!e || e.key === 'user' || e.key === 'token') loadUser();
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

  // if not logged in, render a minimal navbar
  // (so companies/users can reach landing, register, login)

  const FallbackIcon = ({ size = 32 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', color: 'var(--accent-600)' }}
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-3.3137 3.5817-6 8-6s8 2.6863 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <nav style={{ ...navStyle, padding: '12px 32px', display: 'flex', alignItems: 'center', position: 'fixed' }}>
      {/* left greeting (hide for company sessions) */}
      {!isCompanySession && (
        <div style={{ position: 'absolute', left: 24, display: 'flex', alignItems: 'center', height: '64px' }}>
          <span style={{ fontSize: 18, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', height: '64px' }}>{`Hello${fullName ? `, ${fullName}` : ''}`}</span>
        </div>
      )}

        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            height: '64px',
            boxShadow: 'none',
          }}
        >
          {isCompanySession ? (
            <>
              <NavLink to="/company/projects/new" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Create Project</NavLink>
              <NavLink to="/company/projects" end style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Manage Projects</NavLink>
              <NavLink to="/company/applicants" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Applicant Notification</NavLink>
            </>
          ) : isLoggedIn ? (
            <>
              <NavLink to="/home" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Home</NavLink>
              <NavLink to="/organizations" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Organizations</NavLink>
              <img src="/commit4good.png" alt="App Icon" style={{ width: 45, height: 45, margin: '0 16px', background: 'transparent'}} />
              <NavLink to="/recent" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>My Projects</NavLink>
              <NavLink to="/stats" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Stats</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Landing</NavLink>
              <NavLink to="/projects" style={({ isActive }) => ({ ...linkStyle, color: isActive ? 'var(--accent)' : 'var(--text)' })}>Browse</NavLink>
            </>
          )}
        </div>

        {/* profile icon slightly inset from the right edge */}
      <div style={{ position: 'absolute', right: 90, display: 'flex', alignItems: 'center', height: '64px', zIndex: 1100, overflow: 'visible' }}>
        <NavLink to={isCompanySession ? '/company/profile' : '/profile'} aria-label="Profile" style={{ color: 'var(--accent-600)', display: 'inline-flex', alignItems: 'center', height: '64px' }}>
          {Icon ? <Icon size={36} color="var(--accent-600)" /> : <FallbackIcon size={36} />}
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
