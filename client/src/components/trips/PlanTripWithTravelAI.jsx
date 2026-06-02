/**
 * PlanTripWithTravelAI.jsx
 *
 * Flow:
 *  1. User enters prompt → AI generates destination cards
 *  2. Agent packages fetched from DB for matching destinations
 *  3. Agent package destinations displayed as cards identical to AI cards
 *  4. All destinations (AI + agent) shown together — no labels, no checkboxes
 *  5. Save Trip → full plan saved to DB
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { planTrip, saveTripToDB } from '../../services/tripService';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Component type icons for package detail rows ─────────────────────────────
const COMPONENT_META = {
  flight:   { icon: '✈️', colour: '#38bdf8' },
  hotel:    { icon: '🏨', colour: '#a78bfa' },
  activity: { icon: '🎯', colour: '#34d399' },
  transfer: { icon: '🚌', colour: '#fb923c' },
};

// ── Map component_type → destination emoji for the card avatar ───────────────
function packageEmoji(pkg) {
  const name = (pkg.destination_name || '').toLowerCase();
  if (name.includes('auckland'))    return '🌆';
  if (name.includes('wellington'))  return '🌧️';
  if (name.includes('rotorua'))     return '🌋';
  if (name.includes('queenstown'))  return '🏔️';
  if (name.includes('christchurch'))return '🌿';
  if (name.includes('tauranga'))    return '🏖️';
  return '📍';
}

// ── Single destination card — used for BOTH AI and agent package destinations ─
// agentPkg is passed only for agent cards; null for AI cards
function DestinationCard({ dest, onRemove, agentPkg }) {
  return (
    <div className="glass-card trip-dest-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="trip-dest-card-left">
          <div style={{ position: 'relative' }}>
            <img
              src={`https://picsum.photos/seed/${dest.id}/150/150`}
              alt={dest.name}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-500)', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}
            />
            <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: '1.3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))', background: 'var(--bg-800)', borderRadius: '50%', padding: 2, lineHeight: 1 }}>
              {dest.emoji}
            </span>
          </div>
          <div>
            <h3 className="text-sm" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>
              {dest.name} <span className="text-muted" style={{ fontSize: '0.85rem' }}>{dest.country}</span>
            </h3>
            <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>
              Highlights include {dest.highlights.slice(0, 2).join(', ')}
              {dest.highlights.length > 2 ? ` and ${dest.highlights.length - 2} more` : ''}
            </p>
          </div>
        </div>
        <button className="trip-dest-remove" onClick={() => onRemove(dest.id)} title="Remove">✕</button>
      </div>

      {/* Bookme deals — AI cards only */}
      {!agentPkg && dest.bookmeDeals?.length > 0 && (
        <div className="bookme-deals-container">
          <h4 className="bookme-deals-title">✨ Recommended Activities on Bookme</h4>
          <div className="bookme-deals-scroll">
            {dest.bookmeDeals.map((deal, i) => {
              const rating    = (4.5 + Math.random() * 0.4).toFixed(1);
              const reviews   = Math.floor(Math.random() * 3000) + 100;
              const spaces    = Math.floor(Math.random() * 10) + 2;
              const dateStr   = '20 May – 09 Jun';
              let   savingsStr = 'Save up to $46.00';
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
                  <div className="bookme-deal-image-new" style={{ backgroundImage: `url(${deal.image})` }} />
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

      {/* Package inclusions — agent cards only */}
      {agentPkg && agentPkg.components?.length > 0 && (
        <div className="bookme-deals-container">
          <h4 className="bookme-deals-title">🗂️ Package Inclusions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agentPkg.components.map((comp, i) => {
              const meta = COMPONENT_META[comp.component_type] || { icon: '📌', colour: '#94a3b8' };
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: `${meta.colour}0f`,
                  border: `1px solid ${meta.colour}22`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main, #f1f5f9)' }}>
                        {comp.title}
                      </div>
                      {comp.provider && (
                        <div style={{ fontSize: 11, color: '#64748b' }}>via {comp.provider}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {(() => {
                      // Handle both snake_case (DB direct) and camelCase (API normalised)
                      const price = parseFloat(comp.price_per_person ?? comp.pricePerPerson ?? 0);
                      return price > 0 ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: meta.colour }}>
                            NZD ${price.toFixed(0)}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>pp</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Included</div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
            {/* Package total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 4, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(56,189,248,0.06)', border: '1px solid #38bdf822',
            }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {agentPkg.duration_days}-day package · {agentPkg.components.length} inclusions
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                  NZD ${parseFloat(agentPkg.price_per_person || agentPkg.pricePerPerson || 0).toFixed(0)}
                </span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>pp</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PlanTripWithTravelAI() {
  const navigate   = useNavigate();
  const { accessToken, logout } = useAuth();
  const fileInputRef = useRef(null);

  // ── Input state ─────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('plan');
  const [description,  setDescription]  = useState('');
  const [files,        setFiles]        = useState([]);
  const [instantPlan,  setInstantPlan]  = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState(null);

  // ── Save state ───────────────────────────────────────────────────────────
  const [tripTitle,   setTripTitle]   = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Result state ─────────────────────────────────────────────────────────
  const [plan,        setPlan]        = useState(null);
  // agentPackages: array of raw package objects from DB
  const [agentPackages, setAgentPackages] = useState([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [showPrefs,   setShowPrefs]   = useState(false);

  // ── Preferences ──────────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    adults: 2, children: 0,
    dietary: 'No Restrictions',
    openToDriving: true,
    starRating: 'Auto select',
    travelClass: 'Auto select',
  });
  const travelers = prefs.adults + prefs.children;

  // Auto-redirect after save
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => navigate('/my-trips'), 800);
      return () => clearTimeout(t);
    }
  }, [saveSuccess, navigate]);

  // ── Fetch agent packages when AI plan arrives ────────────────────────────
  useEffect(() => {
    if (!plan) return;
    setAgentPackages([]);
    const destNames = (plan.destinations || []).map(d => d.name).filter(Boolean).join(',');
    if (!destNames) return;

    setLoadingPkgs(true);
    fetch(`${API}/packages?destinations=${encodeURIComponent(destNames)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setAgentPackages(data.packages || []))
      .catch(() => {})
      .finally(() => setLoadingPkgs(false));
  }, [plan, accessToken]);

  // ── Convert agent packages into destination-card-shaped objects ───────────
  function packageToDestCard(pkg) {
    const components = pkg.components || [];
    // Build highlights from component titles
    const highlights = components.slice(0, 3).map(c => c.title);
    return {
      id:         `pkg-${pkg.id}`,
      name:       pkg.destination_name,
      country:    pkg.country || 'New Zealand',
      emoji:      packageEmoji(pkg),
      highlights: highlights.length ? highlights : [pkg.package_name],
      bookmeDeals: [],   // agent cards don't have Bookme deals
    };
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  function removeFile(idx) { setFiles(prev => prev.filter((_, i) => i !== idx)); }

  function handleReset() {
    setPlan(null); setDescription(''); setFiles([]);
    setError(null); setTripTitle(''); setSaveSuccess(false);
    setAgentPackages([]);
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setIsSubmitting(true); setError(null);
    try {
      const data = await planTrip(accessToken, { description: description.trim(), instantPlan });
      setPlan(data.plan);
      if (data.plan.travelers) setPrefs(p => ({ ...p, adults: data.plan.travelers }));
    } catch (err) {
      if (err.status === 401) { await logout(); navigate('/'); }
      else setError(err.message);
    } finally { setIsSubmitting(false); }
  }

  function removeDestination(id) {
    if (!plan) return;
    // Remove from AI destinations
    if (!id.startsWith('pkg-')) {
      setPlan(prev => ({
        ...prev,
        destinations: prev.destinations.filter(d => d.id !== id),
      }));
    } else {
      // Remove from agent packages
      const pkgId = id.replace('pkg-', '');
      setAgentPackages(prev => prev.filter(p => p.id !== pkgId));
    }
  }

  async function handleSaveTrip() {
    if (!plan) return;
    setIsSaving(true); setError(null); setSaveSuccess(false);
    try {
      const response = await saveTripToDB(accessToken, {
        plan,
        title:               tripTitle.trim() || `${plan.startCity} Trip`,
        selectedComponents:  [],        // no individual selection in this UI
        totalPricePerPerson: 0,
        totalPriceAll:       0,
        selectedPackageIds:  agentPackages.map(p => p.id),
      });
      if (response.success) setSaveSuccess(true);
    } catch (err) {
      if (err.status === 401) { await logout(); navigate('/'); }
      else setError(err.message || 'Failed to save trip.');
    } finally { setIsSaving(false); }
  }

  // ── All destination cards to render: AI first, then agent packages ────────
  const allDestCards = [
    ...(plan?.destinations || []).map(d => ({ dest: d, agentPkg: null })),
    ...agentPackages.map(pkg => ({ dest: packageToDestCard(pkg), agentPkg: pkg })),
  ];

  const totalCount = allDestCards.length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="trip-page page-bg">
      <div className="trip-container">

        {/* Top bar */}
        <header className="trip-topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="heading-md gradient-text">TravelAI</h1>
        </header>

        {/* Hero */}
        <div className="trip-hero text-center">
          <p className="text-secondary" style={{ fontSize: '1.05rem' }}>
            Your personal travel agent with AI superpowers
          </p>
        </div>

        {/* Tab */}
        <div className="trip-tabs">
          <button
            className={`trip-tab${activeTab === 'plan' ? ' active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Plan a Trip
          </button>
        </div>

        {/* Input card */}
        <div className="glass-card trip-input-card">
          <textarea
            className="trip-textarea"
            placeholder="Simply describe your trip …"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
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
          <div className="trip-input-toolbar">
            <div className="trip-input-right">
              <button
                className={`btn btn-primary btn-sm trip-submit-btn${!description.trim() ? ' disabled' : ''}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting
                  ? <><span className="spinner" /> Generating…</>
                  : <>Submit <span style={{ marginLeft: 4 }}>→</span></>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* ── Results ── */}
        {plan && (
          <div className="trip-results phase-enter">

            {/* Summary */}
            <div className="glass-card trip-summary-card">
              <p className="trip-summary-text">{plan.summary}</p>
              <p className="text-xs text-muted mt-2">
                You can confirm these destinations or make any changes before I generate your complete trip.
              </p>
            </div>

            {/* Controls row */}
            <div className="trip-controls-row">
              <h2 className="heading-md">
                Destinations <span className="trip-dest-count">{totalCount}</span>
              </h2>
              <div className="trip-controls-right">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPrefs(p => !p)}>
                  👥 {travelers} Traveler{travelers !== 1 ? 's' : ''} ▾
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPrefs(p => !p)}>
                  ⚙️ Trip Preferences
                </button>
              </div>
            </div>

            {loadingPkgs && (
              <div style={{ fontSize: 13, color: '#64748b', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Checking for available packages…
              </div>
            )}

            {/* ── All destination cards ── */}
            <div className="trip-content-grid">
              <div className="trip-dest-list">
                <div className="trip-start-city">
                  <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Start / End</span>
                  <span className="text-sm">{plan.startCity} ✏️</span>
                </div>
                <p className="text-xs text-secondary mb-4">
                  These are places where you'll spend at least one night.
                </p>

                {allDestCards.map(({ dest, agentPkg }) => (
                  <DestinationCard
                    key={dest.id}
                    dest={dest}
                    agentPkg={agentPkg}
                    onRemove={removeDestination}
                  />
                ))}
              </div>
            </div>

            {/* ── Bottom actions ── */}
            <div className="trip-bottom-actions">
              <div className="trip-bottom-left">
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>↩ Undo</button>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Trip Name (Optional)"
                  value={tripTitle}
                  onChange={e => { setTripTitle(e.target.value); setSaveSuccess(false); }}
                  style={{ width: 200 }}
                />
                <button
                  className="btn btn-primary btn-lg trip-generate-btn"
                  disabled={totalCount === 0 || isSaving || saveSuccess}
                  onClick={handleSaveTrip}
                >
                  {isSaving ? (
                    <><span className="spinner" style={{ marginRight: 8 }} /> Saving...</>
                  ) : saveSuccess ? 'Trip Saved! ✓' : (
                    `✦ Save Trip (${totalCount} Destination${totalCount !== 1 ? 's' : ''})`
                  )}
                </button>
              </div>
            </div>

            {/* ── Preferences panel ── */}
            {showPrefs && (
              <div className="trip-prefs-overlay" onClick={() => setShowPrefs(false)}>
                <div className="glass-card trip-prefs-panel phase-enter" onClick={e => e.stopPropagation()}>
                  <div className="trip-prefs-header">
                    <button className="trip-prefs-close" onClick={() => setShowPrefs(false)}>✕</button>
                    <h3 className="heading-md">Trip Preferences</h3>
                  </div>
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
                      <select className="form-input" style={{ maxWidth: 200 }} value={prefs.dietary} onChange={e => setPrefs(p => ({ ...p, dietary: e.target.value }))}>
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
                  <div className="trip-prefs-section">
                    <h4 className="trip-prefs-section-title">Hotel Preferences</h4>
                    <div className="trip-prefs-row">
                      <span>Star Rating</span>
                      <select className="form-input" style={{ maxWidth: 200 }} value={prefs.starRating} onChange={e => setPrefs(p => ({ ...p, starRating: e.target.value }))}>
                        <option>Auto select</option><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option>
                      </select>
                    </div>
                  </div>
                  <div className="trip-prefs-section">
                    <h4 className="trip-prefs-section-title">Flight Preferences</h4>
                    <div className="trip-prefs-row">
                      <span>Travel Class</span>
                      <select className="form-input" style={{ maxWidth: 200 }} value={prefs.travelClass} onChange={e => setPrefs(p => ({ ...p, travelClass: e.target.value }))}>
                        <option>Auto select</option><option>Economy Class</option><option>Premium Economy Class</option><option>Business Class</option><option>First Class</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-full mt-4" onClick={() => setShowPrefs(false)}>Confirm Choices</button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
