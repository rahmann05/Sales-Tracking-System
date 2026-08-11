import React, { useEffect } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { MapProvider } from './context/MapContext';
import { MapDataProvider } from './context/MapDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LoginPage } from './pages/Login/LoginPage';
import { AppRouter } from './components/AppRouter';
import { useAuth } from './hooks/useAuth';
import { useSearch } from './hooks/useSearch';
import { PersistentMapShell } from './components/map/PersistentMapShell';

/**
 * AppContent Component
 * Single Responsibility: Compose the app shell (layout + routing) for authenticated users.
 *
 * IMPORTANT: activeTab / setActiveTab come ONLY from AppContext so that any component
 * (e.g. RoutePlanningPage) can call useApp().setActiveTab() and the router reacts.
 */
const AppContent = () => {
  // Tab navigation lives in AppContext – do NOT create a second useState here
  const { user, setUserFromAuth, activeTab, setActiveTab } = useApp();
  const { isAuthenticated, authLoading, authError, login, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();

  const goToWorkspace = () => setActiveTab('role-workspace');

  useEffect(() => {
    if (isAuthenticated && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          localStorage.setItem('user_gps_location', JSON.stringify(loc));
          window.dispatchEvent(new CustomEvent('gps_location_updated', { detail: loc }));
        },
        (error) => {
          console.error("GPS Error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [isAuthenticated]);

  const handleLogin = async ({ email, password }) => {
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
    return (
      <ErrorBoundary>
        <LoginPage onLogin={handleLogin} loading={authLoading} error={authError} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex w-screen h-screen overflow-hidden bg-background">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
          />

          <main className="flex-1 relative overflow-y-auto bg-background pb-16 md:pb-8 min-h-0 pointer-events-none">
            <MobileHeader onLogout={handleLogout} />
            <ErrorBoundary>
              <PersistentMapShell />
              <AppRouter
                activeTab={activeTab}
                searchQuery={searchQuery}
                onGoBack={goToWorkspace}
              />
            </ErrorBoundary>
          </main>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

/**
 * App Root Component
 * Single Responsibility: Provide global context and render the app shell.
 */
export default function App() {
  return (
    <AppProvider>
      <MapProvider>
        <MapDataProvider>
          <AppContent />
        </MapDataProvider>
      </MapProvider>
    </AppProvider>
  );
}
