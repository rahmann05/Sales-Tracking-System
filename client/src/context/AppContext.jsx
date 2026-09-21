import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken } from '../services/api';

import { authApi, pjpApi, ordersApi, productsApi, absensiApi, outletsApi, clustersApi, usersApi, divisionsApi } from '../services/api';
import { useSalesActions } from '../hooks/useSalesActions';
import { useSupervisorActions } from '../hooks/useSupervisorActions';
import { useAdminActions } from '../hooks/useAdminActions';

const AppContext = createContext();

const ROLE_LABELS = {
  SALES: 'Sales',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Admin',
  KEPALA_GUDANG: 'Kepala Gudang',
  SUPIR: 'Supir',
};

export const AppProvider = ({ children }) => {
  // User murni dari auth backend (PostgreSQL) via localStorage 'authUser'
  const [user, setUser] = useState(() => authApi.getStoredUser());

  // Set user dari hasil login backend (dipanggil setelah login sukses)
  const setUserFromAuth = () => {
    const u = authApi.getStoredUser();
    if (u) setUser({ ...u, roleLabel: ROLE_LABELS[u.role] || u.role });
  };

  // Reset state saat token kadaluwarsa atau logout
  useEffect(() => {
    const handleAuthReset = () => {
      setUser(null);
      setSalesStops([]);
      setOrders([]);
      setProducts([]);
      setActiveRoutes([]);
      setSupervisorTeams([]);
      setTeamMembers([]);
    };
    window.addEventListener('auth:expired', handleAuthReset);
    window.addEventListener('auth:logout', handleAuthReset);
    return () => {
      window.removeEventListener('auth:expired', handleAuthReset);
      window.removeEventListener('auth:logout', handleAuthReset);
    };
  }, []);

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

  // Master Products List
  const [products, setProducts] = useState([]);

  // Store incidents (closed shop reports, unlock requests, etc.)
  const [incidents, setIncidents] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Master Kluster Dinamis (Single Source of Truth yang Didefinisikan Supervisor)
  const [clusters, setClusters] = useState([]);

  const fetchClusters = async () => {
    try {
      if (!getAuthToken()) return [];
      const res = await clustersApi.getAll();
      const list = Array.isArray(res) ? res : res?.data || [];
      setClusters(list);
      return list;
    } catch (err) {
      console.warn('[AppContext] Failed to fetch clusters:', err.message);
      return [];
    }
  };

  // Master Divisi Dinamis (Single Source of Truth dari Admin)
  const [divisions, setDivisions] = useState([]);

  const fetchDivisions = async () => {
    try {
      if (!getAuthToken()) return [];
      const res = await divisionsApi.getAll();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDivisions(list);
      return list;
    } catch (err) {
      console.warn('[AppContext] Failed to fetch divisions:', err.message);
      return [];
    }
  };

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

        // 1. Load dynamic clusters defined by Supervisor (Single Source of Truth)
        const dynamicClusters = await fetchClusters();

        // 1c. Load dynamic divisions from DB (managed by Admin)
        await fetchDivisions();

        // 1b. Load live users from PostgreSQL to populate salesList, supervisorTeams, and rjpTeams
        if (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') {
          const usersRes = await usersApi.getAll().catch(() => null);
          const userList = Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
          if (userList.length > 0 && isMounted) {
            const salesUsers = userList.filter((u) => u.role === 'SALES');
            const spvUsers = userList.filter((u) => u.role === 'SUPERVISOR');
            const primarySpv = spvUsers[0]?.name || 'Ahmad Subagja';

            const mappedSales = salesUsers.map((s) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              phone: s.phone || '0812-3456-7890',
              cluster: s.cluster?.name || s.clusterName || 'Klaster Terjadwal',
              spvName: s.spvName || s.cluster?.supervisor?.name || primarySpv,
              spvTeamName: `Tim SPV ${s.spvName || s.cluster?.supervisor?.name || primarySpv}`,
              rjpTeamName: `RJP ${s.cluster?.name || 'Klaster'}`,
              status: 'Active',
              location: s.region || s.cluster?.region || 'Cimahi & KBB',
            }));
            setSalesList(mappedSales);

            const mappedSpvTeams = (spvUsers.length > 0 ? spvUsers : [{ id: 'usr-spv-1', name: 'Ahmad Subagja', email: 'spv@sinaranugrah.com' }]).map((spv) => ({
              id: spv.id,
              spvName: spv.name,
              spvEmail: spv.email,
              teamName: `Tim SPV ${spv.name}`,
              teamCount: mappedSales.length,
              clusters: dynamicClusters.map((c) => c.name),
              members: mappedSales.map((s) => s.name),
            }));
            setSupervisorTeams(mappedSpvTeams);

            const mappedRjpTeams = dynamicClusters.map((c) => ({
              id: c.id,
              name: `RJP ${c.name}`,
              cluster: c.name,
              region: c.region,
              spvName: c.supervisor?.name || primarySpv,
              salesName: c.assignedSales?.name || mappedSales.find((s) => s.cluster === c.name)?.name || 'Belum Ditugaskan',
              outletCount: c._count?.outlets || c.allocatedOutletsCount || c.outlets?.length || 0,
              status: 'ACTIVE',
            }));
            setRjpTeams(mappedRjpTeams);
          }
        }

        // 2. If user is Sales, load today's PJP directly from PostgreSQL
        if (user?.role === 'SALES') {
          const res = await pjpApi.getTodayPjp().catch(() => null);
          if (res?.data?.stops && res.data.stops.length > 0 && isMounted) {
            const pjpData = res.data;
            const cluster = pjpData.user?.cluster;
            const spv = cluster?.users?.find(u => u.role === 'SUPERVISOR');
            const formatTime = (ts) => {
              if (!ts) return null;
              const d = new Date(ts);
              return isNaN(d.getTime())
                ? null
                : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
            };

            const mappedStops = pjpData.stops.map((s, idx) => {
              const stopCluster = s.outlet?.cluster || cluster;
              const spv = stopCluster?.users?.find(u => u.role === 'SUPERVISOR');
              const area = stopCluster?.region || stopCluster?.name || (s.outlet?.address ? s.outlet.address.split(',').pop().trim() : '-');
              
              const inAtt = s.attendances?.find((a) => a.type === 'IN');
              const outAtt = s.attendances?.find((a) => a.type === 'OUT');

              let stopStatus = 'PENDING';
              if (outAtt || s.status === 'VISITED' || s.status === 'COMPLETED') {
                stopStatus = 'VISITED';
              } else if (inAtt || s.status === 'ARRIVED' || s.status === 'IN_VISIT') {
                stopStatus = 'ARRIVED';
              } else if (s.status === 'SKIPPED') {
                stopStatus = 'SKIPPED';
              } else if (s.status === 'CLOSED_REPORTED' || s.status === 'CLOSED') {
                stopStatus = 'CLOSED';
              }

              return {
                id: s.id,
                sequence: s.sequence || idx + 1,
                customerName: s.outlet?.name || '',
                outletName: s.outlet?.name || '',
                owner: s.outlet?.ownerName || s.outlet?.owner || '',
                phone: s.outlet?.phone || '',
                address: s.outlet?.address || '',
                type: s.outlet?.type || 'MODERN_TRADE',
                latitude: Number(s.outlet?.latitude) || null,
                longitude: Number(s.outlet?.longitude) || null,
                radiusMeters: s.outlet?.radiusMeters || 50,
                outstanding: s.outlet?.outstanding || 0,
                callplanName: pjpData.name || '',
                callFrequency: s.callFrequency || (pjpData.weekType === 'ALL' ? 'F4' : 'F2'),
                clusterName: stopCluster?.name || pjpData.clusterName || '',
                regionName: stopCluster?.region || pjpData.regionName || area,
                subDistrict: area,
                supervisorName: spv?.name || '',
                dayOfWeek: pjpData.dayOfWeek || '',
                assignedSalesName: user?.name || '',
                customerId: s.outlet?.outletCode || '',
                outletCode: s.outlet?.outletCode || '',
                status: stopStatus,
                inTimestamp: inAtt?.timestamp ? new Date(inAtt.timestamp).toISOString() : null,
                outTimestamp: outAtt?.timestamp ? new Date(outAtt.timestamp).toISOString() : null,
                checkInTime: formatTime(inAtt?.timestamp),
                checkOutTime: formatTime(outAtt?.timestamp),
                checkInPhoto: inAtt?.photoUrl || null,
                checkOutPhoto: outAtt?.photoUrl || null,
                checkInNotes: inAtt?.notes || null,
                checkOutNotes: outAtt?.notes || null,
                durationMinutes: outAtt?.durationMinutes || null,
                deviationMeters: inAtt?.deviationMeters ?? null,
              };
            });
            setSalesStops(mappedStops);
          }
        }

        // 2b. Bangun activeRoutes dari PJP hari ini (PostgreSQL)
        if (user && (user.role === 'SUPERVISOR' || user.role === 'ADMIN' || user.role === 'SALES')) {
          const res = await pjpApi.getAllPjps().catch(() => null);
          const pjps = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
          if (pjps.length > 0 && isMounted) {
            const isDateToday = (dStr) => {
              if (!dStr) return false;
              const d = new Date(dStr);
              const now = new Date();
              if (d.toDateString() === now.toDateString()) return true;
              const dWib = new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
              const nowWib = new Date(now.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
              return dWib === nowWib;
            };

            const todays = pjps.filter((p) => isDateToday(p.date));
            const listToUse = todays.length > 0 ? todays : pjps.slice(0, 20);

            const formatTime = (ts) => {
              if (!ts) return null;
              const d = new Date(ts);
              return isNaN(d.getTime())
                ? null
                : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
            };
            const routes = listToUse.map((p) => {
              const cluster = p.user?.cluster || p.cluster;
              const stops = (p.stops || []).map((s, idx) => {
                const inAtt = s.attendances?.find((a) => a.type === 'IN');
                const outAtt = s.attendances?.find((a) => a.type === 'OUT');
                let stopStatus = 'PENDING';
                if (outAtt || s.status === 'VISITED' || s.status === 'COMPLETED') {
                  stopStatus = 'VISITED';
                } else if (inAtt || s.status === 'ARRIVED' || s.status === 'IN_VISIT') {
                  stopStatus = 'ARRIVED';
                } else if (s.status === 'SKIPPED') {
                  stopStatus = 'SKIPPED';
                } else if (s.status === 'CLOSED_REPORTED' || s.status === 'CLOSED') {
                  stopStatus = 'CLOSED';
                }
                return {
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
                  radiusMeters: s.outlet?.radiusMeters || 50,
                  callplanName: p.name || '',
                  clusterName: cluster?.name || s.outlet?.cluster?.name || '',
                  regionName: cluster?.region || s.outlet?.cluster?.region || '',
                  dayOfWeek: p.dayOfWeek || '',
                  assignedSalesName: p.user?.name || '',
                  customerId: s.outlet?.outletCode || '',
                  outletCode: s.outlet?.outletCode || '',
                  status: stopStatus,
                  inTimestamp: inAtt?.timestamp ? new Date(inAtt.timestamp).toISOString() : null,
                  outTimestamp: outAtt?.timestamp ? new Date(outAtt.timestamp).toISOString() : null,
                  checkInTime: formatTime(inAtt?.timestamp),
                  checkOutTime: formatTime(outAtt?.timestamp),
                  checkInPhoto: inAtt?.photoUrl || null,
                  checkOutPhoto: outAtt?.photoUrl || null,
                  checkInNotes: inAtt?.notes || null,
                  checkOutNotes: outAtt?.notes || null,
                  durationMinutes: outAtt?.durationMinutes || null,
                  deviationMeters: inAtt?.deviationMeters ?? null,
                };
              });
              const done = stops.filter((s) => s.status === 'VISITED').length;
              return {
                id: p.id,
                salesId: p.userId,
                name: p.user?.name || '',
                repName: p.user?.name || '',
                avatar: null,
                region: cluster?.region || cluster?.name || '',
                clusterName: cluster?.name || '',
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
        if (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN' || user?.role === 'SALES') {
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
        }

        // 4. Load live orders from DB
        if (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN' || user?.role === 'SALES') {
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
        }

        // 5. Load products from DB
        const productsRes = await productsApi.getAll().catch(() => null);
        if (productsRes?.data && isMounted) {
          const rawProducts = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.items || [];
          if (rawProducts.length > 0) {
            setProducts(rawProducts);
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
    products,
    setProducts,

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
