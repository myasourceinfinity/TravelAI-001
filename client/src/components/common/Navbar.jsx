import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../home/HomePage.css';

const Logo = () => (
  <Link
    to="/"
    className="home-nav-logo"
    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
  >
    <img
      src="/logo.png"
      alt="Travel AI"
      style={{
        height: '170px',
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        margin: '-58px -14px',
      }}
      onError={e => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />

    <div style={{ display: 'none', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 3L3 10.5L11.25 12.75L13.5 21L21 3Z"
            fill="white"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        style={{
          fontWeight: '800',
          fontSize: '1.25rem',
          color: '#0f172a',
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '-0.01em',
        }}
      >
        Travel AI
      </span>
    </div>
  </Link>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAgent = user?.role_type === 'agent';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    closeMobileMenu();
    navigate('/');
  }

  const isActive = path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? 'active'
      : '';

  return (
    <>
      <nav className="home-nav" style={{ width: '100%', boxSizing: 'border-box' }}>
        <Logo />

        <button
          type="button"
          className={`home-nav-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`home-nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {user ? (
            <>
              {user.role_type === 'agent' ? (
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`home-nav-link ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
              ) : user.role_type && ['admin', 'useradmin', 'superadmin'].includes(user.role_type) ? (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={`home-nav-link ${isActive('/admin')}`}
                >
                  Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`home-nav-link ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
              )}

              {!isAgent && (
                <Link
                  to="/agents"
                  onClick={closeMobileMenu}
                  className={`home-nav-link ${isActive('/agents')}`}
                >
                  Packages
                </Link>
              )}

              {!isAgent && (
                <Link
                  to="/my-trips"
                  onClick={closeMobileMenu}
                  className={`home-nav-link ${isActive('/my-trips')}`}
                >
                  My Trips
                </Link>
              )}

              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className={`home-nav-link ${isActive('/profile')}`}
              >
                Profile
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="home-nav-link home-nav-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/#footer-about" onClick={closeMobileMenu} className="home-nav-link">
                About Us
              </a>

              <button
                type="button"
                className="home-nav-link home-nav-mobile-login-link"
                onClick={() => {
                  closeMobileMenu();
                  navigate('/login');
                }}
              >
                Login
              </button>
            </>
          )}
        </div>

        {!user && (
          <button
            className="home-nav-cta home-nav-login-cta"
            onClick={() => {
              closeMobileMenu();
              navigate('/login');
            }}
          >
            Login
          </button>
        )}
      </nav>

      <div className="home-nav-spacer" aria-hidden="true" />
    </>
  );
}
