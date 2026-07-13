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
const MyTrips               = lazy(() => import('./components/trips/MyTrips'));
const HomePage              = lazy(() => import('./components/home/HomePage'));


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
if (!GOOGLE_CLIENT_ID) console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will fail.');

// ── Route guard: redirects based on auth state ──────────────────────────────
function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // or <LoadingSpinner />
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={
              <GuestRoute><AuthPage /></GuestRoute>
            } />
            <Route path="/signup" element={
              <GuestRoute><AuthPage /></GuestRoute>
            } />
            <Route path="/verify-email" element={
              <GuestRoute><AuthPage /></GuestRoute>
            } />
            <Route path="/reset-password" element={
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
            <Route path="/my-trips" element={
              <PrivateRoute><MyTrips /></PrivateRoute>
            } />
            <Route path="*" element={
              <PrivateRoute>
                <Navigate to="/" replace />
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
