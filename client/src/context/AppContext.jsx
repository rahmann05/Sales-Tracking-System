import React, { createContext, useContext, useState, useEffect } from 'react';
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

import { authApi, pjpApi, ordersApi, absensiApi, outletsApi } from '../services/api';
import { useSalesActions } from '../hooks/useSalesActions';
import { useSupervisorActions } from '../hooks/useSupervisorActions';
import { useOpsActions } from '../hooks/useOpsActions';
import { useAdminActions } from '../hooks/useAdminActions';

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

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // ─── Live Backend Integration Effect ───────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      try {
        // 1. Authenticate with current user email to get active JWT
        if (user?.email) {
          await authApi.login(user.email, 'password123').catch(() => {});
        }

        // 2. If user is Sales, load today's PJP directly from PostgreSQL
        if (user?.role === 'SALES') {
          const res = await pjpApi.getTodayPjp().catch(() => null);
          if (res?.data?.stops && res.data.stops.length > 0 && isMounted) {
            const mappedStops = res.data.stops.map((s, idx) => ({
              id: s.id,
              sequence: s.sequence || idx + 1,
              customerName: s.outlet?.name || `Toko ${idx + 1}`,
              outletName: s.outlet?.name || `Toko ${idx + 1}`,
              owner: s.outlet?.ownerName || s.outlet?.owner || 'Pemilik Toko',
              phone: s.outlet?.phone || '0812-0000-0000',
              address: s.outlet?.address || 'Bandung',
              latitude: Number(s.outlet?.latitude || -6.8722),
              longitude: Number(s.outlet?.longitude || 107.5423),
              radiusMeters: s.outlet?.radiusMeters || 50,
              creditLimit: s.outlet?.creditLimit || 15000000,
              outstanding: s.outlet?.outstanding || 0,
              callplanName: res.data.callplanName || 'RJP-HARI-INI',
              clusterName: res.data.clusterName || 'Klaster Aktif',
              regionName: res.data.regionName || 'Region Cimahi - Bandung Barat',
              dayOfWeek: res.data.dayOfWeek || 'Senin',
              assignedSalesName: user.name,
              customerId: s.outlet?.outletCode || `CUST-00${idx + 1}`,
              outletCode: s.outlet?.outletCode || `CUST-00${idx + 1}`,
              status: s.status === 'VISITED' ? 'VISITED' : s.status === 'SKIPPED' ? 'SKIPPED' : 'PENDING',
            }));
            setSalesStops(mappedStops);
          }
        }

        // 3. Load live Off-PJP attendances from DB
        const offPjpRes = await absensiApi.getOffPjpList().catch(() => null);
        if (offPjpRes?.data?.length > 0 && isMounted) {
          const mappedOffPjp = offPjpRes.data.map((att) => ({
            id: att.id,
            salesId: att.userId,
            salesName: att.user?.name || 'Sales Field',
            outletName: att.outletName,
            customerName: att.customerName || att.outletName,
            phone: att.phone || '-',
            address: att.address,
            reason: att.reason,
            photoUrl: att.photoUrl,
            gpsLocation: { lat: att.latitude, lng: att.longitude },
            time: new Date(att.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: new Date(att.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
            validationStatus: att.status === 'APPROVED' ? 'TERVALIDASI' : att.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU',
          }));
          setOffPjpAttendances(mappedOffPjp);
        }

        // 4. Load live orders from DB
        const ordersRes = await ordersApi.getAllOrders().catch(() => null);
        if (ordersRes?.data && isMounted) {
          const rawOrders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.items || [];
          if (rawOrders.length > 0) {
            const mappedOrders = rawOrders.map((o) => ({
              id: o.id,
              dailyStopId: o.pjpStopId,
              outletName: o.pjpStop?.outlet?.name || 'Toko',
              salesName: o.createdByUser?.name || 'Sales Rep',
              createdAt: new Date(o.createdAt).toISOString().replace('T', ' ').substring(0, 16),
              items: o.items || [],
              totalAmount: o.totalValue,
              paymentType: o.paymentType || 'CASH',
              status: o.status,
            }));
            setOrders(mappedOrders);
          }
        }
      } catch (err) {
        console.warn('[AppContext] Sync with backend notice:', err.message);
      }
    };

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
        timestamp: 'Baru saja',
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
    salesStops,
    setSalesStops,
    incidents,
    setIncidents,
    addNotification,
  });

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    // Current User Session
    user,
    setUser,
    loginAsRole,

    // Shift Clock-In State
    shiftAttendance,
    handleShiftClockIn,
    handleShiftClockOut,

    // Core Domain State
    salesStops,
    setSalesStops,
    supervisorTeams,
    setSupervisorTeams,
    teamMembers,
    setTeamMembers,
    activeRoutes,
    setActiveRoutes,
    masterRoutes,
    setMasterRoutes,
    salesList,
    setSalesList,
    rjpTeams,
    setRjpTeams,
    offPjpAttendances,
    setOffPjpAttendances,
    orders,
    setOrders,
    incidents,
    setIncidents,
    products: MOCK_PRODUCTS,

    // Notifications
    notifications,
    addNotification,
    markNotificationAsRead,
    clearNotifications,

    // Dedicated Domain Actions
    ...salesActions,
    ...supervisorActions,
    ...opsActions,
    ...adminActions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
