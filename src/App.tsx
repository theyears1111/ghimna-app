// ============================================================
// GHIMNA TROTTA 2.0 — App.tsx
// Router custom (NO react-router) — pattern Soundeckd
// ============================================================

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { RouteState, PageType } from './types';

import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import VerifyEmailPage     from './pages/VerifyEmailPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import DashboardPage       from './pages/DashboardPage';
import CoursesPage         from './pages/CoursesPage';
import CourseDetailPage    from './pages/CourseDetailPage';
import ProfilePage         from './pages/ProfilePage';
import NotificationsPage   from './pages/NotificationsPage';
import AdminPage           from './pages/AdminPage';
import AdminMembersPage    from './pages/AdminMembersPage';
import AdminCoursesPage    from './pages/AdminCoursesPage';
import AdminPresenzePage   from './pages/AdminPresenzePage';
import AdminAvvisiPage     from './pages/AdminAvvisiPage';

// ---- Router interno ----------------------------------------
function AppRouter() {
  const { user, loading, emailVerified } = useAuth();
  const [route, setRoute] = useState<RouteState>({ page: 'DASHBOARD' });

  const navigate = (state: RouteState) => setRoute(state);

  if (loading) return <LoadingScreen />;

  // Non autenticato
  if (!user) {
    if (route.page === 'REGISTER') return <RegisterPage navigate={navigate} />;
    return <LoginPage navigate={navigate} />;
  }

  // Email non verificata
  if (!emailVerified) {
    return <VerifyEmailPage navigate={navigate} />;
  }

  // Telefono mancante
  if (!user.phone) {
    return <CompleteProfilePage />;
  }

  // App completa
  switch (route.page as PageType) {
    case 'DASHBOARD':
      return <DashboardPage navigate={navigate} />;
    case 'COURSES':
      return <CoursesPage navigate={navigate} />;
    case 'COURSE_DETAIL':
      return <CourseDetailPage navigate={navigate} courseId={route.courseId!} />;
    case 'PROFILE':
      return <ProfilePage navigate={navigate} />;
    case 'NOTIFICATIONS':
      return <NotificationsPage navigate={navigate} />;
    case 'ADMIN':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminPage navigate={navigate} />;
    case 'ADMIN_MEMBERS':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminMembersPage navigate={navigate} />;
    case 'ADMIN_COURSES':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminCoursesPage navigate={navigate} />;
    case 'ADMIN_PRESENZE':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminPresenzePage navigate={navigate} />;
    case 'ADMIN_AVVISI':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminAvvisiPage navigate={navigate} />;
    default:
      return <DashboardPage navigate={navigate} />;
  }
}

// ---- Loading screen ----------------------------------------
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
      <span className="text-white/60 text-sm tracking-widest uppercase">Caricamento...</span>
    </div>
  );
}

// ---- Root --------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}