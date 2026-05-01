/**
 * SignUpPhase1.jsx
 * Phase 1 — Travel Preferences (Budget, Currency, Destination, Location Types)
 * This is the "advanced filter" shown FIRST to capture intent before credentials.
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const CURRENCIES = [
  { code: 'USD', label: '🇺🇸 USD — US Dollar' },
  { code: 'EUR', label: '🇪🇺 EUR — Euro' },
  { code: 'GBP', label: '🇬🇧 GBP — British Pound' },
  { code: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
  { code: 'NZD', label: '🇳🇿 NZD — New Zealand Dollar' },
  { code: 'JPY', label: '🇯🇵 JPY — Japanese Yen' },
  { code: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
  { code: 'SGD', label: '🇸🇬 SGD — Singapore Dollar' },
  { code: 'CHF', label: '🇨🇭 CHF — Swiss Franc' },
  { code: 'CNY', label: '🇨🇳 CNY — Chinese Yuan' },
];

const LOCATION_TYPES = [
  { id: 'Beach',      emoji: '🏖️', label: 'Beach' },
  { id: 'Mountain',   emoji: '⛰️', label: 'Mountain' },
  { id: 'City',       emoji: '🏙️', label: 'City' },
  { id: 'Countryside',emoji: '🌿', label: 'Countryside' },
  { id: 'Desert',     emoji: '🏜️', label: 'Desert' },
  { id: 'Cultural',   emoji: '🏛️', label: 'Cultural' },
  { id: 'Adventure',  emoji: '🪂', label: 'Adventure' },
  { id: 'Wellness',   emoji: '🧘', label: 'Wellness' },
];

export default function SignUpPhase1({ data, onChange, onNext, selectedCurrency, onCurrencyChange, onGoogleSuccess }) {
  const [errors, setErrors] = useState({});
  const { loginWithGoogle } = useAuth();
  const [googleError, setGoogleError] = useState(null);

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setGoogleError(null);
      const data = await loginWithGoogle(credentialResponse.credential);
      if (onGoogleSuccess) onGoogleSuccess(data.user, data.isNewUser);
    } catch (err) {
      setGoogleError(err.message || 'Google signup failed');
    }
  }

  function handleBudgetChange(e) {
    const val = e.target.value;
    onChange({ budget_amount: val });
    if (val && isNaN(parseFloat(val))) {
      setErrors(prev => ({ ...prev, budget_amount: 'Must be a valid number' }));
    } else {
      setErrors(prev => { const n = { ...prev }; delete n.budget_amount; return n; });
    }
  }

  function toggleLocation(id) {
    const current = data.location_types || [];
    const updated = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    onChange({ location_types: updated });
  }

  function validate() {
    const errs = {};
    if (data.budget_amount && isNaN(parseFloat(data.budget_amount))) {
      errs.budget_amount = 'Must be a valid number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="phase-enter flex flex-col gap-5">
      {/* Header */}
      <div className="text-center mb-2">
        <p style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🗺️</p>
        <h2 className="heading-md" style={{ color: 'var(--text-primary)' }}>
          Tell us your travel vibe
        </h2>
        <p className="text-sm text-secondary mt-2">
          These preferences help our AI tailor trips just for you. You can change them anytime.
        </p>
      </div>

      {/* Budget row */}
      <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
        <div className="form-group" style={{ flex: 1.5 }}>
          <label className="form-label" htmlFor="budget_amount">Budget</label>
          <input
            id="budget_amount"
            type="number"
            min="0"
            step="any"
            className={`form-input${errors.budget_amount ? ' error' : ''}`}
            placeholder="5000"
            value={data.budget_amount || ''}
            onChange={handleBudgetChange}
          />
          {errors.budget_amount && (
            <span className="form-error">⚠ {errors.budget_amount}</span>
          )}
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label" htmlFor="currency">Currency</label>
          <select
            id="currency"
            className="form-input"
            value={selectedCurrency || 'USD'}
            onChange={e => onCurrencyChange(e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Destination */}
      <div className="form-group">
        <label className="form-label" htmlFor="destination">
          Dream Destination
          <span style={{ marginLeft: 6, color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
            (optional)
          </span>
        </label>
        <input
          id="destination"
          type="text"
          className="form-input"
          placeholder="e.g. Bali, Tokyo, Patagonia..."
          value={data.destination || ''}
          onChange={e => onChange({ destination: e.target.value })}
        />
      </div>

      {/* Location type chips */}
      <div className="form-group">
        <label className="form-label">Location Types</label>
        <p className="text-xs text-muted mb-2">Pick all that excite you</p>
        <div className="chip-group">
          {LOCATION_TYPES.map(type => {
            const selected = (data.location_types || []).includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                className={`chip${selected ? ' selected' : ''}`}
                onClick={() => toggleLocation(type.id)}
                aria-pressed={selected}
              >
                <span>{type.emoji}</span>
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next */}
      <button
        type="button"
        className="btn btn-primary btn-full btn-lg mt-4"
        id="phase1-next-btn"
        onClick={handleNext}
      >
        Continue to Account Setup →
      </button>

      <div className="divider">or</div>

      {googleError && (
        <div className="alert alert-error" style={{ textAlign: 'center' }}>
          ⚠ {googleError}
        </div>
      )}

      {/* ── Google OAuth button ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setGoogleError('Google Login Failed')}
          useOneTap
          theme="outline"
          shape="rectangular"
          text="signup_with"
          size="large"
        />
      </div>
    </div>
  );
}
