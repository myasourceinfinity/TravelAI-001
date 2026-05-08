/**
 * TravellerDashboard.jsx
 *
 * Post-login dashboard for traveller users. Displays all user information
 * in interactive, editable form sections. Fetches fresh data on mount and
 * allows saving changes back to the server.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/authService';

// ── Location type options (matches signup Phase 1) ──────────────────────────
const LOCATION_TYPE_OPTIONS = [
  '🏖️ Beach', '⛰️ Mountain', '🏙️ City', '🌄 Countryside',
  '🏝️ Island', '🏜️ Desert', '🌲 Forest', '❄️ Arctic',
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'SGD', 'AED'];

export default function TravellerDashboard() {
  const navigate   = useNavigate();
  const { user, accessToken, logout } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [form, setForm]           = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg]     = useState(null);
  const [error, setError]         = useState(null);

  // ── Fetch full profile from server on mount ─────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfile(accessToken);
      setProfile(data.user);
      setForm(buildFormState(data.user));
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, logout, navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Build editable form state from profile data ─────────────────────────────
  function buildFormState(p) {
    return {
      first_name:     p.first_name  || '',
      last_name:      p.last_name   || '',
      phone:          p.phone       || '',
      dob:            p.dob ? p.dob.slice(0, 10) : '',
      nationality:    p.nationality || '',
      bio:            p.bio         || '',
      budget_amount:  p.budget_amount ?? '',
      currency:       p.currency    || 'USD',
      destination:    p.destination || '',
      location_types: Array.isArray(p.location_types) ? p.location_types : [],
    };
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSaveMsg(null);
  }

  function toggleLocationType(type) {
    setForm(prev => {
      const types = prev.location_types.includes(type)
        ? prev.location_types.filter(t => t !== type)
        : [...prev.location_types, type];
      return { ...prev, location_types: types };
    });
    setSaveMsg(null);
  }

  function handleCancel() {
    setForm(buildFormState(profile));
    setIsEditing(false);
    setSaveMsg(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const data = await updateProfile(accessToken, form);
      setProfile(data.user);
      setForm(buildFormState(data.user));
      setIsEditing(false);
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard-page page-bg">
        <div className="dashboard-loader">
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p className="text-secondary mt-4">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page page-bg">
        <div className="glass-card dashboard-error-card">
          <p className="text-secondary">⚠️ {error}</p>
          <button className="btn btn-primary mt-4" onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    );
  }

  const initials = `${(profile?.first_name?.[0] || '').toUpperCase()}${(profile?.last_name?.[0] || '').toUpperCase()}`;

  return (
    <div className="dashboard-page page-bg">
      <div className="dashboard-container">

        {/* ═══ Header ═══════════════════════════════════════════════════════════ */}
        <header className="dashboard-header glass-card">
          <div className="dashboard-header-left">
            <div className="avatar-circle">{initials || '✈️'}</div>
            <div>
              <h1 className="heading-lg">
                Welcome back, <span className="gradient-text">{profile?.first_name}</span>!
              </h1>
              <p className="text-sm text-secondary">
                {profile?.email} · <span className="badge badge-role">{profile?.role_type}</span>
              </p>
            </div>
          </div>
          <div className="dashboard-header-right">
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/plan-trip')}>
              ✈️ Plan a trip with TravelAI
            </button>
            {!isEditing ? (
              <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <><span className="spinner" /> Saving…</> : '💾 Save Changes'}
                </button>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </header>

        {/* ═══ Save feedback ══════════════════════════════════════════════════ */}
        {saveMsg && (
          <div className={`alert alert-${saveMsg.type}`}>
            {saveMsg.type === 'success' ? '✅' : '⚠️'} {saveMsg.text}
          </div>
        )}

        {/* ═══ Dashboard Grid ════════════════════════════════════════════════ */}
        <div className="dashboard-grid">

          {/* ── Personal Information ─────────────────────────────────────────── */}
          <section className="glass-card dashboard-section">
            <h2 className="section-title">👤 Personal Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  name="first_name"
                  className="form-input"
                  value={form.first_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  name="last_name"
                  className="form-input"
                  value={form.last_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  value={profile?.email || ''}
                  disabled
                  title="Email cannot be changed"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. +1 555-123-4567"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  name="dob"
                  type="date"
                  className="form-input"
                  value={form.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input
                  name="nationality"
                  className="form-input"
                  value={form.nationality}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. American"
                />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                className="form-input"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tell us about yourself…"
                style={{ resize: 'vertical' }}
              />
            </div>
          </section>

          {/* ── Travel Preferences ───────────────────────────────────────────── */}
          <section className="glass-card dashboard-section">
            <h2 className="section-title">🌍 Travel Preferences</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Budget</label>
                <input
                  name="budget_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={form.budget_amount}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  name="currency"
                  className="form-input"
                  value={form.currency}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  {CURRENCY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Preferred Destination</label>
                <input
                  name="destination"
                  className="form-input"
                  value={form.destination}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Bali, Tokyo, Paris"
                />
              </div>
            </div>

            <div className="form-group mt-4">
              <label className="form-label">Location Types</label>
              <div className="chip-group">
                {LOCATION_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`chip${form.location_types.includes(type) ? ' selected' : ''}`}
                    onClick={() => isEditing && toggleLocationType(type)}
                    disabled={!isEditing}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Account Information ──────────────────────────────────────────── */}
          <section className="glass-card dashboard-section">
            <h2 className="section-title">🔒 Account Information</h2>
            <div className="account-badges">
              <div className="info-badge">
                <span className="info-badge-label">Role</span>
                <span className="badge badge-role">{profile?.role_type}</span>
              </div>
              <div className="info-badge">
                <span className="info-badge-label">Status</span>
                <span className={`badge badge-status badge-${profile?.status}`}>
                  {profile?.status}
                </span>
              </div>
              <div className="info-badge">
                <span className="info-badge-label">Auth Provider</span>
                <span className="badge badge-provider">
                  {profile?.auth_provider === 'google' ? '🔵 Google' : '📧 Local'}
                </span>
              </div>
              <div className="info-badge">
                <span className="info-badge-label">Email Verified</span>
                <span className={`badge ${profile?.email_verified ? 'badge-active' : 'badge-pending'}`}>
                  {profile?.email_verified ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
              <div className="info-badge">
                <span className="info-badge-label">Last Login</span>
                <span className="text-sm text-secondary">
                  {profile?.last_login_at
                    ? new Date(profile.last_login_at).toLocaleString()
                    : '—'}
                </span>
              </div>
              <div className="info-badge">
                <span className="info-badge-label">Member Since</span>
                <span className="text-sm text-secondary">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
