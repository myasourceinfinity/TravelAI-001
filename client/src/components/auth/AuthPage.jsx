/**
 * AuthPage.jsx
 * Two-column split layout:
 *   Left  → decorative panel (gradient background, orbs, branding, feature pills)
 *   Right → white form panel (Sign In / Sign Up / Forgot / Reset)
 */

import { useState, useEffect, useCallback } from 'react';
import SignUpFlow from './SignUpFlow';
import SignInForm from './SignInForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';

// ─── Left decorative panel ───────────────────────────────────────────────────
function LeftPanel({ mode }) {
  const isSignup = mode === 'signup';

  const bg = isSignup
    ? 'linear-gradient(145deg, #c4cfe8 0%, #b8b8d8 30%, #c8c0d8 60%, #d4c0b0 100%)'
    : 'linear-gradient(145deg, #c8d8e0 0%, #b8cfc8 30%, #d4c8b8 70%, #c8b8a8 100%)';

  const orbColor = isSignup
    ? 'rgba(140,120,210,0.55)'
    : 'rgba(100,180,150,0.55)';

  const orbColorInner = isSignup
    ? 'rgba(120,100,190,0.6)'
    : 'rgba(80,160,130,0.6)';

  const headingColor = isSignup ? '#2a1a50' : '#1a3028';
  const textColor    = isSignup ? '#4a3068' : '#3a5048';
  const accentLine   = isSignup ? '#d97706' : '#4caf7d';

  const dots = isSignup
    ? [{ t: '22%', l: '22%', c: '#8060c0' }, { t: '50%', l: '12%', c: '#60a060' }, { t: '50%', r: '14%', c: '#6090d8' }, { b: '22%', l: '40%', c: '#d05050' }]
    : [{ t: '22%', l: '22%', c: '#9060c8' }, { t: '50%', l: '12%', c: '#508050' }, { t: '50%', r: '14%', c: '#6090d8' }, { b: '22%', l: '40%', c: '#d05050' }];

  return (
    <div style={{
      width: '300px', minWidth: '300px',
      background: bg,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      padding: '28px 24px',
    }}>
      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <span style={{ fontSize: '1.1rem' }}>✈️</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2a', fontFamily: 'Outfit, sans-serif' }}>
          Travel AI
        </span>
      </div>

      {/* ── Small floating dots (top-right) ── */}
      <div style={{ position: 'absolute', top: 36, right: 48, width: 20, height: 20, borderRadius: '50%', background: '#e88080', opacity: 0.85 }} />
      <div style={{ position: 'absolute', top: 44, right: 24, width: 16, height: 16, borderRadius: '50%', background: '#80a8e8', opacity: 0.85 }} />
      <div style={{ position: 'absolute', top: 38, right: 8,  width: 12, height: 12, borderRadius: '50%', background: '#e8c060', opacity: 0.85 }} />

      {/* ── Large orb cluster ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', width: 210, height: 210, borderRadius: '50%',
          background: `radial-gradient(circle at 40% 40%, ${orbColor}, rgba(80,80,150,0.2))`,
          border: `1.5px solid ${orbColor.replace('0.55)', '0.3)')}`,
        }} />
        <div style={{
          position: 'absolute', width: 130, height: 130, borderRadius: '50%',
          background: `radial-gradient(circle at 40% 40%, ${orbColorInner}, rgba(60,60,130,0.3))`,
          border: `1.5px solid ${orbColorInner.replace('0.6)', '0.35)')}`,
        }} />
        {dots.map((d, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: d.t, bottom: d.b, left: d.l, right: d.r,
            width: 8, height: 8, borderRadius: '50%', background: d.c,
          }} />
        ))}
      </div>

      {/* ── Beige orb bottom-right ── */}
      <div style={{
        position: 'absolute', bottom: '20%', right: '-20px',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, rgba(210,185,155,0.75), rgba(190,165,135,0.4))',
      }} />

      {/* ── Tagline ── */}
      <div style={{ zIndex: 2, marginBottom: isSignup ? 12 : 24 }}>
        <h2 style={{
          fontSize: '1.65rem', fontWeight: 800, color: headingColor,
          fontFamily: 'Outfit, sans-serif', lineHeight: 1.2, margin: '0 0 10px',
        }}>
          {isSignup ? <>Create your<br />account</> : <>Your journey<br />starts here.</>}
        </h2>
        <p style={{ fontSize: '0.82rem', color: textColor, lineHeight: 1.55, margin: 0 }}>
          {isSignup
            ? 'Your AI travel companion starts here.\nA few steps and you\'re ready to explore.'
            : 'AI-powered travel planning —\nitineraries, bookings & inspiration\nall in one beautiful place.'}
        </p>
      </div>

      {/* ── Feature pills (sign-in only) ── */}
      {!isSignup && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2 }}>
          {[
            { dot: '#4caf7d', label: 'Smart itineraries' },
            { dot: '#5b8def', label: 'Live prices' },
            { dot: '#9b87f5', label: 'AI concierge' },
          ].map(({ dot, label }) => (
            <div key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.55)', borderRadius: 999, padding: '6px 14px',
              backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.6)', width: 'fit-content',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a3028' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Accent line (signup only) ── */}
      {isSignup && (
        <div style={{ zIndex: 2, height: 3, width: '60%', background: accentLine, borderRadius: 99, marginBottom: 4 }} />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const pathname = window.location.pathname;
    if (pathname === '/reset-password' || view === 'reset-password') return 'reset-password';
    if (pathname === '/verify-email'   || view === 'verify-email')   return 'verify-email';
    if (pathname === '/login'          || view === 'login')          return 'signin';
    if (pathname === '/signup'         || view === 'signup')         return 'signup';
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
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveTab('signin');
      } else {
        console.error('Verification failed:', data.message);
      }
    } catch (err) {
      console.error('Email verification error:', err);
    }
  }, []);

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const view     = params.get('view');
    const pathname = window.location.pathname;
    if (token) window.history.replaceState({}, '', '/');
    if (token && (view === 'verify-email' || pathname === '/verify-email')) {
      (async () => { await verifyEmailToken(token); })();
    }
  }, [verifyEmailToken]);

  function renderPanel() {
    switch (activeTab) {
      case 'forgot-password':
        return <ForgotPasswordForm onBackToSignIn={() => setActiveTab('signin')} />;
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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: '#fff',
    }}>
      {/* ── Left decorative panel ── */}
      <LeftPanel mode={activeTab} />

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 56px',
        background: '#ffffff',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {renderPanel()}

          {/* Footer */}
          <p style={{ marginTop: 24, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
            By continuing you agree to our{' '}
            <a href="#" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
