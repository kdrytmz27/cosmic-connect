import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTellers from './pages/admin/AdminTellers';
import AdminEconomy from './pages/admin/AdminEconomy';
import AdminReports from './pages/admin/AdminReports';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();
  if (!token || user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tellers" element={<AdminTellers />} />
          <Route path="economy" element={<AdminEconomy />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
