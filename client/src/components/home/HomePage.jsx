import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';
import './HomePage.css';
import travelAILogo from '../../assets/travelai-logo.png';
import { getRecentSearches, saveRecentSearchToDB } from '../../services/recentSearchService';

// ── Inline Logo for footer (Navbar has its own) ──────────────────────────────

// ── Logo using real brand image ───────────────────────────────────────────────
const Logo = ({ height = 40 }) => (
  <img
    src={travelAILogo}
    alt="Travel AI"
    style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
  />
);

//Traveller homepage
const TRAVELLER_ROLES = ['traveller', 'traveler', 'user'];

function getUserRole(user) {
    return String(
      user?.role_type ||
      user?.role ||
      user?.type ||
      ''
    ).trim().toLowerCase();
}

function formatSearchDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

//

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout, accessToken } = useAuth();
  const [description, setDescription] = useState('');

//traveller homepage
  const [recentSearches, setRecentSearches] = useState([]);
  const userRole = getUserRole(user);
 
  const isTravellerHome =
  Boolean(user) &&
  TRAVELLER_ROLES.includes(userRole);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentSearches() {
      if (!isTravellerHome || !accessToken) {
        setRecentSearches([]);
        return;
      }

      try {
        const data = await getRecentSearches(accessToken);

        if (!cancelled) {
          setRecentSearches(data.recentSearches || []);
        }
      } catch (err) {
        console.error('[HomePage] Failed to load recent searches:', err);
      }
    }

    loadRecentSearches();

    return () => {
      cancelled = true;
    };
  }, [isTravellerHome, accessToken]);

  async function saveRecentSearch(query) {
    const cleanQuery = String(query || '').trim();

    if (!cleanQuery || !accessToken || !isTravellerHome) return;

    try {
      const data = await saveRecentSearchToDB(accessToken, cleanQuery);
      setRecentSearches(data.recentSearches || []);
    } catch (err) {
      console.error('[HomePage] Failed to save recent search:', err);
    }
  }
//

  // ── Handle Generation click ───────────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();

    const cleanDescription = description.trim();

    if (cleanDescription) {
      sessionStorage.setItem('pending_trip_description', cleanDescription);

      if (isTravellerHome) {
        await saveRecentSearch(cleanDescription);
      }
    }

    navigate('/plan-trip');
  }

  //Traveller homepage
  function handleRecentSearchClick(query) {
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) return;

    sessionStorage.setItem('pending_trip_description', cleanQuery);
    navigate('/plan-trip');
  }
  //

  // ── Handle Logout click ───────────────────────────────────────────────────
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="home-page-container">
      {/* ── Navigation Header ──────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      {isTravellerHome ? (
        <header className="traveller-home-section">
          <div className="traveller-home-grid">
            <div className="traveller-home-card traveller-home-hero-card">
              <span className="traveller-home-badge">AI Travel Assistant</span>

              <h1 className="home-hero-title">
                Plan your trip<br />
                with <span className="ai-highlight">AI</span> in seconds
              </h1>

              <p className="home-hero-subtitle">
                Get personalized itineraries, discover the best places,<br />
                and travel smarter with our AI travel assistant.
              </p>

              <div className="home-generator-card traveller-generator-card">
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

            <aside className="traveller-home-card traveller-recent-card">
              <div className="traveller-recent-header">
                <div>
                  <span className="traveller-recent-kicker">AI History</span>
                  <h2>Recent Search</h2>
                </div>
                <span className="traveller-recent-count">
                  {recentSearches.length}/5
                </span>
              </div>

              {recentSearches.length === 0 ? (
                <div className="traveller-recent-empty">
                  <p>No recent searches yet.</p>
                  <span>Your AI trip searches will appear here.</span>
                </div>
              ) : (
                <div className="traveller-recent-list">
                  {recentSearches.map((item, index) => (
                    <button
                      key={item.id || index}
                      type="button"
                      className="traveller-recent-item"
                      onClick={() => handleRecentSearchClick(item.query)}
                    >
                      <span className="traveller-recent-number">{index + 1}</span>

                      <span className="traveller-recent-text">
                        <strong>{item.query}</strong>
                        <small>{formatSearchDate(item.createdAt)}</small>
                      </span>

                      <span className="traveller-recent-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </header>
      ) : (
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

          <div className="home-hero-right">
            <div className="home-orb home-orb-shadow-beige"></div>
            <div className="home-orb home-orb-shadow-small"></div>
            <div className="home-orb home-orb-pink"></div>
            <div className="home-orb home-orb-blue"></div>
            <div className="home-orb home-orb-orange"></div>
            <div className="home-orb home-orb-large-yellow"></div>
            <div className="home-orb home-orb-large-blue"></div>
          </div>
        </header>
      )}

      {/* ── "Why Choose Us" Section ───────────────────────────────────────── */}
      {!isTravellerHome && (
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
      )}

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
            <Logo height={32} />
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
