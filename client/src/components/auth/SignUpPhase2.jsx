/**
 * SignUpPhase2.jsx
 * Phase 2 — Personal Credentials
 * Captures: First Name, Last Name, Phone, Email, DOB, Nationality, Password + Confirm
 * Includes real-time validation + password strength indicator.
 */

import { useState } from 'react';

const NATIONALITIES = [
  'Afghan','Albanian','Algerian','American','Andorran','Angolan','Argentinian',
  'Armenian','Australian','Austrian','Azerbaijani','Bahraini','Bangladeshi',
  'Belgian','Bolivian','Brazilian','British','Bulgarian','Cambodian','Canadian',
  'Chilean','Chinese','Colombian','Croatian','Cuban','Czech','Danish','Dominican',
  'Dutch','Ecuadorian','Egyptian','Emirati','Ethiopian','Filipino','Finnish',
  'French','Georgian','German','Ghanaian','Greek','Guatemalan','Honduran',
  'Hungarian','Indian','Indonesian','Iranian','Iraqi','Irish','Israeli',
  'Italian','Jamaican','Japanese','Jordanian','Kazakhstani','Kenyan','Korean',
  'Kuwaiti','Lebanese','Libyan','Lithuanian','Luxembourgish','Malaysian',
  'Maldivian','Mexican','Mongolian','Moroccan','Mozambican','Myanmar','Namibian',
  'Nepalese','New Zealander','Nigerian','Norwegian','Omani','Pakistani',
  'Palestinian','Panamanian','Paraguayan','Peruvian','Polish','Portuguese',
  'Qatari','Romanian','Russian','Saudi Arabian','Serbian','Singaporean',
  'Slovak','Slovenian','Somali','South African','Spanish','Sri Lankan',
  'Sudanese','Swedish','Swiss','Syrian','Taiwanese','Tanzanian','Thai',
  'Tunisian','Turkish','Ugandan','Ukrainian','Uruguayan','Venezuelan',
  'Vietnamese','Yemeni','Zambian','Zimbabwean',
].sort();

// ── Password strength scoring ──────────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password))   score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak',   cls: 'weak' };
  if (score <= 2) return { score: 2, label: 'Fair',   cls: 'fair' };
  if (score <= 3) return { score: 3, label: 'Good',   cls: 'good' };
  return             { score: 4, label: 'Strong', cls: 'strong' };
}

// ── Validators ────────────────────────────────────────────────────────────────
const VALIDATORS = {
  first_name:  v => !v?.trim()                          ? 'First name is required' : '',
  email:       v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email' : '',
  password:    v => !v || v.length < 8                  ? 'Minimum 8 characters' : '',
  confirm_password: (v, all) => v !== all.password      ? 'Passwords do not match' : '',
};

