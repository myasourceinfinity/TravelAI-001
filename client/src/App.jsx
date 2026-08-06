import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import SplashScreen from './components/common/SplashScreen';
import Footer from './components/common/Footer';

const TravellerDashboard   = lazy(() => import('./components/dashboard/TravellerDashboard'));
const TravellerProfilePage = lazy(() => import('./components/dashboard/TravellerProfilePage'));
const AgentDashboard       = lazy(() => import('./components/dashboard/AgentDashboard'));
const AgentProfilePage     = lazy(() => import('./components/dashboard/AgentProfilePage'));
const AdminDashboard       = lazy(() => import('./components/admin/AdminDashboard'));
const AgentsList           = lazy(() => import('./components/agents/AgentsList'));
const AgentDetailPublic    = lazy(() => import('./components/agents/AgentDetailPublic'));
const PlanTripWithTravelAI = lazy(() => import('./components/trips/PlanTripWithTravelAI'));
const TripDetailPage       = lazy(() => import('./components/trips/TripDetailPage'));
const MyTrips              = lazy(() => import('./components/trips/MyTrips'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
if (!GOOGLE_CLIENT_ID) console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will fail.');

const ADMIN_ROLES = ['admin', 'useradmin', 'superadmin'];

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const timer = window.setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

function AppFooter() {
  const { pathname } = useLocation();
  const { isLoading } = useAuth();

  const hiddenRoutes = [
    '/',
    '/login',
    '/signup',
    '/verify-email',
    '/reset-password',
  ];

  if (isLoading || hiddenRoutes.includes(pathname)) {
    return null;
  }

  return <Footer />;
}

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

  if (!ADMIN_ROLES.includes(user.role_type)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function DashboardRoute() {
  const { user } = useAuth();

  if (ADMIN_ROLES.includes(user?.role_type)) {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role_type === 'agent') {
    return <AgentDashboard />;
  }

  return <TravellerDashboard />;
}

function ProfileRoute() {
  const { user } = useAuth();

  return user?.role_type === 'agent'
    ? <AgentProfilePage />
    : <TravellerProfilePage />;
}

function HomeRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (ADMIN_ROLES.includes(user?.role_type)) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
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
            <ScrollToTop />
            <main className="app-main-shell">
            <Suspense
              fallback={
                <div className="app-route-loader">
                  <LoadingSpinner />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomeRoute />} />

                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <AuthPage />
                    </GuestRoute>
                  }
                />

                <Route
                  path="/signup"
                  element={
                    <GuestRoute>
                      <AuthPage />
                    </GuestRoute>
                  }
                />

                <Route
                  path="/verify-email"
                  element={
                    <GuestRoute>
                      <AuthPage />
                    </GuestRoute>
                  }
                />

                <Route
                  path="/reset-password"
                  element={
                    <GuestRoute>
                      <AuthPage />
                    </GuestRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardRoute />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <ProfileRoute />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/plan-trip"
                  element={
                    <PrivateRoute>
                      <PlanTripWithTravelAI />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/trip/:id"
                  element={
                    <PrivateRoute>
                      <TripDetailPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/my-trips"
                  element={
                    <PrivateRoute>
                      <MyTrips />
                    </PrivateRoute>
                  }
                />

                <Route path="/agents" element={<AgentsList />} />
                <Route path="/agents/:id" element={<AgentDetailPublic />} />

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <PrivateRoute>
                      <Navigate to="/dashboard" replace />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
            </main>
            <AppFooter />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </>
  );
}