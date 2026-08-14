import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken } from '../services/api';

import { authApi, pjpApi, ordersApi, absensiApi, outletsApi, clustersApi } from '../services/api';
import { useSalesActions } from '../hooks/useSalesActions';
import { useSupervisorActions } from '../hooks/useSupervisorActions';
import { useOpsActions } from '../hooks/useOpsActions';
import { useAdminActions } from '../hooks/useAdminActions';

const AppContext = createContext();

const ROLE_LABELS = {
  SALES: 'Sales',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Admin',
  MANAJER_OPERASIONAL: 'Manajer Operasional',
};

export const AppProvider = ({ children }) => {
  // User murni dari auth backend (PostgreSQL) via localStorage 'authUser'
  const [user, setUser] = useState(() => authApi.getStoredUser());

  // Set user dari hasil login backend (dipanggil setelah login sukses)
  const setUserFromAuth = () => {
    const u = authApi.getStoredUser();
    if (u) setUser({ ...u, roleLabel: ROLE_LABELS[u.role] || u.role });
  };

  // Shift Attendance State
  const [shiftAttendance, setShiftAttendance] = useState({
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    photoUrl: null,
  });

  // Sales Daily PJP Stops (diisi dari PostgreSQL saat login)
  const [salesStops, setSalesStops] = useState([]);

  // Supervisor Teams List (dari PostgreSQL)
  const [supervisorTeams, setSupervisorTeams] = useState([]);

  // Field Team Members List (dari PostgreSQL)
  const [teamMembers, setTeamMembers] = useState([]);

  // Dashboard Active Routes List (diisi dari PostgreSQL)
  const [activeRoutes, setActiveRoutes] = useState([]);

  // Master PJP Routes List (Route Planning) — diisi dari PostgreSQL
  const [masterRoutes, setMasterRoutes] = useState([]);

  // Detailed Sales Reps List (dari PostgreSQL)
  const [salesList, setSalesList] = useState([]);

  // Tim RJP / Tim Kunjungan List (dari PostgreSQL)
  const [rjpTeams, setRjpTeams] = useState([]);

  // Off-PJP Store Absen Records (diisi dari PostgreSQL)
  const [offPjpAttendances, setOffPjpAttendances] = useState([]);

  // Sales Orders List
  const [orders, setOrders] = useState([]);

  // Store incidents (closed shop reports, unlock requests, etc.)
  const [incidents, setIncidents] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Live GPS Location
  const [currentLocation, setCurrentLocation] = useState(null);

  // Global Tab Navigation State
  const [activeTab, setActiveTab] = useState('role-workspace');

  // ─── Live Geolocation Tracking ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setCurrentLocation(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        console.warn('[AppContext] Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // ─── Live Backend Integration Effect ───────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      try {
        // Hanya sinkron jika ada sesi login valid (token dari auth backend)
        if (!getAuthToken() || !user?.email) return;

        // 2. If user is Sales, load today's PJP directly from PostgreSQL
        if (user?.role === 'SALES') {
          const res = await pjpApi.getTodayPjp().catch(() => null);
          if (res?.data?.stops && res.data.stops.length > 0 && isMounted) {
            const mappedStops = res.data.stops.map((s, idx) => ({
              id: s.id,
              sequence: s.sequence || idx + 1,
              customerName: s.outlet?.name || '',
              outletName: s.outlet?.name || '',
              owner: s.outlet?.ownerName || s.outlet?.owner || '',
              phone: s.outlet?.phone || '',
              address: s.outlet?.address || '',
              latitude: Number(s.outlet?.latitude) || null,
              longitude: Number(s.outlet?.longitude) || null,
              radiusMeters: s.outlet?.radiusMeters || 0,
              outstanding: s.outlet?.outstanding || 0,
              callplanName: res.data.callplanName || '',
              clusterName: res.data.clusterName || '',
              regionName: res.data.regionName || '',
              dayOfWeek: res.data.dayOfWeek || '',
              assignedSalesName: user?.name || '',
              customerId: s.outlet?.outletCode || '',
              outletCode: s.outlet?.outletCode || '',
              status: s.status === 'VISITED' ? 'VISITED' : s.status === 'SKIPPED' ? 'SKIPPED' : 'PENDING',
            }));
            setSalesStops(mappedStops);
          }
        }

        // 2b. Supervisor/Manager: bangun activeRoutes dari PJP hari ini (PostgreSQL)
        const allowedRoles = ['SUPERVISOR', 'MANAJER_OPERASIONAL', 'ADMIN'];
        if (allowedRoles.includes(user?.role)) {
          const res = await pjpApi.getAllPjps().catch(() => null);
          const pjps = Array.isArray(res?.data) ? res.data : [];
          if (pjps.length > 0 && isMounted) {
            const todayStr = new Date().toDateString();
            const todays = pjps.filter((p) => new Date(p.date).toDateString() === todayStr);
            const routes = todays.map((p) => {
              const stops = (p.stops || []).map((s, idx) => ({
                id: s.id,
                sequence: s.sequence || idx + 1,
                outletName: s.outlet?.name || '',
                customerName: s.outlet?.name || '',
                type: s.outlet?.type || 'MODERN_TRADE',
                owner: s.outlet?.ownerName || s.outlet?.owner || '',
                phone: s.outlet?.phone || '',
                address: s.outlet?.address || '',
                latitude: Number(s.outlet?.latitude) || null,
                longitude: Number(s.outlet?.longitude) || null,
                callplanName: p.name || '',
                clusterName: p.cluster?.name || '',
                regionName: p.cluster?.region || '',
                dayOfWeek: p.dayOfWeek || '',
                assignedSalesName: p.user?.name || '',
                customerId: s.outlet?.outletCode || '',
                outletCode: s.outlet?.outletCode || '',
                status: s.status === 'VISITED' ? 'VISITED' : s.status === 'SKIPPED' ? 'SKIPPED' : 'PENDING',
              }));
              const done = stops.filter((s) => s.status === 'VISITED').length;
              return {
                id: p.id,
                salesId: p.userId,
                name: p.user?.name || '',
                avatar: null,
                region: p.cluster?.name || '',
                status: done === stops.length && stops.length > 0 ? 'Completed' : 'In Transit',
                progress: stops.length ? Math.round((done / stops.length) * 100) : 0,
                stops,
                distance: '',
                vehicle: '',
              };
            });
            setActiveRoutes(routes);
          }
        }

        // 3. Load live Off-PJP attendances from DB
        const offPjpRes = await absensiApi.getOffPjpList().catch(() => null);
        if (offPjpRes?.data?.length > 0 && isMounted) {
          const mappedOffPjp = offPjpRes.data.map((att) => ({
            id: att.id,
            salesId: att.userId,
            salesName: att.user?.name || '',
            outletName: att.outletName || '',
            customerName: att.customerName || att.outletName || '',
            phone: att.phone || '',
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
              outletName: o.pjpStop?.outlet?.name || '',
              salesName: o.createdByUser?.name || '',
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
  // loginAsRole dihapus — user kini murni dari auth backend (PostgreSQL)

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
    setOffPjpAttendances,
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
    setUserFromAuth,
    currentLocation,

    // Global Tab Navigation
    activeTab,
    setActiveTab,

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
    products: [],

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
