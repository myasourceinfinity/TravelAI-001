/**
 * SignInForm.jsx
 * Sign-in form styled to match the prototype:
 *  - "Welcome back" heading
 *  - Social login buttons (Google / Apple / Facebook outline pills)
 *  - "or continue with email" divider
 *  - Email + Password fields (light outlined inputs)
 *  - Forgot password right-aligned
 *  - Full-width green Login button
 *  - "Don't have an account? Sign up" footer
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function SignInForm({ onGoToSignUp, onForgotPassword }) {
  
  const { login, loginWithGoogle, isLoading, authError, clearError } = useAuth();

  const [form, setForm]               = useState({ email: '', password: '' });
  const [errors, setErrors]           = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function handleGoogleSuccess(credentialResponse) {
    try {
      await loginWithGoogle(credentialResponse.credential);
      sessionStorage.removeItem('pending_trip_description');
    } catch (_) {
      /* handled by context */
    }
  }

  // ── Field helpers ────────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (authError) clearError();
  }

  function validate() {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.password) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      sessionStorage.removeItem('pending_trip_description');
    } catch (_) {
      /* authError set by context */
    }
  }

  // ── Shared input style (light outlined) ─────────────────────────────────────
  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
    borderRadius: 8,
    fontSize: '0.9375rem',
    color: '#111827',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  });

  // ── Social button style ──────────────────────────────────────────────────────
  const socialBtnStyle = {
    width: '100%',
    padding: '11px 16px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#fff',
    fontSize: '0.9rem',
    color: '#374151',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'background 0.15s, border-color 0.15s',
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        width: '100%',
        maxWidth: '100%',
      }}
    >

      {/* ── Heading ── */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', fontFamily: 'Outfit, sans-serif' }}>
        Welcome back
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 28px' }}>
        Sign in to continue your journey
      </p>

      {/* ── Error banner ── */}
      {authError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '10px 14px', marginBottom: 20, fontSize: '0.875rem', color: '#dc2626',
        }}>
          ⚠️ {authError}
        </div>
      )}

      {/* ── Social buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {/* Google — using the real SDK button, wrapped in a styled container */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error('Google Login Failed')}
            useOneTap
            theme="outline"
            shape="rectangular"
            text="continue_with"
            size="large"
          />
        </div>

        {/* Apple (UI only — no SDK wired) */}
        <button
          type="button"
          style={socialBtnStyle}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.3-49 30.1 0 134.4 2.6 198.4 99zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
          </svg>
          Continue with Apple
        </button>

        {/* Facebook (UI only) */}
        <button
          type="button"
          style={socialBtnStyle}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Continue with Facebook
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>or continue with email</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      {/* ── Email ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Email Address
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          disabled={isLoading}
          style={inputStyle(!!errors.email)}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = errors.email ? '#dc2626' : '#d1d5db'}
        />
        {errors.email && <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4, display: 'block' }}>⚠ {errors.email}</span>}
      </div>

      {/* ── Password ── */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="signin-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = errors.password ? '#dc2626' : '#d1d5db'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
              fontSize: '1rem', padding: '4px',
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4, display: 'block' }}>⚠ {errors.password}</span>}
      </div>

      {/* ── Forgot password ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button
          type="button"
          onClick={onForgotPassword}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.875rem', color: '#3d8b5e', fontWeight: 600,
            padding: 0, fontFamily: 'inherit',
          }}
        >
          Forgot password?
        </button>
      </div>

      {/* ── Login button (green, full-width) ── */}
      <button
        type="submit"
        id="signin-submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '13px',
          background: isLoading ? '#6ba88a' : 'linear-gradient(135deg, #2d7a55, #3d9e6e)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity 0.15s, transform 0.15s',
          marginBottom: 20,
          boxShadow: '0 4px 14px rgba(45, 122, 85, 0.35)',
        }}
        onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.92'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="spinner" /> Signing in…
          </span>
        ) : 'Login'}
      </button>

      {/* ── Sign up link ── */}
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onGoToSignUp}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#3d8b5e', fontWeight: 700, fontSize: '0.875rem',
            padding: 0, fontFamily: 'inherit',
          }}
        >
          Sign up
        </button>
      </p>
    </form>
  );
}
