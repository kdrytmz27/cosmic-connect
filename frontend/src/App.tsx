import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { PageTransition } from './components/PageTransition';
import { BrandLoader } from './components/BrandLoader';
import { HardwareBackButton } from './components/HardwareBackButton';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import Income from './pages/Income';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Match = lazy(() => import('./pages/Match'));
const Messages = lazy(() => import('./pages/Messages'));
const Fortune = lazy(() => import('./pages/Fortune'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Login = lazy(() => import('./features/auth/pages/Login'));
const Register = lazy(() => import('./features/auth/pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Market = lazy(() => import('./pages/Market'));
const CosmicVip = lazy(() => import('./pages/CosmicVip'));
const Games = lazy(() => import('./pages/Games'));
const Quests = lazy(() => import('./pages/Quests'));
const TellerDashboard = lazy(() => import('./pages/TellerDashboard'));
const TellerProfile = lazy(() => import('./pages/TellerProfile'));
const TellerApplication = lazy(() => import('./pages/TellerApplication'));
const SynastryAnalysis = lazy(() => import('./pages/SynastryAnalysis'));
const PartyList = lazy(() => import('./pages/PartyList'));
const PartyRoom = lazy(() => import('./pages/PartyRoom'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ForgotPassword = lazy(() => import('./features/auth/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/auth/pages/ResetPassword'));

// Giriş yapmış kullanıcılar için koruma
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// VULN 67 FIX: Sadece normal kullanıcılar için (falcılar erişemez)
// Not: Client-side guard sadece UX amaçlıdır. Backend her zaman kendi yetkisini doğrular.
export const UserOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  // JWT'den role oku (localStorage user.role'den değil)
  let roleFromToken: string | null = null;
  if (token) {
    try { const d: any = JSON.parse(atob(token.split('.')[1])); roleFromToken = d.role; } catch { }
  }
  const role = roleFromToken || user?.role;
  if (role === 'FORTUNE_TELLER') return <Navigate to="/teller-dashboard" replace />;
  return <>{children}</>;
};

// VULN 67 FIX: Sadece falcılar için (normal kullanıcılar erişemez)
export const TellerOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  let roleFromToken: string | null = null;
  if (token) {
    try { const d: any = JSON.parse(atob(token.split('.')[1])); roleFromToken = d.role; } catch { }
  }
  const role = roleFromToken || user?.role;
  if (role !== 'FORTUNE_TELLER' && role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// VULN 67 FIX: Sadece adminler için
export const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  let roleFromToken: string | null = null;
  if (token) {
    try { const d: any = JSON.parse(atob(token.split('.')[1])); roleFromToken = d.role; } catch { }
  }
  const role = roleFromToken || user?.role;
  if (role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<BrandLoader message="Uzay-zaman bükülüyor..." />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <SocketProvider>
                <NotificationProvider>
                  <Layout />
                </NotificationProvider>
              </SocketProvider>
            </ProtectedRoute>
          }>
            {/* Normal kullanıcı sayfaları */}
            <Route index element={
              <UserOnlyRoute>
                <PageTransition><Home /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
            <Route path="match" element={
              <UserOnlyRoute>
                <PageTransition><Match /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="fortune" element={
              <UserOnlyRoute>
                <PageTransition><Fortune /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="market" element={
              <UserOnlyRoute>
                <PageTransition><Market /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="vip" element={
              <UserOnlyRoute>
                <PageTransition><CosmicVip /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="games" element={
              <UserOnlyRoute>
                <PageTransition><Games /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="quests" element={
              <UserOnlyRoute>
                <PageTransition><Quests /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="party" element={
              <UserOnlyRoute>
                <PageTransition><PartyList /></PageTransition>
              </UserOnlyRoute>
            } />
            <Route path="party/:id" element={
              <UserOnlyRoute>
                <PageTransition><PartyRoom /></PageTransition>
              </UserOnlyRoute>
            } />

            {/* Falcı sayfaları */}
            <Route path="teller-dashboard" element={
              <TellerOnlyRoute>
                <PageTransition><TellerDashboard /></PageTransition>
              </TellerOnlyRoute>
            } />
            <Route path="teller-application" element={<PageTransition><TellerApplication /></PageTransition>} />

            {/* Admin sayfaları */}
            <Route path="admin" element={
              <AdminOnlyRoute>
                <PageTransition><AdminDashboard /></PageTransition>
              </AdminOnlyRoute>
            } />

            {/* Ortak sayfalar */}
            <Route path="messages" element={<PageTransition><Messages /></PageTransition>} />
            <Route path="teller/:id" element={<PageTransition><TellerProfile /></PageTransition>} />
            <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="income" element={<PageTransition><Income /></PageTransition>} />
            <Route path="profile/:id" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="synastry/:id" element={<PageTransition><SynastryAnalysis /></PageTransition>} />
            <Route path="leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

function App() {
  return (
    <HashRouter>
      <HardwareBackButton />
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
