import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/authService';
import Navbar from '../common/Navbar';

const LOCATION_TYPE_OPTIONS = [
  '🏖️ Beach',
  '⛰️ Mountain',
  '🏙️ City',
  '🌄 Countryside',
  '🏝️ Island',
  '🏜️ Desert',
  '🌲 Forest',
  '❄️ Arctic',
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'SGD', 'AED'];

const RECENT_PACKAGES = [
  {
    id: 1,
    title: 'Bali Family Escape',
    destination: 'Bali, Indonesia',
    duration: '5 days',
    price: 'USD 850',
    status: 'Viewed',
  },
  {
    id: 2,
    title: 'Tokyo Spring Trip',
    destination: 'Tokyo, Japan',
    duration: '7 days',
    price: 'USD 1,450',
    status: 'Saved',
  },
  {
    id: 3,
    title: 'Paris City Break',
    destination: 'Paris, France',
    duration: '4 days',
    price: 'USD 1,200',
    status: 'Draft',
  },
  {
    id: 4,
    title: 'Dubai Luxury Stay',
    destination: 'Dubai, UAE',
    duration: '3 days',
    price: 'USD 980',
    status: 'Recommended',
  },
];

export default function TravellerProfilePage() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState(null);
  const [error, setError] = useState(null);

  function buildFormState(p) {
    return {
      first_name: p?.first_name || '',
      last_name: p?.last_name || '',
      phone: p?.phone || '',
      dob: p?.dob ? p.dob.slice(0, 10) : '',
      nationality: p?.nationality || '',
      bio: p?.bio || '',
      budget_amount: p?.budget_amount ?? '',
      currency: p?.currency || 'USD',
      destination: p?.destination || '',
      location_types: Array.isArray(p?.location_types) ? p.location_types : [],
    };
  }

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
        setError(err.message || 'Failed to load profile.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, logout, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSaveMsg(null);
  }

  function toggleLocationType(type) {
    if (!isEditing) return;

    setForm(prev => {
      const currentTypes = Array.isArray(prev.location_types) ? prev.location_types : [];
      const nextTypes = currentTypes.includes(type)
        ? currentTypes.filter(item => item !== type)
        : [...currentTypes, type];

      return { ...prev, location_types: nextTypes };
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
      setSaveMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to save profile.' });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="traveller-profile-page">
        <Navbar />
        <div className="dashboard-loader">
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p className="text-secondary mt-4">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="traveller-profile-page">
        <Navbar />
        <div className="glass-card dashboard-error-card">
          <p className="text-secondary">⚠️ {error}</p>
          <button className="btn btn-primary mt-4" onClick={fetchProfile}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const initials =
    `${(profile?.first_name?.[0] || '').toUpperCase()}${(profile?.last_name?.[0] || '').toUpperCase()}` ||
    '✈️';

  return (
    <div className="traveller-profile-page">
      <Navbar />

      <main className="traveller-profile-container">
        <header className="traveller-profile-header glass-card">
          <div>
            <span className="traveller-profile-kicker">Traveller Profile</span>
            <h1>
              My Profile
              {profile?.first_name ? (
                <>
                  , <span>{profile.first_name}</span>
                </>
              ) : null}
            </h1>
            <p>Manage your account details, personal information, and travel preferences.</p>
          </div>

          <div className="traveller-profile-actions">
            {!isEditing ? (
              <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : '💾 Save Changes'}
                </button>
              </>
            )}
          </div>
        </header>

        {saveMsg && (
          <div className={`alert alert-${saveMsg.type}`}>
            {saveMsg.type === 'success' ? '✅' : '⚠️'} {saveMsg.text}
          </div>
        )}

        <section className="traveller-profile-layout">
          <div className="traveller-profile-left">
            <div className="glass-card traveller-profile-card traveller-photo-card">
              <div className="traveller-profile-avatar-large">{initials}</div>
              <h2 className="traveller-profile-name">
                {profile?.first_name || 'Traveller'} {profile?.last_name || ''}
              </h2>
              <p className="traveller-profile-email">{profile?.email || 'No email available'}</p>
              <span className="badge badge-role">{profile?.role_type || 'traveller'}</span>
            </div>

            <div className="glass-card traveller-profile-card">
              <h2 className="section-title">🔒 Account Info</h2>

              <div className="traveller-info-list">
                <div className="traveller-info-row">
                  <span>Role</span>
                  <strong>{profile?.role_type || '—'}</strong>
                </div>

                <div className="traveller-info-row">
                  <span>Status</span>
                  <strong>{profile?.status || '—'}</strong>
                </div>

                <div className="traveller-info-row">
                  <span>Auth Provider</span>
                  <strong>{profile?.auth_provider === 'google' ? 'Google' : 'Local'}</strong>
                </div>

                <div className="traveller-info-row">
                  <span>Email Verified</span>
                  <strong>{profile?.email_verified ? 'Verified' : 'Pending'}</strong>
                </div>

                <div className="traveller-info-row">
                  <span>Last Login</span>
                  <strong>
                    {profile?.last_login_at
                      ? new Date(profile.last_login_at).toLocaleString()
                      : '—'}
                  </strong>
                </div>

                <div className="traveller-info-row">
                  <span>Member Since</span>
                  <strong>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="traveller-profile-right">
            <div className="glass-card traveller-profile-card">
              <h2 className="section-title">👤 Personal Info</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    name="first_name"
                    className="form-input"
                    value={form.first_name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    name="last_name"
                    className="form-input"
                    value={form.last_name || ''}
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
                    value={form.phone || ''}
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
                    value={form.dob || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input
                    name="nationality"
                    className="form-input"
                    value={form.nationality || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. New Zealander"
                  />
                </div>
              </div>

              <div className="form-group mt-4">
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  className="form-input"
                  rows={3}
                  value={form.bio || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself…"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="glass-card traveller-profile-card">
              <h2 className="section-title">🌍 Travel Preference</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Budget</label>
                  <input
                    name="budget_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={form.budget_amount || ''}
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
                    value={form.currency || 'USD'}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    {CURRENCY_OPTIONS.map(currency => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Preferred Destination</label>
                  <input
                    name="destination"
                    className="form-input"
                    value={form.destination || ''}
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
                      className={`chip${form.location_types?.includes(type) ? ' selected' : ''}`}
                      onClick={() => toggleLocationType(type)}
                      disabled={!isEditing}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card traveller-profile-card traveller-recent-package-section">
          <div className="traveller-recent-package-header">
            <div>
              <span className="traveller-profile-kicker">Recent Package</span>
              <h2>Recent travel packages</h2>
            </div>
          </div>

          <div className="traveller-recent-package-grid">
            {RECENT_PACKAGES.map(pkg => (
              <article key={pkg.id} className="traveller-package-card">
                <div className="traveller-package-top">
                  <span className="traveller-package-status">{pkg.status}</span>
                  <span>✈️</span>
                </div>

                <h3>{pkg.title}</h3>
                <p>{pkg.destination}</p>

                <div className="traveller-package-meta">
                  <span>{pkg.duration}</span>
                  <strong>{pkg.price}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}