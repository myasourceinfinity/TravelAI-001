/**
 * SignUpFlow.jsx
 * Multi-step wrapper: Phase 1 (preferences) → Phase 2 (credentials) → Success
 * Manages combined form state and orchestrates the API call on final submit.
 */

import { useState } from 'react';
import SignUpPhase1 from './SignUpPhase1';
import SignUpPhase2 from './SignUpPhase2';
import { localSignup } from '../../services/authService';

// ── Stepper component (inline, no extra file needed) ────────────────────────
function Stepper({ current }) {
  const steps = ['Travel Vibe', 'Your Account', 'All Done!'];
  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      <div className="stepper" role="progressbar" aria-valuenow={current + 1} aria-valuemax={steps.length}>
        {steps.map((label, i) => (
          <div key={i} className="step" style={{ flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Left connector */}
              {i > 0 && (
                <div className={`step-line${i <= current ? ' done' : ''}`} />
              )}

              {/* Circle */}
              <div className={`step-circle ${
                i < current  ? 'done'   :
                i === current ? 'active' : ''
              }`}>
                {i < current ? '✓' : i + 1}
              </div>

              {/* Right connector */}
              {i < steps.length - 1 && (
                <div className={`step-line${i < current ? ' done' : ''}`} />
              )}
            </div>

            <span className={`step-label ${
              i < current  ? 'done'   :
              i === current ? 'active' : ''
            }`} style={{ marginTop: '6px', textAlign: 'center' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ email, onGoToLogin }) {
  return (
    <div className="phase-enter flex flex-col items-center gap-5 text-center" style={{ padding: 'var(--sp-4) 0' }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, hsl(158,65%,42%), hsl(158,75%,35%))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
        boxShadow: '0 0 32px hsla(158,70%,52%,0.4)',
        animation: 'fadeSlideUp 0.5s cubic-bezier(0.4,0,0.2,1) both',
      }}>
        ✓
      </div>

      <div>
        <h2 className="heading-md" style={{ marginBottom: 'var(--sp-2)' }}>
          🎉 Welcome aboard!
        </h2>
        <p className="text-secondary" style={{ maxWidth: '340px', lineHeight: '1.7' }}>
          Your account has been created. We've sent a verification link to{' '}
          <strong style={{ color: 'var(--brand-300)' }}>{email}</strong>.
          Please check your inbox.
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-lg"
        id="goto-login-btn"
        onClick={onGoToLogin}
        style={{ minWidth: 200 }}
      >
        Go to Sign In →
      </button>
    </div>
  );
}

// ── Initial blank form state ──────────────────────────────────────────────────
const INITIAL_DATA = {
  // Phase 1
  budget_amount:  '',
  destination:    '',
  location_types: [],
  // Phase 2
  first_name:       '',
  last_name:        '',
  phone:            '',
  email:            '',
  dob:              '',
  nationality:      '',
  password:         '',
  confirm_password: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function SignUpFlow({ onGoToLogin, selectedCurrency, onCurrencyChange }) {
  const [phase,       setPhase]       = useState(0);   // 0 | 1 | 2
  const [formData,    setFormData]    = useState(INITIAL_DATA);
  const [isLoading,   setIsLoading]   = useState(false);
  const [serverError, setServerError] = useState(null);

  function handleChange(partial) {
    setFormData(prev => ({ ...prev, ...partial }));
  }

  async function handleSubmit() {
    setIsLoading(true);
    setServerError(null);

    // Strip confirm_password — not sent to backend
    const { confirm_password: _, ...payload } = formData;
    payload.currency = selectedCurrency;

    try {
      await localSignup(payload);
      setPhase(2);   // success screen
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Stepper — hidden on success screen */}
      {phase < 2 && <Stepper current={phase} />}

      {phase === 0 && (
        <SignUpPhase1
          data={formData}
          onChange={handleChange}
          onNext={() => setPhase(1)}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
          onGoogleSuccess={(user, isNewUser) => {
            if (isNewUser) {
              handleChange({ email: user.email });
              setPhase(2);
            } else {
              onGoToLogin();
            }
          }}
        />
      )}

      {phase === 1 && (
        <SignUpPhase2
          data={formData}
          onChange={handleChange}
          onBack={() => { setServerError(null); setPhase(0); }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          serverError={serverError}
        />
      )}

      {phase === 2 && (
        <SuccessScreen
          email={formData.email}
          onGoToLogin={onGoToLogin}
        />
      )}
    </div>
  );
}
