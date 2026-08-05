import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../home/HomePage.css';

// ── Logo using the official TravelAI brand image ────────────────────────────────────────────
// Place the logo file at: client/public/logo.png
const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
    <img
      src="/logo.png"
      alt="Travel AI"
      style={{
        height: '140px',
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        margin: '-46px -10px',
      }}
      onError={e => {
        // Fallback to text logo if image not found
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
    {/* Fallback text logo (shown only if image fails to load) */}
    <div style={{ display: 'none', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 3L3 10.5L11.25 12.75L13.5 21L21 3Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#0f172a', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>Travel AI</span>
    </div>
  </Link>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="home-nav" style={{ width: '100%', boxSizing: 'border-box' }}>
      <Logo />
      <div className="home-nav-links">
        {user ? (
          <>
            {user.role_type === 'agent' ? (
              <Link to="/dashboard" className={`home-nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
            ) : user.role_type && ['admin','useradmin','superadmin'].includes(user.role_type) ? (
              <Link to="/admin" className={`home-nav-link ${isActive('/admin')}`}>Admin</Link>
            ) : null}
            {user?.role_type !== 'agent' && !['admin','useradmin','superadmin'].includes(user?.role_type) && (
              <Link to="/" className={`home-nav-link ${isActive('/')}`}>Home</Link>
            )}
            <Link to="/agents" className={`home-nav-link ${isActive('/agents')}`}>Agents</Link>
            <Link to="/plan-trip" className={`home-nav-link ${isActive('/plan-trip')}`}>AI Planner</Link>
            <Link to="/my-trips" className={`home-nav-link ${isActive('/my-trips')}`}>My Trips</Link>
            {user.role_type !== 'agent' && user.role_type !== 'admin' && user.role_type !== 'useradmin' && user.role_type !== 'superadmin' && (
              <Link to="/dashboard" className={`home-nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
            )}
            <Link to="/profile" className={`home-nav-link ${isActive('/profile')}`}>Profile</Link>
            <button onClick={handleLogout} className="home-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>Logout</button>
          </>
        ) : (
          <>
            <a href="/#pricing" className="home-nav-link">Pricing</a>
            <a href="/#about" className="home-nav-link">About Us</a>
          </>
        )}
      </div>
      {!user && (
        <button className="home-nav-cta" onClick={() => navigate('/login')}>
          Login
        </button>
      )}
    </nav>
  );
}
