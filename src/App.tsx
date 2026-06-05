// ============================================================
// GHIMNA TROTTA 2.0 — App.tsx
// Router custom con History API per tasto indietro Android
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
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
import AdminImpostazioniPage from './pages/AdminImpostazioniPage';
import AdminStatistichePage from './pages/AdminStatistichePage';

// ---- Router interno ----------------------------------------
function AppRouter() {
  const { user, loading, emailVerified } = useAuth();
  const [route, setRoute] = useState<RouteState>({ page: 'DASHBOARD' });

  // Naviga pushando nella history del browser
  const navigate = useCallback((state: RouteState) => {
    // Non pushare DASHBOARD nella history (è la root)
    if (state.page !== 'DASHBOARD') {
      window.history.pushState(state, '', `#${state.page.toLowerCase()}`);
    } else {
      window.history.pushState(state, '', window.location.pathname);
    }
    setRoute(state);
  }, []);

  // Intercetta il tasto indietro del browser/Android
  useEffect(() => {
    // Stato iniziale nella history
    window.history.replaceState({ page: 'DASHBOARD' }, '', window.location.pathname);

    function handlePopState(event: PopStateEvent) {
      if (event.state && event.state.page) {
        setRoute(event.state as RouteState);
      } else {
        setRoute({ page: 'DASHBOARD' });
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    case 'ADMIN_STATISTICHE':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminStatistichePage navigate={navigate} />;
    case 'ADMIN_IMPOSTAZIONI':
      if (user.role !== 'admin') return <DashboardPage navigate={navigate} />;
      return <AdminImpostazioniPage navigate={navigate} />;
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