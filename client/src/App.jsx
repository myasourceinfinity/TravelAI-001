import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import TravellerDashboard from './components/dashboard/TravellerDashboard';
import PlanTripWithTravelAI from './components/trips/PlanTripWithTravelAI';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ── Route guard: redirects based on auth state ──────────────────────────────
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={
              <GuestRoute><AuthPage /></GuestRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute><TravellerDashboard /></PrivateRoute>
            } />
            <Route path="/plan-trip" element={
              <PrivateRoute><PlanTripWithTravelAI /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
