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

  // Render active view based on activeTab or active user role with strict Role Access Control
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

    // Role Access Control Checks
    if (activeTab === 'route-planning' && !['SALES', 'SUPERVISOR', 'OPERATIONAL_MANAGER'].includes(user?.role)) {
      return (
        <div className="p-8 text-center bg-surface border border-red-500/30 rounded-3xl m-6 space-y-3">
          <h3 className="text-lg font-bold text-red-600">Akses Dibatasi (Access Denied)</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Halaman <strong>Jadwal Master RJP</strong> hanya dapat diakses oleh Sales Field, Supervisor, dan Manajer Operasional.
          </p>
          <button
            onClick={() => setActiveTab('role-workspace')}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-xs shadow-md"
          >
            Kembali ke Workspace Saya
          </button>
        </div>
      );
    }

    if (activeTab === 'team-tracking' && !['SALES', 'SUPERVISOR', 'OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role)) {
      return (
        <div className="p-8 text-center bg-surface border border-red-500/30 rounded-3xl m-6 space-y-3">
          <h3 className="text-lg font-bold text-red-600">Akses Dibatasi (Access Denied)</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Halaman Tim dan RJP hanya dapat diakses oleh pengguna terdaftar.
          </p>
          <button
            onClick={() => setActiveTab('role-workspace')}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-xs shadow-md"
          >
            Kembali ke Workspace Saya
          </button>
        </div>
      );
    }

    if (activeTab === 'reports' && !['SUPERVISOR', 'OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role)) {
      return (
        <div className="p-8 text-center bg-surface border border-red-500/30 rounded-3xl m-6 space-y-3">
          <h3 className="text-lg font-bold text-red-600">Akses Dibatasi (Access Denied)</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Fitur Laporan hanya dapat diakses oleh Supervisor, Manajer Operasional, atau Admin Penjualan.
          </p>
          <button
            onClick={() => setActiveTab('role-workspace')}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-xs shadow-md"
          >
            Kembali ke Workspace Saya
          </button>
        </div>
      );
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

          {/* View Container (Scrollable on both Mobile and Desktop) */}
          <main className="flex-1 relative overflow-y-auto bg-background pb-16 md:pb-8 min-h-0">
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
