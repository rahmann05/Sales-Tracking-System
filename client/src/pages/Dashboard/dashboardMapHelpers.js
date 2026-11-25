import { getClusterColorHex } from '../../services/clusterColorService.js';

const escapeXml = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const sanitizeHexColor = (color, fallback = '#2563eb') =>
  typeof color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(color.trim()) ? color.trim() : fallback;

export function resolveClusterColor(cluster, fallbackIndex = 0) {
  if (cluster?.colorHex) return sanitizeHexColor(cluster.colorHex);
  return getClusterColorHex(cluster?.name || '', String(fallbackIndex), null);
}

/**
 * Extracts DB outlet sequence numbers from active ClusterRoute.outletOrder when present.
 * Returns empty Map entries gracefully if a cluster has no outletOrder array.
 */
export function buildClusterSequenceMap(clusters = []) {
  const sequenceByOutletId = new Map();
  for (const cluster of clusters || []) {
    if (!cluster) continue;
    const routes = Array.isArray(cluster.routes) ? cluster.routes : [];
    const activeRoute = routes.find((r) => r?.isActive) || routes[0];
    const order = Array.isArray(activeRoute?.outletOrder) ? activeRoute.outletOrder : [];
    for (const [idx, item] of order.entries()) {
      let outletId = null;
      let sequence = idx + 1;
      if (typeof item === 'string') {
        outletId = item;
      } else if (item && typeof item === 'object') {
        outletId = item.id || item.outletId || null;
        if (Number.isFinite(Number(item.sequence)) && Number(item.sequence) > 0) {
          sequence = Number(item.sequence);
        }
      }
      if (outletId && !sequenceByOutletId.has(outletId)) {
        sequenceByOutletId.set(outletId, { sequence, clusterId: cluster.id });
      }
    }
  }
  return sequenceByOutletId;
}

export function resolveRouteClusters(route, clusters = []) {
  if (!route || !Array.isArray(clusters) || clusters.length === 0) return [];
  const matched = new Map();
  const byId = new Map(clusters.map((c) => [c.id, c]));

  const explicitIds = new Set();
  if (route.clusterId) explicitIds.add(route.clusterId);
  for (const cid of route.clusterIds || []) {
    if (cid) explicitIds.add(cid);
  }
  for (const stop of route.stops || []) {
    const cid = stop?.clusterId || stop?.outlet?.clusterId || stop?.outlet?.cluster?.id;
    if (cid) explicitIds.add(cid);
  }
  for (const cid of explicitIds) {
    const cluster = byId.get(cid);
    if (cluster) matched.set(cluster.id, cluster);
  }

  if (matched.size === 0) {
    const salesName = (route.repName || route.name || '').trim();
    for (const cluster of clusters) {
      const assignedById = route.salesId && cluster.assignedSalesId === route.salesId;
      const assignedByName = salesName && cluster.assignedSales?.name === salesName;
      const memberMatch =
        Array.isArray(cluster.users) &&
        cluster.users.some(
          (u) => (route.salesId && u.id === route.salesId) || (salesName && u.name === salesName)
        );
      if (assignedById || assignedByName || memberMatch) {
        matched.set(cluster.id, cluster);
      }
    }
  }

  if (matched.size === 0 && route.clusterName) {
    const names = new Set(
      String(route.clusterName)
        .split('·')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
    );
    for (const cluster of clusters) {
      if (cluster.name && names.has(cluster.name.trim().toLowerCase())) {
        matched.set(cluster.id, cluster);
      }
    }
  }

  return Array.from(matched.values());
}

export function resolveSalesClusters(salesName, routes = [], clusters = []) {
  if (!salesName || salesName === 'ALL') return clusters;
  const matched = new Map();

  for (const route of routes || []) {
    if ((route.repName || route.name) === salesName) {
      for (const cluster of resolveRouteClusters(route, clusters)) {
        matched.set(cluster.id, cluster);
      }
    }
  }

  for (const cluster of clusters || []) {
    const assignedByName = cluster.assignedSales?.name === salesName;
    const memberMatch =
      Array.isArray(cluster.users) && cluster.users.some((u) => u.name === salesName);
    if (assignedByName || memberMatch) {
      matched.set(cluster.id, cluster);
    }
  }

  return Array.from(matched.values());
}

