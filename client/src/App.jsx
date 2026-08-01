import React, { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { RoutePlanningPage } from './pages/RoutePlanning/RoutePlanningPage';
import { TeamTrackingPage } from './pages/TeamTracking/TeamTrackingPage';
import { ReportsPage } from './pages/Reports/ReportsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      setIsAuthenticated(false);
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage searchQuery={searchQuery} />;
      case 'route-planning':
        return <RoutePlanningPage searchQuery={searchQuery} />;
      case 'team-tracking':
        return <TeamTrackingPage searchQuery={searchQuery} />;
      case 'reports':
        return <ReportsPage searchQuery={searchQuery} />;
      default:
        return <DashboardPage searchQuery={searchQuery} />;
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
        {/* Sidebar Navigation Component (Desktop Rail Only - Hidden on Mobile) */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Header Component (Desktop Only Top Bar - Hidden on Mobile) */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
          />

          {/* View Container (Scrollable area for mobile content) */}
          <main className="flex-1 relative overflow-y-auto md:overflow-hidden bg-background pb-16 md:pb-0">
            {/* Mobile Top Header Title Bar (Inside scroll container so it scrolls naturally with page) */}
            <MobileHeader onLogout={handleLogout} />

            <ErrorBoundary>{renderView()}</ErrorBoundary>
          </main>

          {/* Bottom Navigation Bar (Mobile Only - Hidden on Desktop) */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
