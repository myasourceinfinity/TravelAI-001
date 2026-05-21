import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import LoadingSpinner from './components/common/LoadingSpinner';
//import TravellerDashboard from './components/dashboard/TravellerDashboard';
//import PlanTripWithTravelAI from './components/trips/PlanTripWithTravelAI';
import { lazy, Suspense } from 'react';

const TravellerDashboard = lazy(() => import('./components/dashboard/TravellerDashboard'));
const PlanTripWithTravelAI = lazy(() => import('./components/trips/PlanTripWithTravelAI'));
const TripDetailPage        = lazy(() => import('./components/trips/TripDetailPage'));


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
if (!GOOGLE_CLIENT_ID) console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will fail.');

// ── Route guard: redirects based on auth state ──────────────────────────────
function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // or <LoadingSpinner />
  return user ? children : <Navigate to="/" replace />;
}

function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
		<Suspense fallback={<LoadingSpinner />}>
					  <Routes>...</Routes>
			</Suspense>
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
			<Route path="/trip/:id" element={
			  <PrivateRoute><TripDetailPage /></PrivateRoute>
			} />
			<Route path="*" element={
			  <PrivateRoute>
			    <Navigate to="/dashboard" replace />
			  </PrivateRoute>
			} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
