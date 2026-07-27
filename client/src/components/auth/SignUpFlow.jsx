/**
 * SignUpFlow.jsx
 * Single-step signup matching the prototype design.
 * Captures all credentials in one form (no travel-vibe phase).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { localSignup } from '../../services/authService';

// ── Password strength ────────────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pwd.length >= 8)  s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd))   s++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) s++;
  if (s <= 1) return { score: 1, label: 'Weak',   color: '#ef4444' };
  if (s <= 2) return { score: 2, label: 'Fair',   color: '#f59e0b' };
  if (s <= 3) return { score: 3, label: 'Good',   color: '#22c55e' };
  return         { score: 4, label: 'Strong', color: '#16a34a' };
}

// ── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ email, onGoToLogin }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', padding: '24px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #2d7a55, #3d9e6e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', boxShadow: '0 0 32px rgba(45,122,85,0.35)',
      }}>✓</div>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px' }}>
          🎉 Welcome aboard!
        </h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
          Your account has been created. We've sent a verification link to{' '}
          <strong style={{ color: '#4f46e5' }}>{email}</strong>. Please check your inbox.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToLogin}
        style={{
          padding: '13px 40px',
          background: 'linear-gradient(135deg, #2d7a55, #3d9e6e)',
          color: '#fff', fontSize: '1rem', fontWeight: 700,
          border: 'none', borderRadius: 8, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(45,122,85,0.3)',
        }}
      >
        Go to Sign In →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function SignUpFlow({ onGoToLogin }) {
  const navigate   = useNavigate();
  const { loginWithGoogle } = useAuth();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', confirm_password: '', phone: '',
  });
  const [errors,      setErrors]      = useState({});
  const [agreed,      setAgreed]      = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [serverError, setServerError] = useState(null);
  const [done,        setDone]        = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const strength = getStrength(form.password);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError(null);
  }

  function validate() {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 8)
      errs.password = 'Minimum 8 characters.';
    if (form.confirm_password !== form.password)
      errs.confirm_password = 'Passwords do not match.';
    if (!agreed) errs.agreed = 'Please agree to the terms.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    setServerError(null);
    try {
      const { confirm_password: _, ...payload } = form;
      payload.currency = 'NZD';
      await localSignup(payload);
      setDone(true);
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setGoogleError(null);
      const data = await loginWithGoogle(credentialResponse.credential);
      if (data?.accessToken || data?.user) {
        navigate(sessionStorage.getItem('pending_trip_description') ? '/plan-trip' : '/');
      }
    } catch (err) {
      setGoogleError(err.message || 'Google signup failed.');
    }
  }

  // ── Shared styles ────────────────────────────────────────────────────────────
  const inputStyle = (hasError) => ({
    width: '100%', padding: '11px 14px',
    border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
    borderRadius: 8, fontSize: '0.9375rem',
    color: '#111827', background: '#fff', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s',
  });

  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: '#374151', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  if (done) {
    return <SuccessScreen email={form.email} onGoToLogin={onGoToLogin} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Heading */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', fontFamily: 'Outfit, sans-serif' }}>
        Create your account
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 28px' }}>
        Set up your profile to get started with smart travel experience
      </p>

      {/* Server error */}
      {serverError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '10px 14px', marginBottom: 20, fontSize: '0.875rem', color: '#dc2626',
        }}>
          ⚠️ {serverError}
        </div>
      )}

      {/* First + Last Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>First Name</label>
          <input
            name="first_name" type="text" placeholder="e.g. Alex"
            value={form.first_name} onChange={handleChange}
            style={inputStyle(!!errors.first_name)}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = errors.first_name ? '#dc2626' : '#d1d5db'}
          />
          {errors.first_name && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3, display: 'block' }}>⚠ {errors.first_name}</span>}
        </div>
        <div>
          <label style={labelStyle}>Last Name</label>
          <input
            name="last_name" type="text" placeholder="e.g. Johnson"
            value={form.last_name} onChange={handleChange}
            style={inputStyle(false)}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email Address</label>
        <input
          name="email" type="email" placeholder="you@example.com"
          value={form.email} onChange={handleChange}
          style={inputStyle(!!errors.email)}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = errors.email ? '#dc2626' : '#d1d5db'}
        />
        {errors.email && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3, display: 'block' }}>⚠ {errors.email}</span>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Password</label>
        <input
          name="password" type="password" placeholder="Min. 8 characters"
          value={form.password} onChange={handleChange}
          style={inputStyle(!!errors.password)}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = errors.password ? '#dc2626' : '#d1d5db'}
        />
        {/* Strength bar */}
        {form.password && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${(strength.score / 4) * 100}%`,
                background: strength.color,
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600, marginTop: 3, display: 'block' }}>
              Strength: {strength.label}
            </span>
          </div>
        )}
        {errors.password && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3, display: 'block' }}>⚠ {errors.password}</span>}
      </div>

      {/* Confirm Password */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Confirm Password</label>
        <input
          name="confirm_password" type="password" placeholder="Confirm your password"
          value={form.confirm_password} onChange={handleChange}
          style={inputStyle(!!errors.confirm_password)}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = errors.confirm_password ? '#dc2626' : '#d1d5db'}
        />
        {errors.confirm_password && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3, display: 'block' }}>⚠ {errors.confirm_password}</span>}
      </div>

      {/* Phone */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Phone Number</label>
        <input
          name="phone" type="tel" placeholder="e.g. 021 123 4567"
          value={form.phone} onChange={handleChange}
          style={inputStyle(false)}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Terms checkbox */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
        <input
          type="checkbox" id="terms-agree" checked={agreed}
          onChange={e => { setAgreed(e.target.checked); setErrors(prev => ({ ...prev, agreed: '' })); }}
          style={{ width: 16, height: 16, marginTop: 2, accentColor: '#d97706', cursor: 'pointer', flexShrink: 0 }}
        />
        <label htmlFor="terms-agree" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer', lineHeight: 1.4 }}>
          I agree to the{' '}
          <a href="#" style={{ color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="#" style={{ color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
        </label>
      </div>
      {errors.agreed && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: 12, display: 'block', marginTop: -16 }}>⚠ {errors.agreed}</span>}

      {/* Sign up button (orange/amber) */}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%', padding: '13px',
          background: isLoading ? '#d97706' : 'linear-gradient(135deg, #d97706, #f59e0b)',
          color: '#fff', fontSize: '1rem', fontWeight: 700,
          border: 'none', borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginBottom: 16,
          boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.92'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="spinner" /> Creating account…
          </span>
        ) : 'Sign up'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      {/* Continue with Google */}
      {googleError && (
        <div style={{ fontSize: '0.78rem', color: '#dc2626', textAlign: 'center', marginBottom: 8 }}>⚠️ {googleError}</div>
      )}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setGoogleError('Google Login Failed')}
          useOneTap
          theme="outline"
          shape="rectangular"
          text="continue_with"
          size="large"
        />
      </div>

      {/* Login link */}
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onGoToLogin}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#4f46e5', fontWeight: 700, fontSize: '0.875rem',
            padding: 0, fontFamily: 'inherit',
          }}
        >
          Login
        </button>
      </p>
    </form>
  );
}
