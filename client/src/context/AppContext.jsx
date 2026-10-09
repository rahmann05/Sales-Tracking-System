import { useBrowserNavigation } from './hooks/useBrowserNavigation';
import { useOperationalSettings } from './hooks/useOperationalSettings';
import React, { createContext, useContext, useMemo } from 'react';

import { useSalesActions } from '../pages/Sales/hooks/useSalesActions';
import { useSupervisorActions } from '../pages/Supervisor/hooks/useSupervisorActions';
import { useAdminActions } from '../pages/Admin/hooks/useAdminActions';
import { useDomainState } from './hooks/useDomainState';
import { useAuthSession } from './hooks/useAuthSession';
import { useLiveGeolocation } from './hooks/useLiveGeolocation';
import { useDriverTracking } from './hooks/useDriverTracking';
import { useMasterData } from './hooks/useMasterData';
import { useShiftAttendance } from './hooks/useShiftAttendance';
import { useNotifications } from './hooks/useNotifications';
import { useBackendSync } from './hooks/useBackendSync';

const AppContext = createContext();

/**
 * AppProvider - Composition root for global application state.
 * Single Responsibility of this file: COMPOSE focused domain hooks
 * (each living in ./hooks/) into a single context value.
 * No business logic lives here.
 */
export const AppProvider = ({ children }) => {
  // 1. Core domain state slices + reset
  const domain = useDomainState();

  // 2. Auth session (resets domain state on logout/expiry)
  const { user:sessionUser, setUser, setUserFromAuth, sessionLoading, sessionError } = useAuthSession(domain.resetDomainState);

  const { settings, settingsReady, refreshSettings } = useOperationalSettings(sessionUser);

  const user=useMemo(()=>sessionUser?{...sessionUser,settings}:null,[sessionUser,settings]);
  // 3. Live GPS tracking while logged in


  // 4. Global Tab Navigation State
  const [activeTab, setActiveTab] = useBrowserNavigation(user,sessionLoading);

  // 5. Master data (clusters & divisions) + fetchers
  const { clusters, setClusters, fetchClusters, divisions, setDivisions, fetchDivisions } = useMasterData();

  // 6. Shift attendance slice
  const { shiftAttendance, handleShiftClockIn, handleShiftClockOut, shiftBusy, shiftError } = useShiftAttendance(user);

  const activeSalesVisit=domain.salesStops.some(stop=>['ARRIVED','ORDERED','IN_VISIT'].includes(stop.status));
  const currentLocation=useLiveGeolocation(settingsReady?user:null,settings,shiftAttendance.clockedIn,activeSalesVisit);
  const driverTracking=useDriverTracking(settingsReady?user:null,settings);

  // 7. Notification center slice
  const notificationState = useNotifications(user);
  const { notifications, addNotification, markNotificationAsRead, clearNotifications } = notificationState;

  // 8. Backend hydration effect (runs once per user session)
  const syncStatus = useBackendSync({
    user,
    fetchClusters,
    fetchDivisions,
    setSalesList: domain.setSalesList,
    setSalesStops: domain.setSalesStops,
    setActiveRoutes: domain.setActiveRoutes,
    setOffPjpAttendances: domain.setOffPjpAttendances,
    setOrders: domain.setOrders,
    setIncidents: domain.setIncidents,
    setProducts: domain.setProducts,
  });

  // 9. Dedicated domain action hooks (Single Responsibility per role)
  const salesActions = useSalesActions({
    user,
    salesStops: domain.salesStops,
    setSalesStops: domain.setSalesStops,
    setOrders: domain.setOrders,
    setOffPjpAttendances: domain.setOffPjpAttendances,
    setIncidents: domain.setIncidents,
    addNotification,
  });

  const supervisorActions = useSupervisorActions({
    user,
    incidents: domain.incidents,
    setIncidents: domain.setIncidents,
    salesStops: domain.salesStops,
    setSalesStops: domain.setSalesStops,
    setOffPjpAttendances: domain.setOffPjpAttendances,
    addNotification,
  });

  const adminActions = useAdminActions({
    orders: domain.orders,
    setOrders: domain.setOrders,
    salesStops: domain.salesStops,
    setSalesStops: domain.setSalesStops,
    incidents: domain.incidents,
    setIncidents: domain.setIncidents,
    addNotification,
  });

  const value = useMemo(() => ({
    driverTracking, syncStatus, ...notificationState,
    settings, settingsReady, refreshSettings, sessionLoading, sessionError,
    // Current User Session
    user,
    setUser,
    setUserFromAuth,
    currentLocation,

    // Global Tab Navigation
    activeTab,
    setActiveTab,

    shiftBusy, shiftError,
    // Shift Clock-In State
    shiftAttendance,
    handleShiftClockIn,
    handleShiftClockOut,

    // Core Domain State
    salesStops: domain.salesStops,
    setSalesStops: domain.setSalesStops,
    teamMembers: domain.teamMembers,
    setTeamMembers: domain.setTeamMembers,
    activeRoutes: domain.activeRoutes,
    setActiveRoutes: domain.setActiveRoutes,
    masterRoutes: domain.masterRoutes,
    setMasterRoutes: domain.setMasterRoutes,
    salesList: domain.salesList,
    setSalesList: domain.setSalesList,
    offPjpAttendances: domain.offPjpAttendances,
    setOffPjpAttendances: domain.setOffPjpAttendances,
    orders: domain.orders,
    setOrders: domain.setOrders,
    incidents: domain.incidents,
    setIncidents: domain.setIncidents,
    products: domain.products,
    setProducts: domain.setProducts,

    // Master Kluster Dinamis (Single Source of Truth)
    clusters,
    setClusters,
    fetchClusters,

    // Master Divisi Dinamis (Single Source of Truth)
    divisions,
    setDivisions,
    fetchDivisions,

    // Notifications
    notifications,
    addNotification,
    markNotificationAsRead,
    clearNotifications,

    // Dedicated Domain Actions
    ...salesActions,
    ...supervisorActions,
    ...adminActions,
  }), [
    syncStatus, notificationState, settings, settingsReady, refreshSettings, sessionLoading, sessionError,
    user,
    setUser,
    setUserFromAuth,
    currentLocation,
    activeTab,
    shiftAttendance,
    shiftBusy, shiftError,
    handleShiftClockIn,
    handleShiftClockOut,
    domain.salesStops,
    domain.setSalesStops,
    domain.teamMembers,
    domain.setTeamMembers,
    domain.activeRoutes,
    domain.setActiveRoutes,
    domain.masterRoutes,
    domain.setMasterRoutes,
    domain.salesList,
    domain.setSalesList,
    domain.offPjpAttendances,
    domain.setOffPjpAttendances,
    domain.orders,
    domain.setOrders,
    domain.incidents,
    domain.setIncidents,
    domain.products,
    domain.setProducts,
    clusters,
    setClusters,
    fetchClusters,
    divisions,
    setDivisions,
    fetchDivisions,
    notifications,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    salesActions,
    supervisorActions,
    adminActions,
    sessionLoading, sessionError, driverTracking,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
