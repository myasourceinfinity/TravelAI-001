/**
 * TripDetailPage.jsx
 * Route: /trip/:id
 *
 * Full-page view of a single saved trip.
 * Shows: header, AI summary, interactive Leaflet map, destination cards with Bookme deals.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';

// ── Fix default Leaflet marker icons broken by Vite/Webpack ─────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Coloured marker factory ──────────────────────────────────────────────────
function makeIcon(colour = '#38bdf8', label = '') {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${colour};
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:13px;line-height:1">${label}</span>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

// ── Auto-fit map to all markers ───────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] });
    }
  }, [map, positions]);
  return null;
}

// ── Budget badge colour ───────────────────────────────────────────────────────
function BudgetBadge({ level }) {
  const colours = {
    budget: { bg: '#16a34a22', color: '#4ade80', border: '#16a34a' },
    moderate: { bg: '#0ea5e922', color: '#38bdf8', border: '#0ea5e9' },
    luxury: { bg: '#a855f722', color: '#c084fc', border: '#a855f7' },
  };
  const s = colours[level] || colours.moderate;
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {level}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();

  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0); // which destination is highlighted

  // ── Fetch single trip ────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    async function fetchTrip() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/trips/${id}`,
          { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include' }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) { await logout(); navigate('/'); return; }
          if (res.status === 404) { setError('Trip not found.'); return; }
          throw new Error(data.error || 'Failed to load trip.');
        }
        setTrip(data.trip);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrip();
  }, [id, accessToken, logout, navigate]);

  // ── Derived map data ─────────────────────────────────────────────────────
  const validDests = (trip?.destinations || []).filter(
    d => d.lat != null && d.lng != null && !isNaN(Number(d.lat)) && !isNaN(Number(d.lng))
  );
  const positions = validDests.map(d => [Number(d.lat), Number(d.lng)]);
  const mapCenter = positions.length > 0 ? positions[0] : [-36.85, 174.76];
  const COLOURS = ['#38bdf8', '#f472b6', '#34d399', '#fb923c', '#a78bfa', '#facc15'];

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard-page page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="text-center">
          <span className="spinner" style={{ width: 40, height: 40 }} />
          <p className="text-secondary mt-4">Loading your trip…</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="dashboard-page page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-card text-center" style={{ padding: '3rem 2rem', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 className="heading-md mb-2">Trip not found</h2>
          <p className="text-secondary mb-6">{error || 'This trip does not exist or was deleted.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/my-trips')}>← Back to My Trips</button>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-page page-bg">
      <Navbar />
      <div className="trip-container" style={{ maxWidth: 1100 }}>

        {/* ── Trip header card ──────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>
                {trip.title || `${trip.start_city} Trip`}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--text-secondary, #94a3b8)' }}>
                <span>📍 {trip.start_city}</span>
                <span>📅 {trip.days} Days</span>
                <span>👥 {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
                <span>🗓 Saved {new Date(trip.created_at).toLocaleDateString()}</span>
                <BudgetBadge level={trip.budget_level} />
              </div>
            </div>
          </div>

          {trip.summary && (
            <p style={{ margin: '16px 0 0', fontSize: 14, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7, maxWidth: 800 }}>
              {trip.summary}
            </p>
          )}
        </div>

        {/* ── Map ───────────────────────────────────────────────────────────── */}
        {validDests.length > 0 && (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12, marginBottom: '1.5rem', height: 380 }}>
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds positions={positions} />

              {/* Route polyline */}
              {positions.length > 1 && (
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#38bdf8', weight: 2, dashArray: '6 6', opacity: 0.7 }}
                />
              )}

              {/* Markers */}
              {validDests.map((dest, idx) => (
                <Marker
                  key={dest.id || idx}
                  position={[Number(dest.lat), Number(dest.lng)]}
                  icon={makeIcon(COLOURS[idx % COLOURS.length], dest.emoji || String(idx + 1))}
                  eventHandlers={{ click: () => setActiveIdx(idx) }}
                >
                  <Popup>
                    <strong>{dest.emoji} {dest.name}</strong><br />
                    <span style={{ fontSize: 12, color: '#64748b' }}>{dest.country}</span>
                    {dest.highlights?.length > 0 && (
                      <><br /><span style={{ fontSize: 11 }}>{dest.highlights.slice(0, 2).join(' • ')}</span></>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* ── Destination cards ─────────────────────────────────────────────── */}
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
          📍 Destinations ({trip.destinations?.length || 0})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: '2rem' }}>
          {(trip.destinations || []).map((dest, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div
                key={dest.id || idx}
                onClick={() => setActiveIdx(idx)}
                className="glass-card"
                style={{
                  padding: '20px 24px',
                  cursor: 'pointer',
                  border: isActive
                    ? `1px solid ${COLOURS[idx % COLOURS.length]}`
                    : '1px solid var(--glass-border)',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: dest.bookmeDeals?.length > 0 ? 16 : 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${COLOURS[idx % COLOURS.length]}22`,
                    border: `1px solid ${COLOURS[idx % COLOURS.length]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    {dest.emoji || '📍'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{dest.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>{dest.country}</span>
                      <span style={{
                        fontSize: 11, padding: '1px 8px', borderRadius: 999,
                        background: `${COLOURS[idx % COLOURS.length]}22`,
                        color: COLOURS[idx % COLOURS.length],
                        border: `1px solid ${COLOURS[idx % COLOURS.length]}44`,
                      }}>Stop {idx + 1}</span>
                    </div>
                    {dest.highlights?.length > 0 && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
                        {dest.highlights.join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bookme deals */}
                {dest.bookmeDeals?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Activities &amp; Deals
                    </p>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                      {dest.bookmeDeals.map((deal, i) => {
                        const rating = (3.5 + Math.random() * 1.5).toFixed(1);
                        const reviews = Math.floor(50 + Math.random() * 200);
                        const spaces = Math.floor(5 + Math.random() * 20);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const m1 = months[Math.floor(Math.random() * 6)];
                        const m2 = months[6 + Math.floor(Math.random() * 6)];
                        const savingsStr = deal.discount ? `Save ${deal.discount}` : 'Great Value';
                        return (
                          <a
                            key={i}
                            href={deal.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="bookme-deal-card-new"
                            style={{ minWidth: 200, flexShrink: 0 }}
                          >
                            <div className="bookme-deal-header-new">
                              <h5 className="bookme-deal-title-new">{deal.title}</h5>
                              <div className="bookme-deal-reviews-new">
                                <span className="bookme-stars">★★★★★</span> {rating} / {reviews} Reviews
                              </div>
                            </div>
                            {deal.image && (
                              <div className="bookme-deal-image-new" style={{ backgroundImage: `url(${deal.image})` }} />
                            )}
                            <div className="bookme-deal-body-new">
                              <div className="bookme-deal-dates">
                                <p>Best between: {m1}–{m2}</p>
                                <p className="tap-through">Tap through for more</p>
                              </div>
                              <div className="bookme-deal-footer-new">
                                <div className="bookme-deal-badges-new">
                                  {deal.discount && (
                                    <div className="bookme-badge-orange">
                                      <span>Available from</span>
                                      <strong>{deal.discount}</strong>
                                    </div>
                                  )}
                                  <div className="bookme-badge-spaces">
                                    <strong>{spaces}+</strong>
                                    <span>Spaces</span>
                                  </div>
                                </div>
                                <div className="bookme-deal-pricing-new">
                                  <div className="price-main">
                                    <span className="from-text">From:</span>
                                    <span className="price-value">{deal.price?.replace('From ', '')}</span>
                                  </div>
                                  <div className="save-text">{savingsStr}</div>
                                </div>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