export function filterOperationalMapScope({
  outlets = [],
  clusters = [],
  routes = [],
  selectedSalesName = 'ALL',
  selectedRoute = null,
}) {
  const isFiltered = Boolean(selectedRoute) || (Boolean(selectedSalesName) && selectedSalesName !== 'ALL');
  if (!isFiltered) {
    return {
      isFiltered: false,
      visibleClusters: clusters,
      visibleOutlets: outlets,
      focusRoutes: routes,
    };
  }

  const focusRoutes = selectedRoute
    ? [selectedRoute]
    : (routes || []).filter((r) => (r.repName || r.name) === selectedSalesName);

  const visibleClusters = selectedRoute
    ? resolveRouteClusters(selectedRoute, clusters)
    : resolveSalesClusters(selectedSalesName, focusRoutes, clusters);

  const visibleClusterIds = new Set(visibleClusters.map((c) => c.id));
  const stopOutletIds = new Set();
  const stopOutletCodes = new Set();

  for (const route of focusRoutes) {
    for (const stop of route.stops || []) {
      const oid = stop?.outletId || stop?.outlet?.id;
      if (oid) stopOutletIds.add(oid);
      const code = stop?.outletCode || stop?.customerId || stop?.outlet?.outletCode;
      if (code) stopOutletCodes.add(code);
    }
  }

  const visibleOutlets = (outlets || []).filter(
    (o) =>
      visibleClusterIds.has(o.clusterId) ||
      stopOutletIds.has(o.id) ||
      (o.outletCode && stopOutletCodes.has(o.outletCode))
  );

  const representedIds = new Set(visibleOutlets.map((o) => o.id));
  const representedCodes = new Set(visibleOutlets.map((o) => o.outletCode).filter(Boolean));
  const fallbackClusterId = visibleClusters[0]?.id || null;

  for (const route of focusRoutes) {
    for (const stop of route.stops || []) {
      const oid = stop?.outletId || stop?.outlet?.id || stop?.id;
      const code = stop?.outletCode || stop?.customerId || '';
      if ((oid && representedIds.has(oid)) || (code && representedCodes.has(code))) {
        continue;
      }
      const lat = Number(stop?.latitude);
      const lng = Number(stop?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (oid) representedIds.add(oid);
      if (code) representedCodes.add(code);
      visibleOutlets.push({
        id: oid,
        name: stop.outletName || stop.customerName || 'Outlet PJP',
        outletCode: code,
        clusterId: stop.clusterId || stop.outlet?.clusterId || fallbackClusterId,
        latitude: lat,
        longitude: lng,
        googleMapsOnly: Boolean(stop.googleMapsOnly),
        type: stop.type || 'GENERAL_TRADE',
      });
    }
  }

  return {
    isFiltered: true,
    visibleClusters,
    visibleOutlets,
    focusRoutes,
  };
}

export function buildPjpStopLookup(routes = []) {
  const byOutletId = new Map();
  const byOutletCode = new Map();

  for (const route of routes || []) {
    const sortedStops = [...(route.stops || [])].sort(
      (a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0)
    );
    for (const [idx, stop] of sortedStops.entries()) {
      const sequence = Number(stop.sequence) > 0 ? Number(stop.sequence) : idx + 1;
      const entry = { stop, route, sequence };
      const oid = stop?.outletId || stop?.outlet?.id || stop?.id;
      const code = stop?.outletCode || stop?.customerId || stop?.outlet?.outletCode;
      if (oid && !byOutletId.has(oid)) byOutletId.set(oid, entry);
      if (code && !byOutletCode.has(code)) byOutletCode.set(code, entry);
    }
  }

  return { byOutletId, byOutletCode };
}

const resolveStatusDotColor = (status) => {
  switch (status) {
    case 'VISITED':
    case 'COMPLETED':
    case 'ORDERED':
      return '#16a34a';
    case 'ARRIVED':
    case 'IN_VISIT':
      return '#0284c7';
    case 'SKIPPED':
    case 'CLOSED':
    case 'CLOSED_REPORTED':
      return '#dc2626';
    default:
      return null;
  }
};

export function buildNumberedPinSvg({
  color = '#2563eb',
  number = null,
  scale = 1,
  variant = 'pjp',
  status = null,
  isSelected = false,
} = {}) {
  const safeColor = sanitizeHexColor(color);
  const rawText = number != null && String(number).trim() !== '' ? String(number).trim() : '';
  const safeText = escapeXml(rawText);

  if (variant === 'cluster') {
    const hasNum = Boolean(safeText);
    const size = Math.round((hasNum ? 24 : 16) * scale);
    const fontSize = rawText.length >= 3 ? 8 : 10;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">` +
      `<circle cx="12" cy="12" r="${hasNum ? 10 : 8.5}" fill="${safeColor}" fill-opacity="${isSelected ? 1 : 0.85}" stroke="${isSelected ? '#0f172a' : '#ffffff'}" stroke-width="${isSelected ? 2.4 : 1.8}"/>` +
      (hasNum
        ? `<text x="12" y="15.5" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${fontSize}" font-weight="800">${safeText}</text>`
        : '<circle cx="12" cy="12" r="2.6" fill="#ffffff"/>') +
      '</svg>';
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: { width: size, height: size },
      anchor: { x: Math.round(size / 2), y: Math.round(size / 2) },
    };
  }

  const width = Math.round(34 * scale);
  const height = Math.round(44 * scale);
  const fontSize = rawText.length >= 3 ? 9.5 : 12.5;
  const statusColor = resolveStatusDotColor(status);
  const statusBadge = statusColor
    ? `<circle cx="26.5" cy="7.5" r="4.5" fill="${statusColor}" stroke="#ffffff" stroke-width="1.6"/>`
    : '';
  const selectedRing = isSelected
    ? '<circle cx="17" cy="16" r="14.5" fill="none" stroke="#0f172a" stroke-opacity="0.35" stroke-width="1.5"/>'
    : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 44" width="${width}" height="${height}">` +
    selectedRing +
    `<path d="M17 2C9.268 2 3 8.268 3 16c0 9.6 14 25 14 25s14-15.4 14-25C31 8.268 24.732 2 17 2z" fill="${safeColor}" stroke="#ffffff" stroke-width="${isSelected ? 2.5 : 1.8}"/>` +
    (safeText
      ? `<text x="17" y="20.2" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${fontSize}" font-weight="800">${safeText}</text>`
      : '<circle cx="17" cy="16" r="4" fill="#ffffff"/>') +
    statusBadge +
    '</svg>';

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width, height },
    anchor: { x: Math.round(width / 2), y: height },
  };
}
