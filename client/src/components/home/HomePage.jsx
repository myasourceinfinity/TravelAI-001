import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css';

// ── Custom inline SVG Logo matching prototype ────────────────────────────────
const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [description, setDescription] = useState('');

  // ── Handle Generation click ───────────────────────────────────────────────
  function handleGenerate(e) {
    e.preventDefault();
    if (description.trim()) {
      // Save prompt text in sessionStorage
      sessionStorage.setItem('pending_trip_description', description.trim());
    }
    // Redirect directly to /plan-trip (auth guard will redirect to /login if needed)
    navigate('/plan-trip');
  }

  // ── Handle Logout click ───────────────────────────────────────────────────
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="home-page-container">
      {/* ── Navigation Header ──────────────────────────────────────────────── */}
      <nav className="home-nav">
        <Logo />
        <div className="home-nav-links">
          <Link to="/" className="home-nav-link active">Home</Link>
          <a href="#explore" className="home-nav-link">Explore</a>
          {user ? (
            <>
              <Link to="/my-trips" className="home-nav-link">My Trips</Link>
              <Link to="/plan-trip" className="home-nav-link">AI Planner</Link>
              <Link to="/dashboard" className="home-nav-link">Edit Profile</Link>
              <button onClick={handleLogout} className="home-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/plan-trip" className="home-nav-link">AI Planner</Link>
              <a href="#pricing" className="home-nav-link">Pricing</a>
              <a href="#about" className="home-nav-link">About Us</a>
            </>
          )}
        </div>
        {!user && (
          <button className="home-nav-cta" onClick={() => navigate('/login')}>
            Login
          </button>
        )}
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <header className="home-hero-section">
        <div className="home-hero-left">
          <h1 className="home-hero-title">
            Plan your trip<br />
            with <span className="ai-highlight">AI</span> in seconds
          </h1>
          <p className="home-hero-subtitle">
            Get personalized itineraries, discover the best places,<br />
            and travel smarter with our AI travel assistant.
          </p>

          {/* Generator card matching prototype design */}
          <div className="home-generator-card">
            <button className="home-gen-btn" onClick={handleGenerate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Generate your Trip
            </button>
            <textarea
              className="home-gen-textarea"
              placeholder="Where do you want to go?"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Hero Right side: animated floating colorful shapes */}
        <div className="home-hero-right">
          {/* Shadow/beige backing elements */}
          <div className="home-orb home-orb-shadow-beige"></div>
          <div className="home-orb home-orb-shadow-small"></div>
          {/* Foreground colored floating orbs */}
          <div className="home-orb home-orb-pink"></div>
          <div className="home-orb home-orb-blue"></div>
          <div className="home-orb home-orb-orange"></div>
          <div className="home-orb home-orb-large-yellow"></div>
          <div className="home-orb home-orb-large-blue"></div>
        </div>
      </header>

      {/* ── "Why Choose Us" Section ───────────────────────────────────────── */}
      <section className="home-why-section" id="about">
        <h2 className="home-section-title">Why choose Travel AI?</h2>
        <div className="home-why-grid">
          <div className="home-why-col">
            <div className="home-why-icon-container">📊</div>
            <h3 className="home-why-subtitle">Smart Planning</h3>
            <p className="home-why-text">
              AI creates the perfect itinerary based on your preferences.
            </p>
          </div>
          <div className="home-why-col">
            <div className="home-why-icon-container">💰</div>
            <h3 className="home-why-subtitle">Budget Optimization</h3>
            <p className="home-why-text">
              Get the best experiences within your budget.
            </p>
          </div>
          <div className="home-why-col">
            <div className="home-why-icon-container">🎯</div>
            <h3 className="home-why-subtitle">Personalized Trips</h3>
            <p className="home-why-text">
              Every trip is unique, just like you.
            </p>
          </div>
        </div>
      </section>

      {/* ── "Popular Destinations" Section ───────────────────────────────── */}
      <section className="home-dest-section" id="explore">
        <div className="home-dest-header">
          <h2 className="home-section-title">Popular Destinations</h2>
          <a href="#explore" className="home-view-all">
            View all <span>→</span>
          </a>
        </div>

        <div className="home-dest-grid">
          {/* Destination 1: Paris */}
          <div className="home-dest-card">
            <div className="home-dest-banner paris"></div>
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">Paris</span>
                <span className="home-dest-country">France</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>

          {/* Destination 2: Bali */}
          <div className="home-dest-card">
            <div className="home-dest-banner bali"></div>
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">Bali</span>
                <span className="home-dest-country">Indonesia</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>

          {/* Destination 3: Dubai */}
          <div className="home-dest-card">
            <div className="home-dest-banner dubai"></div>
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">Dubai</span>
                <span className="home-dest-country">UAE</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>

          {/* Destination 4: New York */}
          <div className="home-dest-card">
            <div className="home-dest-banner newyork"></div>
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">New York</span>
                <span className="home-dest-country">USA</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-footer-grid">
          {/* Brand/logo column */}
          <div className="home-footer-brand-col">
            <Logo />
            <p className="home-footer-desc">
              Your AI travel companion for unforgettable journeys.
            </p>
          </div>

          {/* Company column */}
          <div className="home-footer-col">
            <span className="home-footer-title">Company</span>
            <div className="home-footer-links">
              <a href="#about" className="home-footer-link">About Us</a>
              <a href="#careers" className="home-footer-link">Careers</a>
              <a href="#blog" className="home-footer-link">Blog</a>
              <a href="#press" className="home-footer-link">Press</a>
            </div>
          </div>

          {/* Support column */}
          <div className="home-footer-col">
            <span className="home-footer-title">Support</span>
            <div className="home-footer-links">
              <a href="#help" className="home-footer-link">Help Center</a>
              <a href="#contact" className="home-footer-link">Contact Us</a>
              <a href="#faqs" className="home-footer-link">FAQs</a>
              <a href="#privacy" className="home-footer-link">Privacy Policy</a>
            </div>
          </div>

          {/* Resources column */}
          <div className="home-footer-col">
            <span className="home-footer-title">Resources</span>
            <div className="home-footer-links">
              <a href="#guide" className="home-footer-link">Travel Guide</a>
              <a href="#explore" className="home-footer-link">Top Destinations</a>
              <a href="#tips" className="home-footer-link">Travel Tips</a>
              <a href="#features" className="home-footer-link">AI Features</a>
            </div>
          </div>

          {/* Follow Us column with social buttons */}
          <div className="home-footer-col" id="pricing">
            <span className="home-footer-title">Follow Us</span>
            <div className="home-social-links">
              <a href="#facebook" className="home-social-btn">f</a>
              <a href="#google" className="home-social-btn">g</a>
              <a href="#twitter" className="home-social-btn">tw</a>
              <a href="#youtube" className="home-social-btn">yt</a>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom">
          <p>© 2026 Travel AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
