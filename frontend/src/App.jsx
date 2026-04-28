import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import useAuthStore from './store/authStore';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Passenger pages
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import RoutePlanner from './pages/passenger/RoutePlanner';
import Bookmarks from './pages/passenger/Bookmarks';

// Driver pages
import DriverDashboard from './pages/driver/DriverDashboard';
import TripControls from './pages/driver/TripControls';
import SOSAlert from './pages/driver/SOSAlert';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FleetManagement from './pages/admin/FleetManagement';
import Analytics from './pages/admin/Analytics';
import UserManagement from './pages/admin/UserManagement';

import './styles/globals.css';

// ── Route guard ───────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their own dashboard instead of error page
    const role = user?.role;
    if (role === 'driver') return <Navigate to="/driver" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/passenger" replace />;
  }

  return children;
};

// ── Root redirect: send to login or correct dashboard ─────────────────────────
const RootRedirect = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (role === 'driver') return <Navigate to="/driver" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/passenger" replace />;
};

function App() {
  const { logout } = useAuthStore();

  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root → smart redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── Passenger ───────────────────────────────────────────────── */}
          <Route path="/passenger" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <PassengerDashboard onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/passenger/planner" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <RoutePlanner onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/passenger/bookmarks" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <Bookmarks />
            </ProtectedRoute>
          } />

          {/* ── Driver ──────────────────────────────────────────────────── */}
          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboard onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/driver/trip" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <TripControls onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/driver/sos" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <SOSAlert onLogout={logout} />
            </ProtectedRoute>
          } />

          {/* ── Admin ───────────────────────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/admin/fleet" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FleetManagement onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement onLogout={logout} />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
