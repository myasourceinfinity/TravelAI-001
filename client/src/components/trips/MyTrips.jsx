import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSavedTrips, modifyTrip, deleteTrip } from '../../services/tripService';
import Navbar from '../common/Navbar';

// ─── Inline Edit Panel ───────────────────────────────────────────────────────
function EditTripPanel({ trip, token, onSave, onCancel }) {
  const [title,      setTitle]     = useState(trip.title || '');
  const [days,       setDays]      = useState(trip.days || 1);
  const [travelers,  setTravelers] = useState(trip.travelers || 1);
  const [budgetLevel,setBudget]    = useState(trip.budget_level || 'moderate');
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState(null);

  // Ensure lat/lng are always stored as strings so inputs pre-fill correctly
  const normaliseDest = (d) => ({
    ...d,
    lat: d.lat != null && d.lat !== '' ? String(d.lat) : '',
    lng: d.lng != null && d.lng !== '' ? String(d.lng) : '',
    highlights:  Array.isArray(d.highlights)  ? d.highlights  : [],
    bookmeDeals: Array.isArray(d.bookmeDeals) ? d.bookmeDeals : [],
  });

  const [destinations, setDests] = useState(
    (trip.destinations || []).map(normaliseDest)
  );

  // ── destination helpers ───────────────────────────────────────────────────
  const updateDest = (idx, field, value) =>
    setDests(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));

  const removeDest = (idx) =>
    setDests(prev => prev.filter((_, i) => i !== idx));

  const addDest = () =>
    setDests(prev => [...prev, {
      id: `new-${Date.now()}`,
      name: '', country: '', lat: '', lng: '',
      emoji: '📍', highlights: [], bookmeDeals: [],
    }]);

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);

    for (const d of destinations) {
      if (!d.name.trim()) {
        setError('Every destination needs a name.'); return;
      }
    }

    setSaving(true);
    try {
      const result = await modifyTrip(token, trip.id, {
        title:        title.trim() || null,
        days:         Number(days),
        travelers:    Number(travelers),
        budgetLevel,
        destinations: destinations.map((d) => ({
          id:          d.id || d.name.toLowerCase().replace(/\s+/g, '-'),
          name:        d.name.trim(),
          country:     d.country.trim(),
          lat:         parseFloat(d.lat),
          lng:         parseFloat(d.lng),
          emoji:       d.emoji || '📍',
          highlights:  Array.isArray(d.highlights)  ? d.highlights  : [],
          bookmeDeals: Array.isArray(d.bookmeDeals) ? d.bookmeDeals : [],
        })),
      });
      onSave(result.trip);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // ── styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    background: 'var(--bg-900)',
    border: '1px solid var(--glass-border)',
    borderRadius: 6,
    padding: '6px 10px',
    color: 'var(--text-main)',
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 11,
    color: 'var(--text-secondary, #94a3b8)',
    marginBottom: 4,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{ padding: '20px 0 8px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
          ✏️ Edit Trip
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>
      )}

      {/* Trip-level fields — single row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Trip Title</label>
          <input style={inputStyle} value={title}
            onChange={e => setTitle(e.target.value)} placeholder="e.g. My NZ Adventure" />
        </div>
        <div>
          <label style={labelStyle}>Days</label>
          <input style={inputStyle} type="number" min={1} value={days}
            onChange={e => setDays(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Travelers</label>
          <input style={inputStyle} type="number" min={1} value={travelers}
            onChange={e => setTravelers(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Budget</label>
          <select style={inputStyle} value={budgetLevel} onChange={e => setBudget(e.target.value)}>
            <option value="budget">Budget</option>
            <option value="moderate">Moderate</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>
      </div>

      {/* Destinations header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
          📍 Destinations ({destinations.length})
        </span>
        <button className="btn btn-ghost btn-sm" onClick={addDest} style={{ fontSize: 12 }}>
          + Add Destination
        </button>
      </div>

      {/* Destination cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {destinations.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', textAlign: 'center', padding: '20px 0' }}>
            No destinations. Click "+ Add Destination" to add one.
          </p>
        )}

        {destinations.map((dest, idx) => (
          <div key={dest.id || idx} style={{
            background: 'var(--bg-900)',
            border: '1px solid var(--glass-border)',
            borderRadius: 10,
            padding: '14px',
          }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                {dest.emoji} {dest.name || `Destination ${idx + 1}`}
              </span>
              <button onClick={() => removeDest(idx)} style={{
                background: 'transparent',
                border: '1px solid #dc2626',
                color: '#f87171',
                borderRadius: 6,
                padding: '3px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}>
                🗑 Remove
              </button>
            </div>

            {/* Row 1: Emoji | Name | Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Emoji</label>
                <input style={inputStyle} value={dest.emoji}
                  onChange={e => updateDest(idx, 'emoji', e.target.value)} maxLength={2} />
              </div>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={dest.name}
                  onChange={e => updateDest(idx, 'name', e.target.value)}
                  placeholder="e.g. Queenstown" />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input style={inputStyle} value={dest.country}
                  onChange={e => updateDest(idx, 'country', e.target.value)}
                  placeholder="e.g. New Zealand" />
              </div>
            </div>

            {/* Row 2: Highlights only */}
            <div>
              <label style={labelStyle}>Highlights <span style={{ color: '#64748b', textTransform: 'none' }}>(comma separated)</span></label>
              <input style={inputStyle}
                value={Array.isArray(dest.highlights) ? dest.highlights.join(', ') : dest.highlights}
                onChange={e => updateDest(idx, 'highlights',
                  e.target.value.split(',').map(h => h.trim()).filter(Boolean))}
                placeholder="Sky Tower, Harbour Bridge" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Changes'}
        </button>
      </div>

    </div>
  );
}

