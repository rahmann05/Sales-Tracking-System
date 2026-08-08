import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { clustersApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';

const DAYS = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
  { key: 'sabtu', label: 'Sabtu' },
];

const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5'];

const makeIcon = (color, label, big) => {
  const size = big ? 36 : 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="3.2" fill="#fff"/><text x="12" y="11" font-size="7" font-weight="bold" text-anchor="middle" fill="${color}">${label}</text></svg>`;
  return L.divIcon({ className: 'sched-marker', html: svg, iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -size] });
};

const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      try { map.fitBounds(L.latLngBounds(points), { padding: [50, 50] }); } catch (e) { /* noop */ }
    }
  }, [points, map]);
  return null;
};

const selectStyle = {
  padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db',
  fontSize: 13, fontWeight: 600, background: '#fff', cursor: 'pointer', minWidth: 120,
};

/**
 * ScheduleMap - Peta jadwal kunjungan per sales, per hari, per cluster.
 * Sumber data: GET /clusters (jadwal mingguan hasil generate).
 * Opsi menampilkan cluster lain hanya diizinkan untuk Supervisor & Manager Operasional.
 */
export const ScheduleMap = ({ salesOptions = [], defaultSalesId = '' }) => {
  const { user } = useApp();
  const isSupervisorOrManager = ['SUPERVISOR', 'OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role);

  const todayKey = DAYS[new Date().getDay() === 0 ? -1 : new Date().getDay() - 1]?.key || 'senin';
  const [day, setDay] = useState(todayKey);
  const [salesId, setSalesId] = useState(defaultSalesId);
  const [clusterId, setClusterId] = useState('all');
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultSalesId) setSalesId(defaultSalesId);
  }, [defaultSalesId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const params = { day };
        if (salesId) params.salesId = salesId;
        const res = await clustersApi.getAll(params);
        const list = Array.isArray(res) ? res : (res?.data || []);

        // Ambil detail tiap cluster agar stops (dengan koordinat) tersedia untuk peta
        const detailed = await Promise.all(
          list.map(async (c) => {
            try {
              const d = await clustersApi.getById(c.id);
              return d?.data || d || c;
            } catch {
              return c;
            }
          })
        );
        if (!cancelled) { setClusters(detailed); setClusterId('all'); }
      } catch (e) {
        if (!cancelled) { setClusters([]); setError(e.message || 'Gagal memuat jadwal'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [day, salesId]);

  const colorOf = (id) => {
    const idx = clusters.findIndex((c) => c.id === id);
    return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
  };

  const visibleClusters = useMemo(
    () => (clusterId === 'all' ? clusters : clusters.filter((c) => c.id === clusterId)),
    [clusters, clusterId]
  );

  const { markers, polylines, fitPoints } = useMemo(() => {
    const mk = []; const lines = []; const fit = [];
    visibleClusters.forEach((cluster) => {
      (cluster.pjps || []).forEach((pjp) => {
        const color = colorOf(cluster.id);
        const coords = [];
        const stops = [...(pjp.stops || [])].sort((a, b) => a.sequence - b.sequence);
        stops.forEach((stop, i) => {
          const o = stop.outlet || {};
          const lat = Number(o.latitude); const lng = Number(o.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          mk.push({ id: stop.stopId || stop.id, lat, lng, color, seq: stop.sequence || i + 1, outletName: o.name, address: o.address, owner: o.owner, sales: pjp.salesName, cluster: cluster.name });
          coords.push([lat, lng]); fit.push([lat, lng]);
        });
        if (coords.length > 1) lines.push({ id: pjp.id, color, coords });
      });
    });
    return { markers: mk, polylines: lines, fitPoints: fit };
  }, [visibleClusters, clusters]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      {/* Filter Bar */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex',
        gap: 8, flexWrap: 'wrap', background: 'rgba(255,255,255,0.95)',
        padding: 10, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}>
        <select style={selectStyle} value={day} onChange={(e) => setDay(e.target.value)} title="Hari">
          {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        {isSupervisorOrManager && salesOptions.length > 0 && (
          <select style={selectStyle} value={salesId} onChange={(e) => setSalesId(e.target.value)} title="Sales">
            <option value="">Semua Sales</option>
            {salesOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {isSupervisorOrManager && (
          <select style={selectStyle} value={clusterId} onChange={(e) => setClusterId(e.target.value)} title="Cluster">
            <option value="all">Semua Cluster</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({(c.pjps || []).reduce((n, p) => n + (p.stops?.length || 0), 0)} outlet)
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          Memuat jadwal...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#fee2e2', color: '#b91c1c', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <MapContainer center={[-6.8722, 107.5423]} zoom={11} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {fitPoints.length > 0 && <FitBounds points={fitPoints} />}
        {polylines.map((l) => (
          <Polyline key={l.id} positions={l.coords} pathOptions={{ color: l.color, weight: 4, opacity: 0.6 }} />
        ))}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={makeIcon(m.color, m.seq, clusterId !== 'all')}>
            <Popup>
              <div style={{ fontSize: 12, minWidth: 190 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 4, marginBottom: 4 }}>
                  <strong style={{ color: m.color }}>{m.cluster}</strong>
                  <span style={{ fontWeight: 700, color: '#6b7280' }}>#{m.seq}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.outletName}</div>
                {m.owner && <div style={{ color: '#6b7280' }}>{m.owner}</div>}
                {m.address && <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{m.address}</div>}
                {m.sales && <div style={{ marginTop: 4, fontSize: 11, color: '#374151' }}>Sales: <b>{m.sales}</b></div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!loading && markers.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 999, background: 'rgba(255,255,255,0.95)', padding: '14px 20px', borderRadius: 12, fontSize: 13, color: '#6b7280', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
          Tidak ada jadwal untuk hari ini.<br />Silakan generate jadwal mingguan terlebih dahulu.
        </div>
      )}
    </div>
  );
};

export default ScheduleMap;
