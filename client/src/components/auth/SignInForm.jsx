/**
 * SignInForm.jsx
 * Full sign-in form with email + password, field-level validation,
 * server error display, loading state, and password visibility toggle.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function SignInForm({ onGoToSignUp, onForgotPassword }) {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading, authError, clearError } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      if (data.accessToken) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Error is handled by context
    }
  }

  // ── Field change handler ──────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field error on type
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (authError) clearError();
  }

  // ── Client-side validation ────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    }
    return errs;
  }

  // ── Submit handler ────────────────────────────────────────────────
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
      navigate('/dashboard');
    } catch (_err) {
      // authError is already set by AuthContext
    }
  }

  return (
    <form onSubmit={handleSubmit} className="phase-enter flex flex-col gap-5" noValidate>

      {/* ── Welcome ───────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>👋</p>
        <h2 className="heading-md">Welcome back</h2>
        <p className="text-sm text-secondary mt-1">
          Sign in to your TravelAI account
        </p>
      </div>

      {/* ── Server error banner ───────────────────────────────────── */}
      {authError && (
        <div className="alert alert-error" id="signin-error-banner">
          ⚠️ {authError}
        </div>
      )}

      {/* ── Email ─────────────────────────────────────────────────── */}
      <div className="form-group">
        <label htmlFor="signin-email" className="form-label">Email Address</label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          className={`form-input${errors.email ? ' error' : ''}`}
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          disabled={isLoading}
        />
        {errors.email && <span className="form-error">⚠ {errors.email}</span>}
      </div>

      {/* ── Password ──────────────────────────────────────────────── */}
      <div className="form-group">
        <label htmlFor="signin-password" className="form-label">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="signin-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`form-input${errors.password ? ' error' : ''}`}
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            style={{ paddingRight: '48px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '4px',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => (e.target.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.target.style.color = 'var(--text-muted)')}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <span className="form-error">⚠ {errors.password}</span>}
      </div>

      {/* ── Forgot password link ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
        <button
          type="button"
          className="link"
          style={{ fontSize: '0.8125rem' }}
          onClick={onForgotPassword}
        >
          Forgot password?
        </button>
      </div>

      {/* ── Submit button ─────────────────────────────────────────── */}
      <button
        type="submit"
        id="signin-submit"
        className="btn btn-primary btn-full btn-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Signing in…
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div className="divider">or</div>

      {/* ── Google OAuth button ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.error('Google Login Failed')}
          useOneTap
          theme="outline"
          shape="rectangular"
          text="signin_with"
          size="large"
        />
      </div>

      {/* ── Switch to signup ──────────────────────────────────────── */}
      <div className="text-center mt-2">
        <p className="text-sm text-muted">
          Don't have an account?{' '}
          <button type="button" className="link" onClick={onGoToSignUp}>
            Create one
          </button>
        </p>
      </div>
    </form>
  );
}
