import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { PageTransition } from './components/PageTransition';
import { BrandLoader } from './components/BrandLoader';
import Layout from './components/Layout';
import { CosmicBackground } from './components/CosmicBackground';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Match = lazy(() => import('./pages/Match'));
const Messages = lazy(() => import('./pages/Messages'));
const Fortune = lazy(() => import('./pages/Fortune'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Market = lazy(() => import('./pages/Market'));
const TellerDashboard = lazy(() => import('./pages/TellerDashboard'));
const TellerProfile = lazy(() => import('./pages/TellerProfile'));
const TellerApplication = lazy(() => import('./pages/TellerApplication'));
const SynastryAnalysis = lazy(() => import('./pages/SynastryAnalysis'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Giriş yapmış kullanıcılar için koruma
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Sadece normal kullanıcılar için (falcılar erişemez)
export const UserOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role === 'FORTUNE_TELLER') return <Navigate to="/teller-dashboard" replace />;
  return <>{children}</>;
};

// Sadece falcılar için (normal kullanıcılar erişemez)
export const TellerOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'FORTUNE_TELLER' && user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Sadece adminler için
export const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
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
      <ToastProvider>
        <AuthProvider>
          <CosmicBackground />
          <AnimatedRoutes />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
