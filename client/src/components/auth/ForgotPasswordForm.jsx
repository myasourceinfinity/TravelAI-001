/**
 * ForgotPasswordForm.jsx
 * Step 1 of password reset — user enters their email to receive a reset link.
 */

import { useState } from 'react';
import { forgotPassword } from '../../services/authService';

export default function ForgotPasswordForm({ onBackToSignIn }) {
  const [email, setEmail]       = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const [sent, setSent]         = useState(false);

  function validate() {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────
  if (sent) {
    return (
      <div className="phase-enter flex flex-col gap-5 text-center">
        <p style={{ fontSize: '2.5rem', marginBottom: '4px' }}>📧</p>
        <h2 className="heading-md">Check your email</h2>
        <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
          If an account exists for <strong style={{ color: 'var(--brand-300)' }}>{email}</strong>,
          we've sent a password reset link. It expires in <strong>1 hour</strong>.
        </p>
        <div className="alert alert-info">
          💡 Check your spam folder if you don't see the email.
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-full mt-2"
          onClick={onBackToSignIn}
        >
          ← Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="phase-enter flex flex-col gap-5" noValidate>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</p>
        <h2 className="heading-md">Forgot your password?</h2>
        <p className="text-sm text-secondary mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error">⚠️ {error}</div>
      )}

      {/* ── Email ─────────────────────────────────────────────────── */}
      <div className="form-group">
        <label htmlFor="forgot-email" className="form-label">Email Address</label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          className={`form-input${error ? ' error' : ''}`}
          placeholder="you@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          disabled={isLoading}
        />
      </div>

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <button
        type="submit"
        id="forgot-submit"
        className="btn btn-primary btn-full btn-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Sending…
          </>
        ) : (
          'Send Reset Link'
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
