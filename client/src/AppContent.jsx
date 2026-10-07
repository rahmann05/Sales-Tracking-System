import { ConnectivityNotice } from './shared/components/layout/ConnectivityNotice';
import React from 'react';
import { ErrorBoundary } from './shared/components/common/ErrorBoundary';
import { useApp } from './context/AppContext';
import { Sidebar } from './shared/components/layout/Sidebar';
import { Header } from './shared/components/layout/Header';
import { MobileHeader } from './shared/components/layout/MobileHeader';
import { BottomNav } from './shared/components/layout/BottomNav';
import { LoginPage } from './pages/Login/LoginPage';
import { AppRouter } from './app/AppRouter';
import { useAuth } from './shared/hooks/useAuth';
import { PersistentMapShell } from './shared/components/map/PersistentMapShell';

/**
 * AppContent Component
 * Single Responsibility: Compose the app shell (layout + routing) for authenticated users.
 *
 * IMPORTANT: activeTab / setActiveTab come ONLY from AppContext so that any component
 * (e.g. RoutePlanningPage) can call useApp().setActiveTab() and the router reacts.
 */
export
/**
 * AppContent Component
 * Single Responsibility: Compose the app shell (layout + routing) for authenticated users.
 *
 * IMPORTANT: activeTab / setActiveTab come ONLY from AppContext so that any component
 * (e.g. RoutePlanningPage) can call useApp().setActiveTab() and the router reacts.
 */
const AppContent = () => {
  // Tab navigation lives in AppContext – do NOT create a second useState here
  const {
    user,
    setUserFromAuth,
    activeTab,
    setActiveTab
  } = useApp();
  const {
    isAuthenticated,
    authLoading,
    authError,
    login,
    logout
  } = useAuth();
  const goToWorkspace = () => setActiveTab('role-workspace');
  const handleLogin = async ({
    email,
    password
  }) => {
    const ok = await login(email, password);
    if (ok) {
      setUserFromAuth();
      goToWorkspace();
    }
  };
  const handleLogout = () => {
    if (window.confirm(`Apakah Anda yakin ingin keluar dari akun ${user?.name || 'ini'}?`)) {
      logout();
    }
  };
  if (!isAuthenticated) {
    return <ErrorBoundary>
        <LoginPage onLogin={handleLogin} loading={authLoading} error={authError} />
      </ErrorBoundary>;
  }
  const isAdmin = user?.role === 'ADMIN';
  return <ErrorBoundary>
      <div className="app-shell flex overflow-hidden bg-background">
        <a className="skip-link" href="#main-content" onClick={e => {
        e.preventDefault();
        document.getElementById('main-content')?.focus();
      }}>Ke konten utama</a>
        {!isAdmin && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header onLogout={handleLogout} />
          <MobileHeader onLogout={handleLogout} />

          <ConnectivityNotice />
          <main id="main-content" tabIndex={-1} className={`flex-1 relative overflow-y-auto bg-background pb-16 md:pb-8 min-h-0 pointer-events-none`}>
            <ErrorBoundary>
              <PersistentMapShell />
              <AppRouter activeTab={activeTab} onGoBack={goToWorkspace} />
            </ErrorBoundary>
          </main>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </ErrorBoundary>;
};

/**
 * App Root Component
 * Single Responsibility: Provide global context and render the app shell.
 */
