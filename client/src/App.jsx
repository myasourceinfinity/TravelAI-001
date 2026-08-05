import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import LoadingSpinner from './components/common/LoadingSpinner';
//import TravellerDashboard from './components/dashboard/TravellerDashboard';
//import PlanTripWithTravelAI from './components/trips/PlanTripWithTravelAI';
import { lazy, Suspense, useEffect, useState, } from 'react';
import SplashScreen from './components/common/SplashScreen';

const TravellerDashboard = lazy(() => import('./components/dashboard/TravellerDashboard'));
const AgentDashboard     = lazy(() => import('./components/dashboard/AgentDashboard'));
const AgentProfilePage   = lazy(() => import('./components/dashboard/AgentProfilePage'));
const AdminDashboard     = lazy(() => import('./components/admin/AdminDashboard'));
const AgentsList         = lazy(() => import('./components/agents/AgentsList'));
const AgentDetailPublic  = lazy(() => import('./components/agents/AgentDetailPublic'));
const PlanTripWithTravelAI = lazy(() => import('./components/trips/PlanTripWithTravelAI'));
const TripDetailPage        = lazy(() => import('./components/trips/TripDetailPage'));
const MyTrips               = lazy(() => import('./components/trips/MyTrips'));
const HomePage              = lazy(() => import('./components/home/HomePage'));


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
if (!GOOGLE_CLIENT_ID) console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will fail.');

// ── Route guard: redirects based on auth state ──────────────────────────────
const ADMIN_ROLES = ['admin', 'useradmin', 'superadmin'];

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(user.role_type)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRoute() {
  const { user } = useAuth();
  if (ADMIN_ROLES.includes(user?.role_type)) return <Navigate to="/admin" replace />;
  return user?.role_type === 'agent' ? <AgentDashboard /> : <TravellerDashboard />;
}

function ProfileRoute() {
  const { user } = useAuth();
  return user?.role_type === 'agent' ? <AgentProfilePage /> : <TravellerDashboard />;
}

function HomeRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role_type === 'agent') return <Navigate to="/dashboard" replace />;
  return <HomePage />;
}

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
      const splashTimer = window.setTimeout(() => {
        setShowSplash(false);
      }, 2200);

      return () => {
        window.clearTimeout(splashTimer);
      };
    }, []);

  return (
    <>
     {showSplash && <SplashScreen />}

    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
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
              <PrivateRoute><DashboardRoute /></PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute><ProfileRoute /></PrivateRoute>
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
            <Route path="/agents" element={<AgentsList />} />
            <Route path="/agents/:id" element={<AgentDetailPublic />} />
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
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
    </>
  );
}
