import React, { createContext, useContext, useState } from 'react';
import {
  DEMO_USERS,
  INITIAL_SALES_STOPS,
  INITIAL_SUPERVISOR_TEAMS,
  INITIAL_SALES_LIST,
  INITIAL_RJP_TEAMS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_ACTIVE_ROUTES,
  INITIAL_MASTER_ROUTES,
  INITIAL_OFF_PJP_ATTENDANCES,
  MOCK_PRODUCTS,
} from '../data';

import { useSalesActions } from '../hooks/useSalesActions';
import { useSupervisorActions } from '../hooks/useSupervisorActions';
import { useOpsActions } from '../hooks/useOpsActions';
import { useAdminActions } from '../hooks/useAdminActions';
import { useDeliveryActions } from '../hooks/useDeliveryActions';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(DEMO_USERS.SALES);

  // Shift Attendance State
  const [shiftAttendance, setShiftAttendance] = useState({
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    photoUrl: null,
  });

  // Sales Daily PJP Stops
  const [salesStops, setSalesStops] = useState(INITIAL_SALES_STOPS);

  // Supervisor Teams List
  const [supervisorTeams, setSupervisorTeams] = useState(INITIAL_SUPERVISOR_TEAMS);

  // Field Team Members List
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM_MEMBERS);

  // Dashboard Active Routes List
  const [activeRoutes, setActiveRoutes] = useState(INITIAL_ACTIVE_ROUTES);

  // Master PJP Routes List (Route Planning)
  const [masterRoutes, setMasterRoutes] = useState(INITIAL_MASTER_ROUTES);

  // Detailed Sales Reps List
  const [salesList, setSalesList] = useState(INITIAL_SALES_LIST);

  // Tim RJP / Tim Kunjungan List
  const [rjpTeams, setRjpTeams] = useState(INITIAL_RJP_TEAMS);

  // Off-PJP Store Absen Records
  const [offPjpAttendances, setOffPjpAttendances] = useState(INITIAL_OFF_PJP_ATTENDANCES);

  // Sales Orders List
  const [orders, setOrders] = useState([]);

  // Store incidents (closed shop reports, unlock requests, etc.)
  const [incidents, setIncidents] = useState([]);

  // Delivery Stops
  const [deliveryStops, setDeliveryStops] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Auth & Shift Actions
  const loginAsRole = (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setUser(DEMO_USERS[roleKey]);
    }
  };

  const handleShiftClockIn = (photoUrl) => {
    setShiftAttendance({
      clockedIn: true,
      clockInTime: new Date().toLocaleTimeString(),
      clockOutTime: null,
      photoUrl,
    });
  };

  const handleShiftClockOut = () => {
    setShiftAttendance((prev) => ({
      ...prev,
      clockedIn: false,
      clockOutTime: new Date().toLocaleTimeString(),
    }));
  };

  // Helper Add Notification
  const addNotification = ({ title, message, roleTarget }) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title,
        message,
        timestamp: 'Just now',
        read: false,
        roleTarget,
      },
      ...prev,
    ]);
  };

  // Extract all business logic into dedicated hooks (Single Responsibility)
  const salesActions = useSalesActions({
    user,
    salesStops,
    setSalesStops,
    setOrders,
    setOffPjpAttendances,
    setIncidents,
    addNotification,
  });

  const supervisorActions = useSupervisorActions({
    user,
    incidents,
    setIncidents,
    salesStops,
    setSalesStops,
    deliveryStops,
    setDeliveryStops,
    setOffPjpAttendances,
    addNotification,
  });

  const opsActions = useOpsActions({
    user,
    rjpTeams,
    setRjpTeams,
    masterRoutes,
    setMasterRoutes,
    incidents,
    setIncidents,
    salesStops,
    setSalesStops,
    addNotification,
  });

  const adminActions = useAdminActions({
    orders,
    setOrders,
    deliveryStops,
    setDeliveryStops,
    salesStops,
    setSalesStops,
    incidents,
    setIncidents,
    addNotification,
  });

  const deliveryActions = useDeliveryActions({
    user,
    deliveryStops,
    setDeliveryStops,
    setIncidents,
    addNotification,
  });

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loginAsRole,
        shiftAttendance,
        handleShiftClockIn,
        handleShiftClockOut,
        salesStops,
        supervisorTeams,
        teamMembers,
        activeRoutes,
        masterRoutes,
        salesList,
        rjpTeams,
        offPjpAttendances,
        orders,
        incidents,
        deliveryStops,
        notifications,
        addNotification,
        ...salesActions,
        ...supervisorActions,
        ...opsActions,
        ...adminActions,
        ...deliveryActions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
