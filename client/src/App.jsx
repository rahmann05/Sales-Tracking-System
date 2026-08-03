import React, { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { RoutePlanningPage } from './pages/RoutePlanning/RoutePlanningPage';
import { TeamTrackingPage } from './pages/TeamTracking/TeamTrackingPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SalesPage } from './pages/Sales/SalesPage';
import { DeliveryPage } from './pages/Delivery/DeliveryPage';
import { SupervisorPage } from './pages/Supervisor/SupervisorPage';
import { AdminApprovalPage } from './pages/Admin/AdminApprovalPage';
import { OpsManagerPage } from './pages/OpsManager/OpsManagerPage';

function AppContent() {
  const { user, loginAsRole } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('role-workspace');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = ({ email, roleKey }) => {
    if (roleKey) {
      loginAsRole(roleKey);
    }
    setIsAuthenticated(true);
    setActiveTab('role-workspace');
  };

  const handleLogout = () => {
    if (window.confirm(`Apakah Anda yakin ingin keluar dari akun ${user.name} (${user.roleLabel})?`)) {
      setIsAuthenticated(false);
    }
  };

  // Render active view based on activeTab or active user role
  const renderView = () => {
    if (activeTab === 'role-workspace') {
      switch (user?.role) {
        case 'SALES':
          return <SalesPage />;
        case 'DRIVER':
        case 'HELPER':
          return <DeliveryPage />;
        case 'SUPERVISOR':
          return <SupervisorPage />;
        case 'ADMIN':
          return <AdminApprovalPage />;
        case 'OPERATIONAL_MANAGER':
          return <OpsManagerPage />;
        default:
          return <SalesPage />;
      }
    }

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
        {/* Sidebar Navigation (Desktop Rail) */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Header */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
          />

          {/* View Container */}
          <main className="flex-1 relative overflow-y-auto md:overflow-hidden bg-background pb-16 md:pb-0">
            <MobileHeader onLogout={handleLogout} />
            <ErrorBoundary>{renderView()}</ErrorBoundary>
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
