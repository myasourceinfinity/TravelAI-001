/**
 * PlanTripWithTravelAI.jsx
 *
 * AI-powered trip planner page. Users describe their trip, optionally upload
 * tickets, toggle Instant Plan, and submit. TravelAI generates recommended
 * destinations displayed with cards, an interactive map, and a preferences panel.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { planTrip, saveTripToDB } from '../../services/tripService';

// Map removed as requested

// ═══════════════════════════════════════════════════════════════════════════════
export default function PlanTripWithTravelAI() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  const fileInputRef = useRef(null);

  // ── Input state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('plan');    // 'plan' | 'ask'
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [instantPlan, setInstantPlan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // ── Save state ────────────────────────────────────────────────────────────
  const [tripTitle, setTripTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-redirect when saveSuccess becomes true
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        navigate('/my-trips');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, navigate]);

  // ── Result state ──────────────────────────────────────────────────────────
  const [plan, setPlan] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [routeMode, setRouteMode] = useState('auto');  // 'auto' | 'manual'

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
    setTripTitle('');
    setSaveSuccess(false);
  }

  async function handleSaveTrip() {
    if (!plan) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await saveTripToDB(accessToken, { 
        plan, 
        title: tripTitle.trim() || `${plan.startCity} Trip` 
      });
      if (response.success) {
        setSaveSuccess(true);
      }
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/');
      } else {
        setError(err.message || 'Failed to save trip.');
      }
    } finally {
      setIsSaving(false);
    }
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
          {/* <button
            className={`trip-tab${activeTab === 'ask' ? ' active' : ''}`}
            onClick={() => setActiveTab('ask')}
          >
            Ask TravelAI
          </button> */}
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
            {/* <button
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
            /> */}

            <div className="trip-input-right">
              {/* Instant Plan toggle */}
              {/* <label className="trip-toggle-label">
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
              /> */}

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
                  <div key={dest.id} className="glass-card trip-dest-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="trip-dest-card-left">
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={`https://picsum.photos/seed/${dest.id}/150/150`} 
                            alt={dest.name}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--brand-500)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                          />
                          <span 
                            style={{
                              position: 'absolute',
                              bottom: '-4px',
                              right: '-4px',
                              fontSize: '1.3rem',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                              background: 'var(--bg-800)',
                              borderRadius: '50%',
                              padding: '2px',
                              lineHeight: 1
                            }}
                          >
                            {dest.emoji}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>
                            {dest.name} <span className="text-muted" style={{ fontSize: '0.85rem' }}>{dest.country}</span>
                          </h3>
                          <p className="text-xs text-secondary" style={{ lineHeight: '1.4' }}>
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

                    {/* ── Bookme Deals Carousel ── */}
                    {dest.bookmeDeals && dest.bookmeDeals.length > 0 && (
                      <div className="bookme-deals-container">
                        <h4 className="bookme-deals-title">✨ Recommended Activities on Bookme</h4>
                        <div className="bookme-deals-scroll">
                          {dest.bookmeDeals.map((deal, i) => {
                            // Generate sensible mock values for visual fidelity
                            const rating = (4.5 + Math.random() * 0.4).toFixed(1);
                            const reviews = Math.floor(Math.random() * 3000) + 100;
                            const spaces = Math.floor(Math.random() * 10) + 2;
                            const dateStr = "20 May – 09 Jun";
                            
                            let savingsStr = "Save up to $46.00";
                            if (deal.originalPrice && deal.price) {
                              const orig = parseFloat(deal.originalPrice.replace(/[^0-9.]/g, ''));
                              const curr = parseFloat(deal.price.replace(/[^0-9.]/g, ''));
                              if (orig > curr) savingsStr = `Save up to $${(orig - curr).toFixed(2)}`;
                            }

                            return (
                              <a key={i} href={deal.link} target="_blank" rel="noreferrer" className="bookme-deal-card-new">
                                <div className="bookme-deal-header-new">
                                  <h5 className="bookme-deal-title-new">{deal.title}</h5>
                                  <div className="bookme-deal-reviews-new">
                                    <span className="bookme-stars">★★★★★</span> {rating} / {reviews} Reviews
                                  </div>
                                </div>
                                
                                <div className="bookme-deal-image-new" style={{ backgroundImage: `url(${deal.image})` }}></div>
                                
                                <div className="bookme-deal-body-new">
                                  <div className="bookme-deal-dates">
                                    <p>Best between: {dateStr}</p>
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
                                        <span className="price-value">{deal.price.replace('From ', '')}</span>
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
                ))}


              </div>
            </div>

            {/* ── Bottom actions ───────────────────────────────────────────── */}
            <div className="trip-bottom-actions">
              <div className="trip-bottom-left">
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>↩ Undo</button>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Trip Name (Optional)" 
                  value={tripTitle}
                  onChange={e => { setTripTitle(e.target.value); setSaveSuccess(false); }}
                  style={{ width: '200px' }}
                />
                <button 
                  className="btn btn-primary btn-lg trip-generate-btn" 
                  disabled={plan.destinations.length === 0 || isSaving || saveSuccess}
                  onClick={handleSaveTrip}
                >
                  {isSaving ? (
                    <><span className="spinner" style={{marginRight: '8px'}}/> Saving...</>
                  ) : saveSuccess ? (
                    'Trip Saved! ✓'
                  ) : (
                    `✦ Save Trip (${plan.destinations.length} Destination${plan.destinations.length !== 1 ? 's' : ''})`
                  )}
                </button>
              </div>
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
