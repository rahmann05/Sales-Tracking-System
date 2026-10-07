import { wibDateKey } from '../../../../shared/visit-metrics.mjs';
import { useEffect } from 'react';
import { collectPages, getAuthToken, pjpApi, ordersApi, productsApi, absensiApi, outletsApi, usersApi, routeChangesApi } from '../../services/api';
import { mapServerOrder } from '../../utils/orderMapper';
import { mapServerRouteChange, mapServerUnlockRequest } from '../../utils/incidentMapper';

const formatTimeWib = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
};

const resolveStopStatus = (s, inAtt, outAtt) => {
  if (outAtt || s.status === 'VISITED' || s.status === 'COMPLETED') return 'VISITED';
  if (s.status === 'SKIPPED') return 'SKIPPED';
  if (s.status === 'CLOSED_REPORTED' || s.status === 'CLOSED') return 'CLOSED';
  if (inAtt || s.status === 'ARRIVED' || s.status === 'IN_VISIT') return 'ARRIVED';
  return 'PENDING';
};

const isDateToday = value => value && wibDateKey(value) === wibDateKey();

/**
 * useBackendSync - Live backend synchronization effect.
 * Single Responsibility: on login, hydrate all domain state slices
 * from the backend (clusters, divisions, users, PJP, attendances,
 * orders, incidents, products) exactly once per user session.
 */
