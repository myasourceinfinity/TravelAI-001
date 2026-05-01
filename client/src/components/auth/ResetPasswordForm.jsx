/**
 * ResetPasswordForm.jsx
 * Step 2 of password reset — user enters a new password using the token from the URL.
 */

import { useState, useMemo } from 'react';
import { resetPassword } from '../../services/authService';

export default function ResetPasswordForm({ token, onBackToSignIn }) {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors]         = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setLoading]     = useState(false);
  const [success, setSuccess]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Password strength ─────────────────────────────────────────
  const strength = useMemo(() => {
    const p = form.password;
    if (!p) return { score: 0, label: '', cls: '' };
    let score = 0;
    if (p.length >= 8)  score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const map = [
      { label: '', cls: '' },
      { label: 'Weak', cls: 'weak' },
      { label: 'Fair', cls: 'fair' },
      { label: 'Good', cls: 'good' },
      { label: 'Strong', cls: 'strong' },
    ];
    return { score, ...map[score] };
  }, [form.password]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  }

  function validate() {
    const errs = {};
    if (!form.password) {
      errs.password = 'New password is required.';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (!form.confirm) {
      errs.confirm = 'Please confirm your password.';
    } else if (form.password !== form.confirm) {
      errs.confirm = 'Passwords do not match.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ token, password: form.password });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── No token state ────────────────────────────────────────────
  if (!token) {
    return (
      <div className="phase-enter flex flex-col gap-5 text-center">
        <p style={{ fontSize: '2.5rem' }}>⚠️</p>
        <h2 className="heading-md">Invalid Reset Link</h2>
        <p className="text-sm text-secondary">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <button type="button" className="btn btn-primary btn-full" onClick={onBackToSignIn}>
          Back to Sign In
        </button>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="phase-enter flex flex-col gap-5 text-center">
        <p style={{ fontSize: '2.5rem', marginBottom: '4px' }}>✅</p>
        <h2 className="heading-md">Password Updated!</h2>
        <p className="text-sm text-secondary">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-full btn-lg mt-2"
          onClick={onBackToSignIn}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="phase-enter flex flex-col gap-5" noValidate>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🔑</p>
        <h2 className="heading-md">Set a new password</h2>
        <p className="text-sm text-secondary mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      {/* ── Server error ─────────────────────────────────────────── */}
      {serverError && (
        <div className="alert alert-error">⚠️ {serverError}</div>
      )}

      {/* ── New Password ─────────────────────────────────────────── */}
      <div className="form-group">
        <label htmlFor="reset-password" className="form-label">New Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="reset-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`form-input${errors.password ? ' error' : ''}`}
            placeholder="At least 8 characters"
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
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {/* Strength bar */}
        {form.password && (
          <>
            <div className="strength-bar-wrap">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`strength-segment${i <= strength.score ? ` filled-${strength.cls}` : ''}`}
                />
              ))}
            </div>
            <span className={`strength-label ${strength.cls}`}>
              {strength.label}
            </span>
          </>
        )}
        {errors.password && <span className="form-error">⚠ {errors.password}</span>}
      </div>

      {/* ── Confirm Password ─────────────────────────────────────── */}
      <div className="form-group">
        <label htmlFor="reset-confirm" className="form-label">Confirm Password</label>
        <input
          id="reset-confirm"
          name="confirm"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          className={`form-input${errors.confirm ? ' error' : ''}`}
          placeholder="Re-enter your new password"
          value={form.confirm}
          onChange={handleChange}
          disabled={isLoading}
        />
        {errors.confirm && <span className="form-error">⚠ {errors.confirm}</span>}
      </div>

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <button
        type="submit"
        id="reset-submit"
        className="btn btn-primary btn-full btn-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Updating…
          </>
        ) : (
          'Reset Password'
        )}
      </button>

      {/* ── Back link ─────────────────────────────────────────────── */}
      <div className="text-center mt-2">
        <button type="button" className="link" onClick={onBackToSignIn}>
          ← Back to Sign In
        </button>
      </div>
    </form>
  );
}
