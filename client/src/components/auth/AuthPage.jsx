/**
 * AuthPage.jsx
 * Main authentication shell. Renders the glassmorphism card with
 * Sign In / Sign Up tabs, Forgot Password, and Reset Password views.
 */

import { useState, useEffect , useCallback } from 'react';
import SignUpFlow from './SignUpFlow';
import SignInForm from './SignInForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';
import MapPanel from './MapPanel';

// ═══════════════════════════════════════════════════════════════════════════════
export default function AuthPage() {
  // 'signin' | 'signup' | 'forgot-password' | 'reset-password'
  const [activeTab, setActiveTab] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const pathname = window.location.pathname;
      if (pathname === '/reset-password' || view === 'reset-password') return 'reset-password';
      if (pathname === '/verify-email'   || view === 'verify-email')   return 'verify-email';
      return 'signup';
    });
	const [resetToken, setResetToken] = useState(() => {
	    const params = new URLSearchParams(window.location.search);
	    const view = params.get('view');
	    const token = params.get('token');
	    const pathname = window.location.pathname;
	    if (token && (view === 'reset-password' || pathname === '/reset-password')) return token;
	    return null;
	  });
  const [selectedCurrency, setSelectedCurrency] = useState('NZD');
  
  const verifyEmailToken = useCallback(async (token) => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const res = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          const data = await res.json();
  		if (res.ok) {
  		      setActiveTab('signin'); // navigate to sign-in after verification
  		    } else {
  		      console.error('Verification failed:', data.message);
  		    }
  		  } catch (err) {
  		    console.error('Email verification error:', err);
  		  }
  		}, []);

  // ── On mount, check URL for ?view=reset-password&token=xxx or verify-email ──────────────────
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const view     = params.get('view');
    const pathname = window.location.pathname;

    // Clean the URL — no setState, just DOM side-effect
    if (token) {
      window.history.replaceState({}, '', '/');
    }

    // Wrap in async IIFE so the linter knows setState
    // happens asynchronously inside an await, not synchronously
    if (token && (view === 'verify-email' || pathname === '/verify-email')) {
      (async () => {
        await verifyEmailToken(token);
      })();
    }

  }, [verifyEmailToken]);

  

  // ── Helper: should tab bar be visible? ──────────────────────────────────────
  const showTabs = activeTab === 'signin' || activeTab === 'signup';

  // ── Render active panel ─────────────────────────────────────────────────────
  function renderPanel() {
    switch (activeTab) {
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBackToSignIn={() => setActiveTab('signin')}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordForm
            token={resetToken}
            onBackToSignIn={() => { setResetToken(null); setActiveTab('signin'); }}
          />
        );
      case 'signin':
        return (
          <SignInForm
            onGoToSignUp={() => setActiveTab('signup')}
            onForgotPassword={() => setActiveTab('forgot-password')}
          />
        );
      case 'signup':
      default:
        return (
          <SignUpFlow 
            onGoToLogin={() => setActiveTab('signin')} 
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />
        );
    }
  }

  return (
    <div className="auth-layout page-bg">
      {/* ── Left Column: Form Panel ─────────────────────────────────── */}
      <div className="auth-form-panel">
        <div className="glass-card animate-in" style={{
          width: '100%',
          maxWidth: '520px',
          padding: 'var(--sp-8)',
          margin: '0 auto',
        }}>

          {/* ── Brand Header ─────────────────────────────────────────────── */}
          <div className="text-center mb-6">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 'var(--sp-3)',
            }}>
              <span style={{ fontSize: '1.8rem' }}>✈️</span>
              <h1 className="heading-lg gradient-text" style={{ margin: 0 }}>
                TravelAI
              </h1>
            </div>
            <p className="text-sm text-muted">
              Your AI-powered travel companion
            </p>
          </div>

          {/* ── Tab Bar (hidden on forgot/reset views) ────────────────────── */}
          {showTabs && (
            <div className="tab-bar mb-6" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'signin'}
                id="tab-signin"
                className={`tab-btn${activeTab === 'signin' ? ' active' : ''}`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'signup'}
                id="tab-signup"
                className={`tab-btn${activeTab === 'signup' ? ' active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* ── Active Panel ──────────────────────────────────────────────── */}
          {renderPanel()}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="text-center mt-6">
            <p className="text-xs text-muted">
              By continuing you agree to our{' '}
              <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>

      {/* ── Right Column: Map Panel ─────────────────────────────────── */}
      <div className="auth-map-panel">
        <MapPanel selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
      </div>
    </div>
  );
}
