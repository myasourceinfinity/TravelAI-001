/**
 * PlanTripWithTravelAI.jsx
 *
 * AI-powered trip planner page. Users describe their trip, optionally upload
 * tickets, toggle Instant Plan, and submit. TravelAI generates recommended
 * destinations displayed with cards, an interactive map, and a preferences panel.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { planTrip } from '../../services/tripService';

// ── Leaflet icon fix ────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createEmojiIcon = (emoji) => L.divIcon({
  className: 'custom-emoji-marker',
  html: `<div style="font-size:24px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5))">${emoji}</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15],
});

// ── Map auto-fit component ──────────────────────────────────────────────────
function MapFitter({ destinations }) {
  const map = useMap();
  useEffect(() => {
    if (destinations.length > 0) {
      const bounds = L.latLngBounds(destinations.map(d => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }
  }, [destinations, map]);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PlanTripWithTravelAI() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  const fileInputRef = useRef(null);

  // ── Input state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState('plan');    // 'plan' | 'ask'
  const [description, setDescription]   = useState('');
  const [files, setFiles]               = useState([]);
  const [instantPlan, setInstantPlan]   = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);

  // ── Result state ──────────────────────────────────────────────────────────
  const [plan, setPlan]                 = useState(null);
  const [showPrefs, setShowPrefs]       = useState(false);
  const [routeMode, setRouteMode]       = useState('auto');  // 'auto' | 'manual'

  // ── Preferences state ─────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    adults: 2, children: 0,
    dietary: 'No Restrictions',
    openToDriving: true,
    starRating: 'Auto select',
    travelClass: 'Auto select',
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleFileSelect(e) {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const data = await planTrip(accessToken, { description: description.trim(), instantPlan });
      setPlan(data.plan);

      // Sync travelers from AI response
      if (data.plan.travelers) {
        setPrefs(p => ({ ...p, adults: data.plan.travelers }));
      }
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/');
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setPlan(null);
    setDescription('');
    setFiles([]);
    setError(null);
  }

  function removeDestination(id) {
    if (!plan) return;
    setPlan(prev => ({
      ...prev,
      destinations: prev.destinations.filter(d => d.id !== id),
    }));
  }

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="trip-page page-bg">
      <div className="trip-container">

        {/* ═══ Top bar ═══════════════════════════════════════════════════════ */}
        <header className="trip-topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="heading-md gradient-text">TravelAI</h1>
        </header>

        {/* ═══ Hero ═══════════════════════════════════════════════════════════ */}
        <div className="trip-hero text-center">
          <p className="text-secondary" style={{ fontSize: '1.05rem' }}>
            Your personal travel agent with AI superpowers
          </p>
        </div>

        {/* ═══ Tab toggle ═════════════════════════════════════════════════════ */}
        <div className="trip-tabs">
          <button
            className={`trip-tab${activeTab === 'plan' ? ' active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Plan a Trip
          </button>
          <button
            className={`trip-tab${activeTab === 'ask' ? ' active' : ''}`}
            onClick={() => setActiveTab('ask')}
          >
            Ask TravelAI
          </button>
        </div>

        {/* ═══ Input card ═════════════════════════════════════════════════════ */}
        <div className="glass-card trip-input-card">
          <textarea
            className="trip-textarea"
            placeholder={activeTab === 'plan'
              ? 'Simply describe your trip …'
              : 'Ask TravelAI anything about travel …'}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />

          {/* ── Attached files ────────────────────────────────────────────── */}
          {files.length > 0 && (
            <div className="trip-files">
              {files.map((f, i) => (
                <span key={i} className="trip-file-chip">
                  📎 {f.name}
                  <button className="trip-file-remove" onClick={() => removeFile(i)}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* ── Bottom toolbar ────────────────────────────────────────────── */}
          <div className="trip-input-toolbar">
            <button
              type="button"
              className="trip-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <span className="trip-upload-icon">☁️</span>
              Upload Tickets
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.eml"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <div className="trip-input-right">
              {/* Instant Plan toggle */}
              <label className="trip-toggle-label">
                <span className={`trip-toggle-track${instantPlan ? ' on' : ''}`}>
                  <span className="trip-toggle-thumb" />
                </span>
                <span className="text-sm text-secondary">Instant Plan</span>
              </label>
              <input
                type="checkbox"
                checked={instantPlan}
                onChange={() => setInstantPlan(p => !p)}
                style={{ display: 'none' }}
              />

              <button
                className={`btn btn-primary btn-sm trip-submit-btn${!description.trim() ? ' disabled' : ''}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting
                  ? <><span className="spinner" /> Generating…</>
                  : <>Submit <span style={{ marginLeft: 4 }}>→</span></>}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Error ══════════════════════════════════════════════════════════ */}
        {error && (
          <div className="alert alert-error">⚠️ {error}</div>
        )}

        {/* ═══ AI Results ═════════════════════════════════════════════════════ */}
        {plan && (
          <div className="trip-results phase-enter">

            {/* ── AI summary ─────────────────────────────────────────────── */}
            <div className="glass-card trip-summary-card">
              <p className="trip-summary-text">{plan.summary}</p>
              <p className="text-xs text-muted mt-2">
                You can confirm these destinations or make any changes before I generate your complete trip.
              </p>
            </div>

            {/* ── Controls row ────────────────────────────────────────────── */}
            <div className="trip-controls-row">
              <h2 className="heading-md">
                Destinations <span className="trip-dest-count">{plan.destinations.length}</span>
              </h2>
              <div className="trip-controls-right">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowPrefs(p => !p)}
                >
                  👥 {prefs.adults + prefs.children} Traveler{prefs.adults + prefs.children !== 1 ? 's' : ''} ▾
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowPrefs(p => !p)}
                >
                  ⚙️ Trip Preferences
                </button>
              </div>
            </div>

            {/* ── Main content: destinations + map ────────────────────────── */}
            <div className="trip-content-grid">

              {/* LEFT: destination list */}
              <div className="trip-dest-list">
                {/* Start city */}
                <div className="trip-start-city">
                  <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Start / End
                  </span>
                  <span className="text-sm">{plan.startCity} ✏️</span>
                </div>

                <p className="text-xs text-secondary mb-4">
                  These are places where you'll spend at least one night.
                </p>

                {plan.destinations.map(dest => (
                  <div key={dest.id} className="glass-card trip-dest-card">
                    <div className="trip-dest-card-left">
                      <span className="trip-dest-emoji">{dest.emoji}</span>
                      <div>
                        <h3 className="text-sm" style={{ fontWeight: 600 }}>
                          {dest.name} <span className="text-muted">{dest.country}</span>
                        </h3>
                        <p className="text-xs text-secondary">
                          Highlights include {dest.highlights.slice(0, 2).join(', ')}
                          {dest.highlights.length > 2 ? ` and ${dest.highlights.length - 2} more` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      className="trip-dest-remove"
                      onClick={() => removeDestination(dest.id)}
                      title="Remove destination"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Add destination + suggestions */}
                <div className="trip-add-row">
                  <button className="link text-sm">⊕ Add Another Destination</button>
                  {plan.suggestions.length > 0 && (
                    <button className="link text-sm">
                      {plan.suggestions.length} Suggestion{plan.suggestions.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>

                {/* Route mode */}
                <div className="trip-route-options">
                  <label className={`trip-route-option${routeMode === 'auto' ? ' selected' : ''}`}>
                    <input type="radio" name="routeMode" checked={routeMode === 'auto'} onChange={() => setRouteMode('auto')} />
                    <span>◉ Suggest the best possible route</span>
                  </label>
                  <label className={`trip-route-option${routeMode === 'manual' ? ' selected' : ''}`}>
                    <input type="radio" name="routeMode" checked={routeMode === 'manual'} onChange={() => setRouteMode('manual')} />
                    <span>○ I'll choose the order</span>
                  </label>
                </div>
              </div>

              {/* RIGHT: map */}
              <div className="trip-map-wrap">
                <MapContainer
                  center={[35, 137]}
                  zoom={5}
                  scrollWheelZoom
                  style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={18}
                  />
                  <MapFitter destinations={plan.destinations} />
                  {plan.destinations.map(dest => (
                    <Marker key={dest.id} position={[dest.lat, dest.lng]} icon={createEmojiIcon(dest.emoji)}>
                      <Popup className="custom-popup">
                        <strong>{dest.name}</strong>, {dest.country}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {dest.highlights[0]}
                        </span>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* ── Bottom actions ───────────────────────────────────────────── */}
            <div className="trip-bottom-actions">
              <div className="trip-bottom-left">
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>↩ Undo</button>
              </div>
              <button className="btn btn-primary btn-lg trip-generate-btn" disabled={plan.destinations.length === 0}>
                ✦ Generate Trip with {plan.destinations.length} Destination{plan.destinations.length !== 1 ? 's' : ''}
              </button>
            </div>

            {/* ═══ Preferences side panel ═════════════════════════════════════ */}
            {showPrefs && (
              <div className="trip-prefs-overlay" onClick={() => setShowPrefs(false)}>
                <div className="glass-card trip-prefs-panel phase-enter" onClick={e => e.stopPropagation()}>
                  <div className="trip-prefs-header">
                    <button className="trip-prefs-close" onClick={() => setShowPrefs(false)}>✕</button>
                    <h3 className="heading-md">Trip Preferences</h3>
                  </div>

                  {/* General */}
                  <div className="trip-prefs-section">
                    <h4 className="trip-prefs-section-title">General</h4>

                    <div className="trip-prefs-row">
                      <span>Adults</span>
                      <div className="trip-counter">
                        <button onClick={() => setPrefs(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}>−</button>
                        <span>{prefs.adults}</span>
                        <button onClick={() => setPrefs(p => ({ ...p, adults: p.adults + 1 }))}>+</button>
                      </div>
                    </div>

                    <div className="trip-prefs-row">
                      <span>Children</span>
                      <div className="trip-counter">
                        <button onClick={() => setPrefs(p => ({ ...p, children: Math.max(0, p.children - 1) }))}>−</button>
                        <span>{prefs.children}</span>
                        <button onClick={() => setPrefs(p => ({ ...p, children: p.children + 1 }))}>+</button>
                      </div>
                    </div>

                    <div className="trip-prefs-row">
                      <span>Any Dietary Restrictions</span>
                      <select
                        className="form-input"
                        style={{ maxWidth: 200 }}
                        value={prefs.dietary}
                        onChange={e => setPrefs(p => ({ ...p, dietary: e.target.value }))}
                      >
                        <option>No Restrictions</option>
                        <option>Vegetarian</option>
                        <option>Vegan</option>
                        <option>Halal</option>
                        <option>Kosher</option>
                        <option>Gluten Free</option>
                      </select>
                    </div>

                    <div className="trip-prefs-row">
                      <span>Open to Driving?</span>
                      <div className="trip-yn-btns">
                        <button className={`trip-yn${!prefs.openToDriving ? ' active' : ''}`} onClick={() => setPrefs(p => ({ ...p, openToDriving: false }))}>No</button>
                        <button className={`trip-yn${prefs.openToDriving ? ' active' : ''}`} onClick={() => setPrefs(p => ({ ...p, openToDriving: true }))}>Yes</button>
                      </div>
                    </div>
                  </div>

                  {/* Hotel */}
                  <div className="trip-prefs-section">
                    <h4 className="trip-prefs-section-title">Hotel Preferences</h4>
                    <div className="trip-prefs-row">
                      <span>Star Rating</span>
                      <select
                        className="form-input"
                        style={{ maxWidth: 200 }}
                        value={prefs.starRating}
                        onChange={e => setPrefs(p => ({ ...p, starRating: e.target.value }))}
                      >
                        <option>Auto select</option>
                        <option>3 Stars</option>
                        <option>4 Stars</option>
                        <option>5 Stars</option>
                      </select>
                    </div>
                  </div>

                  {/* Flight */}
                  <div className="trip-prefs-section">
                    <h4 className="trip-prefs-section-title">Flight Preferences</h4>
                    <div className="trip-prefs-row">
                      <span>Travel Class</span>
                      <select
                        className="form-input"
                        style={{ maxWidth: 200 }}
                        value={prefs.travelClass}
                        onChange={e => setPrefs(p => ({ ...p, travelClass: e.target.value }))}
                      >
                        <option>Auto select</option>
                        <option>Economy Class</option>
                        <option>Premium Economy Class</option>
                        <option>Business Class</option>
                        <option>First Class</option>
                      </select>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-full mt-4" onClick={() => setShowPrefs(false)}>
                    Confirm Choices
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
