import './styles/pages/LogisticsWorkspace.css';
import {managedRoles} from './constants/roleNavigation';
import {RoleMobileMenu} from './shared/components/layout/RoleMobileMenu';
import './styles/pages/SupervisorWorkspace.css';
import {WorkspaceModuleNav} from './shared/components/layout/WorkspaceModuleNav';
import {SalesMobileMenu} from './pages/Sales/components/SalesMobileMenu';
import './styles/pages/SalesWorkspace.css';
import {SupervisorMobileMenu} from './pages/Supervisor/components/SupervisorMobileMenu';
import './styles/pages/AdminWorkspace.css';
import './styles/pages/AdminApplication.css';
import { ConnectivityNotice } from './shared/components/layout/ConnectivityNotice';
import React, {useEffect,useRef} from 'react';
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
  const mainRef=useRef(null);
  useEffect(()=>{if(managedRoles.includes(user?.role)&&mainRef.current)mainRef.current.scrollTop=0;},[activeTab,user?.role]);
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
      if(window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))logout();
    }
  };
  if (!isAuthenticated) {
    return <ErrorBoundary>
        <LoginPage onLogin={handleLogin} loading={authLoading} error={authError} />
      </ErrorBoundary>;
  }
  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor=user?.role==='SUPERVISOR';
  const isSales=user?.role==='SALES';
  const isManaged=managedRoles.includes(user?.role);
  const logisticsClass=user?.role==='KEPALA_GUDANG'?'warehouse-ui':user?.role==='SUPIR'?'driver-ui':'';
  return <ErrorBoundary>
      <div className={`app-shell flex overflow-hidden bg-background ${isAdmin ? 'admin-ui' : isSupervisor ? 'supervisor-ui' : isSales ? 'sales-ui' : logisticsClass}`}>
        <a className="skip-link" href="#main-content" onClick={e => {
        e.preventDefault();
        document.getElementById('main-content')?.focus();
      }}>Ke konten utama</a>
        {(!isManaged||activeTab!=='role-workspace')&&<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header onLogout={handleLogout} />
          <MobileHeader onLogout={handleLogout} />

          <ConnectivityNotice />
          {isManaged&&<WorkspaceModuleNav/>}
          <main ref={mainRef} id="main-content" tabIndex={-1} className={`flex-1 relative overflow-y-auto bg-background pb-16 md:pb-8 min-h-0 pointer-events-none`}>
            <ErrorBoundary>
              <PersistentMapShell />
            </ErrorBoundary>
            <ErrorBoundary key={activeTab}>
              <AppRouter activeTab={activeTab} onGoBack={goToWorkspace} />
            </ErrorBoundary>
          </main>

          {(!isManaged||activeTab!=='role-workspace')&&(isSupervisor?<SupervisorMobileMenu/>:isSales?<SalesMobileMenu/>:logisticsClass?<RoleMobileMenu/>:<BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />)}
        </div>
      </div>
    </ErrorBoundary>;
};

/**
 * App Root Component
 * Single Responsibility: Provide global context and render the app shell.
 */
