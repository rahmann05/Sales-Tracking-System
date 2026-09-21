import { useEffect } from 'react';
import { getAuthToken, pjpApi, ordersApi, productsApi, absensiApi, outletsApi, usersApi, routeChangesApi } from '../../services/api';
import { mapServerOrder } from '../../utils/orderMapper';
import { mapServerRouteChange, mapServerUnlockRequest } from '../../utils/incidentMapper';

const formatTimeWib = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
};

const resolveStopStatus = (s, inAtt, outAtt) => {
  if (outAtt || s.status === 'VISITED' || s.status === 'COMPLETED') return 'VISITED';
  if (inAtt || s.status === 'ARRIVED' || s.status === 'IN_VISIT') return 'ARRIVED';
  if (s.status === 'SKIPPED') return 'SKIPPED';
  if (s.status === 'CLOSED_REPORTED' || s.status === 'CLOSED') return 'CLOSED';
  return 'PENDING';
};

const isDateToday = (dStr) => {
  if (!dStr) return false;
  const d = new Date(dStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return true;
  const dWib = new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const nowWib = new Date(now.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  return dWib === nowWib;
};

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

            const mappedStops = pjpData.stops.map((s, idx) => {
              const stopCluster = s.outlet?.cluster || cluster;
              const spv = stopCluster?.users?.find(u => u.role === 'SUPERVISOR');
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
        }

        // 2b. Bangun activeRoutes dari PJP hari ini (PostgreSQL)
        if (user && (user.role === 'SUPERVISOR' || user.role === 'ADMIN' || user.role === 'SALES')) {
          const res = await pjpApi.getAllPjps().catch(() => null);
          const pjps = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
          if (pjps.length > 0 && isMounted) {
            const todays = pjps.filter((p) => isDateToday(p.date));
            const listToUse = todays.length > 0 ? todays : pjps.slice(0, 20);

            const routes = listToUse.map((p) => {
              const cluster = p.user?.cluster || p.cluster;
              const stops = (p.stops || []).map((s, idx) => {
                const inAtt = s.attendances?.find((a) => a.type === 'IN');
                const outAtt = s.attendances?.find((a) => a.type === 'OUT');
                const stopStatus = resolveStopStatus(s, inAtt, outAtt);
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
              setOrders(rawOrders.map(mapServerOrder));
            }
          }
        }

        // 4b. Load live incidents (closed-shop reports & unlock requests) from DB
        if (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN' || user?.role === 'SALES') {
          const [routeChangesRes, unlockRes] = await Promise.all([
            routeChangesApi.getAll().catch(() => null),
            outletsApi.getUnlockRequests().catch(() => null),
          ]);

          if (isMounted) {
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
            if (mappedIncidents.length > 0) {
              setIncidents(mappedIncidents);
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
        console.warn('[useBackendSync] Sync with backend notice:', err.message);
      }
    };

    syncWithBackend();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
};
