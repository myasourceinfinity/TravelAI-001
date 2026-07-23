import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../home/HomePage.css';

// ── Custom inline SVG Logo matching prototype ────────────────────────────────
const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 3L3 10.5L11.25 12.75L13.5 21L21 3Z" fill="white" stroke="white" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#0f172a', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>Travel AI</span>
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
        <Link to="/" className={`home-nav-link ${isActive('/')}`}>Home</Link>
        <Link to="/agents" className={`home-nav-link ${isActive('/agents')}`}>Agents</Link>
        <Link to="/plan-trip" className={`home-nav-link ${isActive('/plan-trip')}`}>AI Planner</Link>
        {user ? (
          <>
            <Link to="/my-trips" className={`home-nav-link ${isActive('/my-trips')}`}>My Trips</Link>
            {['admin','useradmin','superadmin'].includes(user.role_type) ? (
              <Link to="/admin" className={`home-nav-link ${isActive('/admin')}`}>Admin</Link>
            ) : (
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