export const useBackendSync = ({
  user,
  fetchClusters,
  fetchDivisions,
  setSalesList,
  setSupervisorTeams,
  setRjpTeams,
  setSalesStops,
  setActiveRoutes,
  setOffPjpAttendances,
  setOrders,
  setIncidents,
  setProducts,
}) => {
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      try {
        // Hanya sinkron jika ada sesi login valid (token dari auth backend)
        if (!getAuthToken() || !user?.email) return;

        const isAdmin = user?.role === 'ADMIN';
        const isSupervisor = user?.role === 'SUPERVISOR';
        const isSales = user?.role === 'SALES';
        const isManager = isSupervisor || isAdmin;

        // Fetch domain slices in parallel, tailoring requests by role to eliminate startup delay:
        // Admin does not need heavy all-PJP stops, off-PJP attendee lists, or full product catalogs on initial login.
        const [
          dynamicClusters,
          ,
          usersRes,
          todayPjpRes,
          pjpsRes,
          offPjpRes,
          ordersRes,
          routeChangesRes,
          unlockRes,
          productsRes,
        ] = await Promise.all([
          fetchClusters(),
          fetchDivisions(),
          isManager ? collectPages(usersApi.getAll).catch(() => null) : Promise.resolve(null),
          isSales ? pjpApi.getTodayPjp().catch(() => null) : Promise.resolve(null),
          isManager ? collectPages(pjpApi.getAllPjps, { date: wibDateKey() }).catch(() => null) : Promise.resolve(null),
          (isManager || isSales) ? collectPages(absensiApi.getOffPjpList, { date: wibDateKey() }).catch(() => null) : Promise.resolve(null),
          (isManager || isSales) ? collectPages(ordersApi.getAllOrders).catch(() => null) : Promise.resolve(null),
          (isManager || isSales) ? collectPages(routeChangesApi.getAll).catch(() => null) : Promise.resolve(null),
          (isManager || isSales) ? outletsApi.getUnlockRequests().catch(() => null) : Promise.resolve(null),
          isSales ? productsApi.getAll().catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        const clustersList = Array.isArray(dynamicClusters) ? dynamicClusters : [];

        // 1. Process Live Users (Supervisor / Admin)
        if (isManager && usersRes) {
          const userList = Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
          {
            const salesUsers = userList.filter((u) => u.role === 'SALES');
            const spvUsers = userList.filter((u) => u.role === 'SUPERVISOR');
            const visibleSupervisors = isSupervisor ? [user] : spvUsers;

            const mappedSales = salesUsers.map((s) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              phone: s.phone || '—',
              cluster: s.cluster?.name || s.clusterName || 'Belum ditugaskan',
              supervisorId:s.supervisorId,
              spvName: s.supervisor?.name || s.spvName || 'Belum ditugaskan',
              spvTeamName: `Tim ${s.supervisor?.name || s.spvName || 'belum ditugaskan'}`,
              rjpTeamName: `RJP ${s.cluster?.name || 'Klaster'}`,
              status: 'Active',
              location: s.region || s.cluster?.region || '—',
            }));
            setSalesList(mappedSales);

            const mappedSpvTeams = visibleSupervisors.map((spv) => ({
              id: spv.id,
              spvName: spv.name,
              spvEmail: spv.email,
              teamName: `Tim SPV ${spv.name}`,
              teamCount: mappedSales.filter(s=>s.supervisorId===spv.id).length,
              clusters: clustersList.filter(c=>c.supervisorId===spv.id).map(c=>c.name),
              members: mappedSales.filter(s=>s.supervisorId===spv.id).map(s=>s.name),
            }));
            if (typeof setSupervisorTeams === 'function') {
              setSupervisorTeams(mappedSpvTeams);
            }

            const mappedRjpTeams = clustersList.map((c) => ({
              id: c.id,
              name: `RJP ${c.name}`,
              cluster: c.name,
              region: c.region,
              spvName: c.supervisor?.name || 'Belum ditugaskan',
              salesName: c.assignedSales?.name || 'Belum Ditugaskan',
              outletCount: c._count?.outlets || c.allocatedOutletsCount || c.outlets?.length || 0,
              status: 'ACTIVE',
            }));
            if (typeof setRjpTeams === 'function') {
              setRjpTeams(mappedRjpTeams);
            }
          }
        }

        // 2. Process Sales Today PJP
        if (isSales && todayPjpRes?.data?.stops) {
          const pjpData = todayPjpRes.data;
          const cluster = pjpData.user?.cluster;

          const mappedStops = pjpData.stops.map((s, idx) => {
            const stopCluster = s.outlet?.cluster || cluster;
            const spv = stopCluster?.users?.find((u) => u.role === 'SUPERVISOR');
            const area = stopCluster?.region || stopCluster?.name || (s.outlet?.address ? s.outlet.address.split(',').pop().trim() : '-');

            const inAtt = s.attendances?.find((a) => a.type === 'IN');
            const outAtt = s.attendances?.find((a) => a.type === 'OUT');
            const stopStatus = resolveStopStatus(s, inAtt, outAtt);

            return {
              id: s.id,
              outletId: s.outletId || s.outlet?.id || null,
              pjpId: pjpData.id,
              sequence: s.sequence || idx + 1,
              customerName: s.outlet?.name || '',
              outletName: s.outlet?.name || '',
              owner: s.outlet?.ownerName || s.outlet?.owner || '',
              phone: s.outlet?.phone || '',
              address: s.outlet?.address || '',
              type: s.outlet?.type || 'MODERN_TRADE',
              latitude: s.outlet?.latitude != null ? Number(s.outlet.latitude) : (s.latitude != null ? Number(s.latitude) : null),
              longitude: s.outlet?.longitude != null ? Number(s.outlet.longitude) : (s.longitude != null ? Number(s.longitude) : null),
              outletId: s.outletId || s.outlet?.id,
              outlet: s.outlet,
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
              lockStatus: s.outlet?.lockStatus || 'NORMAL',
              status: stopStatus,
              inTimestamp: inAtt?.timestamp ? new Date(inAtt.timestamp).toISOString() : null,
              outTimestamp: outAtt?.timestamp ? new Date(outAtt.timestamp).toISOString() : null,
              checkInTime: formatTimeWib(inAtt?.timestamp),
              checkOutTime: formatTimeWib(outAtt?.timestamp),
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

        if (isSales && todayPjpRes && !todayPjpRes.data) setSalesStops([]);

        // 3. Process Active Routes (Supervisor / Admin / Sales)
        if (pjpsRes) {
          const pjps = Array.isArray(pjpsRes?.data) ? pjpsRes.data : (Array.isArray(pjpsRes?.data?.data) ? pjpsRes.data.data : (Array.isArray(pjpsRes) ? pjpsRes : []));
          {
            const todays = pjps.filter((p) => isDateToday(p.date));
            const listToUse = todays;

            const routes = listToUse.map((p) => {
              const cluster = p.user?.cluster || p.cluster;
              const stops = (p.stops || []).map((s, idx) => {
                const inAtt = s.attendances?.find((a) => a.type === 'IN');
                const outAtt = s.attendances?.find((a) => a.type === 'OUT');
                const stopStatus = resolveStopStatus(s, inAtt, outAtt);
                return {
                  id: s.id,
                  salesId: p.userId,
                  salesName: p.user?.name,
                  sequence: s.sequence || idx + 1,
                  outletName: s.outlet?.name || '',
                  customerName: s.outlet?.name || '',
                  type: s.outlet?.type || 'MODERN_TRADE',
                  owner: s.outlet?.ownerName || s.outlet?.owner || '',
                  phone: s.outlet?.phone || '',
                  address: s.outlet?.address || '',
                  latitude: s.outlet?.latitude != null ? Number(s.outlet.latitude) : (s.latitude != null ? Number(s.latitude) : null),
                  longitude: s.outlet?.longitude != null ? Number(s.outlet.longitude) : (s.longitude != null ? Number(s.longitude) : null),
                  outletId: s.outletId || s.outlet?.id,
                  outlet: s.outlet,
                  radiusMeters: s.outlet?.radiusMeters || 50,
                  callplanName: p.name || '',
                  clusterName: cluster?.name || s.outlet?.cluster?.name || '',
                  regionName: cluster?.region || s.outlet?.cluster?.region || '',
                  dayOfWeek: p.dayOfWeek || '',
                  assignedSalesName: p.user?.name || '',
                  customerId: s.outlet?.outletCode || '',
                  outletCode: s.outlet?.outletCode || '',
                  lockStatus: s.outlet?.lockStatus || 'NORMAL',
                  status: stopStatus,
                  inTimestamp: inAtt?.timestamp ? new Date(inAtt.timestamp).toISOString() : null,
                  outTimestamp: outAtt?.timestamp ? new Date(outAtt.timestamp).toISOString() : null,
                  checkInTime: formatTimeWib(inAtt?.timestamp),
                  checkOutTime: formatTimeWib(outAtt?.timestamp),
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
            if (isManager) setSalesStops(routes.flatMap(route => route.stops));
          }
        }

        // 4. Process Off-PJP Attendances
        if (offPjpRes?.data) {
          const list = Array.isArray(offPjpRes.data) ? offPjpRes.data : offPjpRes.data.data || [];
          const mappedOffPjp = list.map((att) => ({
            id: att.id,
            status: att.status,
            userId: att.userId,
            createdAt: att.createdAt,
            salesId: att.userId,
            salesName: att.user?.name || '',
            outletName: att.outletName || '',
            customerName: att.customerName || att.outletName || '',
            phone: att.phone || '',
            address: att.address,
            reason: att.reason,
            photoUrl: att.photoUrl,
            gpsLocation: { lat: att.latitude, lng: att.longitude },
            time: new Date(att.createdAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            date: new Date(att.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
            validationStatus: att.status === 'APPROVED' ? 'TERVALIDASI' : att.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU',
          }));
          setOffPjpAttendances(mappedOffPjp);
        }

        // 5. Process Orders
        if (ordersRes?.data) {
          const rawOrders = Array.isArray(ordersRes.data)
            ? ordersRes.data
            : Array.isArray(ordersRes.data?.data)
            ? ordersRes.data.data
            : ordersRes.data.items || [];
          setOrders(rawOrders.map(mapServerOrder));
        }

        // 6. Process Incidents
        const rawRouteChanges = Array.isArray(routeChangesRes?.data)
          ? routeChangesRes.data
          : routeChangesRes?.data?.data || [];
        const rawUnlocks = Array.isArray(unlockRes?.data)
          ? unlockRes.data
          : unlockRes?.data?.data || [];

        const mappedIncidents = [
          ...rawRouteChanges.map(mapServerRouteChange),
          ...rawUnlocks.map(mapServerUnlockRequest),
        ];
        if (routeChangesRes || unlockRes) setIncidents(mappedIncidents);

        // 7. Process Products
        if (productsRes?.data) {
          const rawProducts = Array.isArray(productsRes.data)
            ? productsRes.data
            : Array.isArray(productsRes.data?.data)
            ? productsRes.data.data
            : productsRes.data.items || [];
          setProducts(rawProducts);
        }
      } catch (err) {
        console.warn('[useBackendSync] Sync with backend notice:', err.message);
      }
    };

    syncWithBackend();
    const timer = setInterval(syncWithBackend, 60000);
    window.addEventListener('focus', syncWithBackend);
    window.addEventListener('operational-data-changed', syncWithBackend);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('focus', syncWithBackend);
      window.removeEventListener('operational-data-changed', syncWithBackend);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
};