export default function SignUpPhase2({ data, onChange, onBack, onSubmit, isLoading, serverError }) {
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

  const strength = getPasswordStrength(data.password || '');

  function handleChange(field, value) {
    onChange({ [field]: value });
    if (touched[field] && VALIDATORS[field]) {
      const err = VALIDATORS[field](value, { ...data, [field]: value });
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (VALIDATORS[field]) {
      const err = VALIDATORS[field](data[field] || '', data);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  }

  function validate() {
    const errs = {};
    Object.keys(VALIDATORS).forEach(f => {
      const err = VALIDATORS[f](data[f] || '', data);
      if (err) errs[f] = err;
    });
    setErrors(errs);
    setTouched(Object.keys(VALIDATORS).reduce((a, k) => ({ ...a, [k]: true }), {}));
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onSubmit();
  }

  const inputProps = (field) => ({
    className: `form-input${errors[field] ? ' error' : ''}`,
    value: data[field] || '',
    onChange: e => handleChange(field, e.target.value),
    onBlur:   () => handleBlur(field),
  });

  return (
    <form className="phase-enter flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {/* Header */}
      <div className="text-center mb-2">
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</p>
        <h2 className="heading-md">Create your account</h2>
        <p className="text-sm text-secondary mt-2">Your details are encrypted and never shared.</p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="alert alert-error" role="alert">
          <span>⚠</span> {serverError}
        </div>
      )}

      {/* Name row */}
      <div className="flex gap-3">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label" htmlFor="first_name">First Name *</label>
          <input id="first_name" type="text" placeholder="Alex" {...inputProps('first_name')} />
          {errors.first_name && <span className="form-error">⚠ {errors.first_name}</span>}
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label" htmlFor="last_name">Last Name</label>
          <input
            id="last_name" type="text" placeholder="Rivera"
            className="form-input"
            value={data.last_name || ''}
            onChange={e => onChange({ last_name: e.target.value })}
          />
        </div>
      </div>

      {/* Phone & Email */}
      <div className="flex gap-3">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label" htmlFor="phone">Phone</label>
          <input
            id="phone" type="tel" placeholder="+1 555 000 0000"
            className="form-input"
            value={data.phone || ''}
            onChange={e => onChange({ phone: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ flex: 1.3 }}>
          <label className="form-label" htmlFor="email">Email *</label>
          <input id="email" type="email" placeholder="alex@example.com" {...inputProps('email')} />
          {errors.email && <span className="form-error">⚠ {errors.email}</span>}
        </div>
      </div>

      {/* DOB & Nationality */}
      <div className="flex gap-3">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label" htmlFor="dob">Date of Birth</label>
          <input
            id="dob" type="date"
            className="form-input"
            value={data.dob || ''}
            onChange={e => onChange({ dob: e.target.value })}
            max={new Date(Date.now() - 13 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
          />
        </div>
        <div className="form-group" style={{ flex: 1.3 }}>
          <label className="form-label" htmlFor="nationality">Nationality</label>
          <select
            id="nationality"
            className="form-input"
            value={data.nationality || ''}
            onChange={e => onChange({ nationality: e.target.value })}
          >
            <option value="">Select nationality...</option>
            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Password */}
      <div className="form-group">
        <label className="form-label" htmlFor="password">Password *</label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="Min 8 characters"
            style={{ paddingRight: '44px' }}
            {...inputProps('password')}
          />
          <button
            type="button"
            onClick={() => setShowPwd(p => !p)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1,
            }}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <span className="form-error">⚠ {errors.password}</span>}

        {/* Strength bar */}
        {data.password && (
          <>
            <div className="strength-bar-wrap" role="progressbar" aria-label="Password strength">
              {[1,2,3,4].map(i => {
                let cls = 'strength-segment';
                if (i <= strength.score) cls += ` filled-${strength.cls}`;
                return <div key={i} className={cls} />;
              })}
            </div>
            <span className={`strength-label ${strength.cls}`}>
              {strength.label}
            </span>
          </>
        )}
      </div>

      {/* Confirm Password */}
      <div className="form-group">
        <label className="form-label" htmlFor="confirm_password">Confirm Password *</label>
        <div style={{ position: 'relative' }}>
          <input
            id="confirm_password"
            type={showCPwd ? 'text' : 'password'}
            placeholder="Repeat your password"
            style={{ paddingRight: '44px' }}
            {...inputProps('confirm_password')}
          />
          <button
            type="button"
            onClick={() => setShowCPwd(p => !p)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1,
            }}
            aria-label={showCPwd ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showCPwd ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.confirm_password && (
          <span className="form-error">⚠ {errors.confirm_password}</span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          className="btn btn-ghost"
          style={{ flex: '0 0 auto', padding: '12px 20px' }}
          onClick={onBack}
          disabled={isLoading}
          id="phase2-back-btn"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={isLoading}
          id="phase2-submit-btn"
        >
          {isLoading ? (
            <><div className="spinner" /><span>Creating Account…</span></>
          ) : (
            '🚀 Create My Account'
          )}
        </button>
      </div>
    </form>
  );
}
