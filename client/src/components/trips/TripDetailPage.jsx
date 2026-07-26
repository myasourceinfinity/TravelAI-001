/**
 * TripDetailPage.jsx — /trip/:id
 * Full view of a saved trip: header, Leaflet map, AI-generated destination cards.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';

// ── Curated hero images (same map as plan-trip) ──────────────────────────────
const DEST_IMAGES = {
  'auckland':      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=75',
  'wellington':    'https://images.unsplash.com/photo-1577048982768-5cb3e7ddfa23?w=800&q=75',
  'rotorua':       'https://images.unsplash.com/photo-1583236070780-6ece19db7fa7?w=800&q=75',
  'queenstown':    'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=800&q=75',
  'christchurch':  'https://images.unsplash.com/photo-1547300352-2c6fee46e3a2?w=800&q=75',
  'dunedin':       'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=800&q=75',
  'tauranga':      'https://images.unsplash.com/photo-1570737209810-87a8e7245f88?w=800&q=75',
  'milford sound': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=75',
  'fiordland':     'https://images.unsplash.com/photo-1589196728941-5f04fc59d7f3?w=800&q=75',
  'tongariro':     'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=75',
  'dubai':         'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=75',
  'abu dhabi':     'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=75',
};

function getDestImage(dest) {
  const key = (dest.name || '').toLowerCase();
  if (DEST_IMAGES[key]) return DEST_IMAGES[key];
  for (const [k, url] of Object.entries(DEST_IMAGES))
    if (key.includes(k) || k.includes(key)) return url;
  if ((dest.country || '').toLowerCase().includes('zealand'))
    return 'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?w=800&q=75';
  if ((dest.country || '').toLowerCase().includes('emirates'))
    return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=75';
  return 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=75';
}

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

// ── Auto-fit map to all markers ─────────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      // Single destination — fitBounds on one point zooms to max; use city-level zoom instead
      map.setView(positions[0], 11);
    } else if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] });
    }
  }, [map, positions]);
  return null;
}

// ── Budget badge ─────────────────────────────────────────────────────────────
const BUDGET_STYLES = {
  budget:   { bg: 'rgba(52,211,153,0.12)',  color: '#065f46', border: 'rgba(52,211,153,0.3)'  },
  moderate: { bg: 'rgba(251,191,36,0.12)',  color: '#78350f', border: 'rgba(251,191,36,0.3)'  },
  luxury:   { bg: 'rgba(167,139,250,0.12)', color: '#2e1065', border: 'rgba(167,139,250,0.3)' },
};
function BudgetBadge({ level }) {
  const s = BUDGET_STYLES[level] || BUDGET_STYLES.moderate;
  return (
    <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize' }}>
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
    <div style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 5%' }}>

        {/* ── Trip header ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px 28px', marginBottom: '1.5rem', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 4px 20px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: trip.summary ? 16 : 0 }}>
            <div>
              <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {trip.title || `${trip.start_city} Trip`}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#64748b', alignItems: 'center' }}>
                <span>📍 {trip.start_city}</span>
                <span>📅 {trip.days} Days</span>
                <span>👥 {trip.travelers} {trip.travelers === 1 ? 'Traveller' : 'Travellers'}</span>
                <span>🗓 Saved {new Date(trip.created_at).toLocaleDateString()}</span>
                <BudgetBadge level={trip.budget_level} />
              </div>
            </div>
            <button
              onClick={() => navigate('/my-trips')}
              style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#475569', whiteSpace: 'nowrap' }}
            >
              ← My Trips
            </button>
          </div>
          {trip.summary && (
            <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.7, maxWidth: 800, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #818cf8' }}>
              {trip.summary}
            </p>
          )}
        </div>

        {/* ── Map ── */}
        {validDests.length > 0 && (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem', height: 340, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 4px 20px rgba(15,23,42,0.05)' }}>
            <MapContainer center={mapCenter} zoom={5} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds positions={positions} />
              {positions.length > 1 && (
                <Polyline positions={positions} pathOptions={{ color: '#4f46e5', weight: 2.5, dashArray: '6 6', opacity: 0.8 }} />
              )}
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
                      <><br /><span style={{ fontSize: 11 }}>{dest.highlights.slice(0, 2).join(' · ')}</span></>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* ── Destination cards ── */}
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          📍 Destinations
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>({trip.destinations?.length || 0} stops)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: '2rem' }}>
          {(trip.destinations || []).map((dest, idx) => {
            const isActive   = idx === activeIdx;
            const accentCol  = COLOURS[idx % COLOURS.length];
            const heroImg    = getDestImage(dest);
            return (
              <div
                key={dest.id || idx}
                onClick={() => setActiveIdx(idx)}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: `2px solid ${isActive ? accentCol : 'rgba(15,23,42,0.08)'}`,
                  boxShadow: isActive ? `0 8px 30px ${accentCol}22` : '0 2px 12px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Hero image */}
                <div style={{ position: 'relative', height: 160, flexShrink: 0 }}>
                  <img
                    src={heroImg}
                    alt={dest.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=75'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />
                  {/* Stop badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10, background: accentCol, color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                    Stop {idx + 1}
                  </div>
                  {/* Destination name overlay */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1.2rem' }}>{dest.emoji || '📍'}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{dest.name}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{dest.country}</span>
                    </div>
                  </div>
                </div>

                {/* Card body: AI Highlights */}
                <div style={{ padding: '14px 16px', flex: 1 }}>
                  {dest.highlights?.length > 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        🤖 AI Highlights
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {dest.highlights.map((h, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                            <span style={{ color: accentCol, fontSize: 10, marginTop: 4, flexShrink: 0 }}>✦</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No highlights recorded.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
