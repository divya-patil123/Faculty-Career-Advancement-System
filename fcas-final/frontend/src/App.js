import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ProfilePage from './pages/faculty/ProfilePage';
import EligibilityPage from './pages/faculty/EligibilityPage';
import ApplyPage from './pages/faculty/ApplyPage';
import MyApplications from './pages/faculty/MyApplications';
import DocumentsPage from './pages/faculty/DocumentsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApplications from './pages/admin/AdminApplications';
import AdminApplicationDetail from './pages/admin/AdminApplicationDetail';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminManage from './pages/admin/AdminManage';
import AdminCriteria from './pages/admin/AdminCriteria';

// Route guard component
const Protected = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  const home = !user ? '/login' : isAdmin() ? '/admin' : '/dashboard';

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={home} replace />} />

      {/* Public auth pages */}
      <Route path="/login"    element={!user ? <Login />    : <Navigate to={home} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={home} replace />} />

      {/* ── Faculty Routes ─────────────────────────────────────────────────── */}
      <Route path="/dashboard"
        element={<Protected><FacultyDashboard /></Protected>} />
      <Route path="/profile"
        element={<Protected><ProfilePage /></Protected>} />
      <Route path="/eligibility"
        element={<Protected><EligibilityPage /></Protected>} />
      <Route path="/apply"
        element={<Protected><ApplyPage /></Protected>} />
      <Route path="/my-applications"
        element={<Protected><MyApplications /></Protected>} />
      <Route path="/documents"
        element={<Protected><DocumentsPage /></Protected>} />

      {/* ── Admin Routes ───────────────────────────────────────────────────── */}
      <Route path="/admin"
        element={<Protected adminOnly><AdminDashboard /></Protected>} />
      <Route path="/admin/applications"
        element={<Protected adminOnly><AdminApplications /></Protected>} />
      <Route path="/admin/applications/:id"
        element={<Protected adminOnly><AdminApplicationDetail /></Protected>} />
      <Route path="/admin/faculty"
        element={<Protected adminOnly><AdminFaculty /></Protected>} />
      <Route path="/admin/manage"
        element={<Protected adminOnly><AdminManage /></Protected>} />
      <Route path="/admin/criteria"
        element={<Protected adminOnly><AdminCriteria /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
