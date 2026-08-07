import React from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LoginPage } from './pages/Login/LoginPage';
import { AppRouter } from './components/AppRouter';
import { useAuth } from './hooks/useAuth';
import { useTabNavigation } from './hooks/useTabNavigation';
import { useSearch } from './hooks/useSearch';

/**
 * AppContent Component
 * Single Responsibility: Compose the app shell (layout + routing) for authenticated users.
 */
const AppContent = () => {
  const { user, loginAsRole } = useApp();
  const { isAuthenticated, login, logout } = useAuth();
  const { activeTab, setActiveTab, goToWorkspace } = useTabNavigation();
  const { searchQuery, setSearchQuery } = useSearch();

  const handleLogin = ({ roleKey }) => {
    if (roleKey) {
      loginAsRole(roleKey);
    }
    login();
    goToWorkspace();
  };

  const handleLogout = () => {
    if (window.confirm(`Apakah Anda yakin ingin keluar dari akun ${user.name} (${user.roleLabel})?`)) {
      logout();
    }
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={handleLogin} />
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

          <main className="flex-1 relative overflow-y-auto bg-background pb-16 md:pb-8 min-h-0">
            <MobileHeader onLogout={handleLogout} />
            <ErrorBoundary>
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
      <AppContent />
    </AppProvider>
  );
}