// ─── Main MyTrips Page ───────────────────────────────────────────────────────
export default function MyTrips() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();

  const [trips,          setTrips]          = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState(null);
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [editingTripId,  setEditingTripId]  = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // trip id awaiting delete confirm
  const [deleting,        setDeleting]        = useState(false);

  useEffect(() => {
    async function fetchTrips() {
      if (!accessToken) return;
      try {
        const data = await getSavedTrips(accessToken);
        setTrips(data.trips || []);
      } catch (err) {
        if (err.status === 401) {
          await logout();
          navigate('/');
        } else {
          setError(err.message || 'Failed to load trips');
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrips();
  }, [accessToken, logout, navigate]);

  const toggleExpand = (id) => {
    setExpandedTripId(prev => (prev === id ? null : id));
    setEditingTripId(null);
  };

  const startEdit = (e, tripId) => {
    e.stopPropagation();
    setExpandedTripId(tripId);
    setEditingTripId(tripId);
  };

  const cancelEdit = () => setEditingTripId(null);

  const handleSaveSuccess = (updatedTrip) => {
    setTrips(prev => prev.map(t => t.id !== updatedTrip.id ? t : {
      ...t,
      title:        updatedTrip.title,
      days:         updatedTrip.days,
      travelers:    updatedTrip.travelers,
      budget_level: updatedTrip.budget_level,
      summary:      updatedTrip.summary,
      destinations: updatedTrip.destinations,
    }));
    setEditingTripId(null);
  };

  const handleDelete = async (tripId) => {
    setDeleting(true);
    try {
      await deleteTrip(accessToken, tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setConfirmDeleteId(null);
      setExpandedTripId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete trip.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page page-bg" style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', alignItems: 'flex-start' }}>
        <div className="dashboard-loader text-center mt-12">
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p className="text-secondary mt-4">Loading your trips…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page page-bg" style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)' }}>
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: '100%', width: '100%', padding: '0 5%' }}>

        <header className="dashboard-header glass-card" style={{ marginBottom: '2rem' }}>
          <div className="dashboard-header-left">
            <div className="avatar-circle">🗺️</div>
            <div>
              <h1 className="heading-lg">My Saved Trips</h1>
              <p className="text-sm text-secondary">View and manage your AI-generated travel itineraries.</p>
            </div>
          </div>
        </header>

        {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

        {trips.length === 0 && !error ? (
          <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
            <h2 className="heading-md mb-2">No trips saved yet!</h2>
            <p className="text-secondary mb-6">You haven't planned any trips with TravelAI. Let's fix that!</p>
            <button className="btn btn-primary" onClick={() => navigate('/plan-trip')}>✦ Plan your first trip</button>
          </div>
        ) : (
          <div className="trip-table-container">
            <table className="trip-table">
              <thead>
                <tr>
                  <th>Trip Name</th>
                  <th>Start City</th>
                  <th>Duration</th>
                  <th>Travelers</th>
                  <th>Budget</th>
                  <th>Saved On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => {
                  const isExpanded = expandedTripId === trip.id;
                  const isEditing  = editingTripId  === trip.id;
                  return (
                    <Fragment key={trip.id}>
                      <tr className={isExpanded ? 'expanded-row' : ''}>
                        <td style={{ fontWeight: 500 }}>{trip.title || `${trip.start_city} Trip`}</td>
                        <td>{trip.start_city}</td>
                        <td>{trip.days} Days</td>
                        <td>{trip.travelers} pax</td>
                        <td style={{ textTransform: 'capitalize' }}>{trip.budget_level}</td>
                        <td className="text-muted">{new Date(trip.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {!isEditing && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/trip/${trip.id}`)}
                                style={{ padding: '6px 12px', color: 'var(--brand-400, #38bdf8)' }}
                              >
                                🗺 View Trip
                              </button>
                            )}
                            {!isEditing && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={e => startEdit(e, trip.id)}
                                style={{ padding: '6px 12px', color: 'var(--brand-400, #38bdf8)' }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {!isEditing && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={e => { e.stopPropagation(); setConfirmDeleteId(trip.id); }}
                                style={{ padding: '6px 12px', color: '#f87171' }}
                              >
                                🗑 Delete
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => toggleExpand(trip.id)}
                              style={{ padding: '6px 12px' }}
                            >
                              {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="expanded-content-row">
                          <td colSpan="7">
                            <div className="trip-sub-table-container phase-enter">
                              {isEditing ? (
                                <EditTripPanel
                                  trip={trip}
                                  token={accessToken}
                                  onSave={handleSaveSuccess}
                                  onCancel={cancelEdit}
                                />
                              ) : (
                                <>
                                  <p className="text-sm text-secondary mb-4" style={{ maxWidth: '800px', lineHeight: 1.6 }}>
                                    <strong>Summary:</strong> {trip.summary || 'No summary available.'}
                                  </p>
                                  {trip.destinations && trip.destinations.length > 0 ? (
                                    <table className="trip-table" style={{ background: 'var(--bg-900)', borderRadius: '8px', overflow: 'hidden' }}>
                                      <thead>
                                        <tr>
                                          <th>Destination</th>
                                          <th>Country</th>
                                          <th>Highlights</th>
                                          <th>Activities (Bookme Deals)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {trip.destinations.map(dest => (
                                          <tr key={dest.id}>
                                            <td>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                                <span style={{ fontSize: '1.2rem' }}>{dest.emoji}</span>
                                                <span style={{ fontWeight: 500 }}>{dest.name}</span>
                                              </div>
                                            </td>
                                            <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{dest.country}</td>
                                            <td className="text-sm text-secondary">
                                              {dest.highlights && dest.highlights.length > 0 ? dest.highlights.join(' • ') : '—'}
                                            </td>
                                            <td>
                                              {dest.bookmeDeals && dest.bookmeDeals.length > 0 ? (
                                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '300px' }}>
                                                  {dest.bookmeDeals.map((deal, i) => (
                                                    <a key={i} href={deal.link} target="_blank" rel="noreferrer" title={deal.title}
                                                      style={{ minWidth: '120px', background: 'var(--bg-800)', borderRadius: '4px', padding: '6px', textDecoration: 'none', border: '1px solid var(--glass-border)' }}
                                                    >
                                                      <div className="text-xs font-medium" style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                        {deal.title}
                                                      </div>
                                                      <div className="text-xs" style={{ color: 'var(--brand-400)', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{deal.price}</span>
                                                        {deal.discount && <span style={{ color: 'var(--brand-500)', fontSize: '0.65rem' }}>{deal.discount}</span>}
                                                      </div>
                                                    </a>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="text-xs text-muted">No activities found</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-sm text-muted">No destinations available for this trip.</p>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-800, #1e293b)',
            border: '1px solid var(--glass-border)',
            borderRadius: 16,
            padding: '32px',
            maxWidth: 420,
            width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-main)' }}>
              Delete this trip?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary, #94a3b8)', marginBottom: 24 }}>
              This action cannot be undone. The trip and all its destinations will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                style={{ minWidth: 100 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                style={{ minWidth: 100, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
