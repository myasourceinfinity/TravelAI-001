import './index.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';
import './css/responsive.css';
import './css/fonts.css';
import './css/tokens.css';
import './css/reset.css';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import { lazy, Suspense, useLayoutEffect } from 'react';
import Footer from './components/common/Footer';
import Navbar from './components/common/Navbar'; // Global Navbar Support
import LegacyTravelPage from './components/legacy/LegacyTravelPage';

const TravellerDashboard   = lazy(() => import('./components/dashboard/TravellerDashboard'));
const TravellerProfilePage = lazy(() => import('./components/dashboard/TravellerProfilePage'));
const AgentDashboard       = lazy(() => import('./components/dashboard/AgentDashboard'));
const AgentProfilePage     = lazy(() => import('./components/dashboard/AgentProfilePage'));
const AdminDashboard       = lazy(() => import('./components/admin/AdminDashboard'));
const PackagesList         = lazy(() => import('./components/packages/PackagesList'));
const PackageDetailPublic  = lazy(() => import('./components/packages/PackageDetailPublic'));
const AgentDetailPublic    = lazy(() => import('./components/agents/AgentDetailPublic'));
const PlanTripWithTravelAI = lazy(() => import('./components/trips/PlanTripWithTravelAI'));
const TripDetailPage       = lazy(() => import('./components/trips/TripDetailPage'));
const MyTrips              = lazy(() => import('./components/trips/MyTrips'));
const ContactPage          = lazy(() => import('./components/contacts/Contact'));
// const NotFoundPage         = lazy(() => import('./components/common/NotFound'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
if (!GOOGLE_CLIENT_ID) console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will fail.');

const ADMIN_ROLES = ['admin', 'useradmin', 'superadmin'];
const PAGE_PATHS = [
  '/',
  '/about-us',
  '/ai-planner',
  '/ai-planner-result',
  '/journeys',
  '/journey-details',
  '/blog-listing',
  '/blog-details',
  '/privacy-policy',
  '/terms-of-use',
  '/my-trips.html',
  '/profile.html',
  '/reset-password.html',
  '/404',
];

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

function AppNavbar() {
  const { pathname } = useLocation();
  const { isLoading } = useAuth();

  const hiddenRoutes = ['/login', '/signup', '/verify-email', '/reset-password'];

  if (isLoading || hiddenRoutes.includes(pathname) || PAGE_PATHS.includes(pathname)) {
    return null;
  }

  return <Navbar />;
}

function AppFooter() {
  const { pathname } = useLocation();
  const { isLoading } = useAuth();

  const hiddenRoutes = [
    '/login',
    '/signup',
    '/verify-email',
    '/reset-password',
  ];

  if (isLoading || hiddenRoutes.includes(pathname) || PAGE_PATHS.includes(pathname)) {
    return null;
  }

  return <Footer />;
}

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return user ? children : <Navigate to="/login?reason=session-expired" replace />;
}

function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return user ? <Navigate to="/dashboard" replace /> : children;
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

export default function App() {
  return (
    <>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <AppNavbar />
            <main className="app-main-shell">
              <Suspense
                fallback={
                  <div className="app-route-loader">
                    <LoadingSpinner />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<LegacyTravelPage />} />
                  <Route path="/about-us" element={<LegacyTravelPage />} />
                  <Route
                    path="/ai-planner"
                    element={
                      <PrivateRoute>
                        <PlanTripWithTravelAI />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/ai-planner-result" element={<LegacyTravelPage />} />
                  <Route path="/journeys" element={<PackagesList />} />
                  <Route path="/journey-details" element={<LegacyTravelPage />} />
                  <Route path="/blog-listing" element={<LegacyTravelPage />} />
                  <Route path="/blog-details" element={<LegacyTravelPage />} />
                  <Route path="/privacy-policy" element={<LegacyTravelPage />} />
                  <Route path="/terms-of-use" element={<LegacyTravelPage />} />
                  <Route
                    path="/my-trips.html"
                    element={
                      <PrivateRoute>
                        <MyTrips />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile.html"
                    element={
                      <PrivateRoute>
                        <ProfileRoute />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/reset-password.html" element={<LegacyTravelPage />} />
                  <Route path="/404" element={<LegacyTravelPage />} />

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

                  <Route path="/packages" element={<PackagesList />} />
                  <Route path="/packages/:id" element={<PackageDetailPublic />} />
                  <Route path="/agents/:id" element={<AgentDetailPublic />} />

                  <Route path="/contact" element={<ContactPage />} />

                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />

                  {/* Render NotFound page instead of redirecting to home */}
                  {/* <Route path="*" element={<NotFoundPage />} /> */}
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