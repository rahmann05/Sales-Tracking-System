import React, { lazy, Suspense } from 'react';
import { LuRefreshCw, LuNavigation, LuArrowLeft } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import { useDriverTrips } from '../useDriverTrips';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import {
  orderedStops,
  nextDeliveryStop,
  deliveryNavigationUrl,
  validOutletPoint,
  stopDestinationOutlet,
  deliveryVisitGroups,
} from '../../../../../shared/driver-workspace.mjs';
import { deliveryRouteLabel, deliveryStopLabel } from '../../Warehouse/deliveryLabels';
const DestinationMap = lazy(() =>
  import('./DriverDestinationMap').then((m) => ({ default: m.DriverDestinationMap }))
);
export function DriverRouteMap() {
  const { setActiveTab } = useApp();
  const { routes, activeRoute: trip, selectTrip, loading, error, refresh } = useDriverTrips();
  const [selectedId, selectStop] = useWorkspaceState('driverMapStop', '');
  const stops = React.useMemo(() => orderedStops(trip), [trip]),
    visitGroups = React.useMemo(() => deliveryVisitGroups(stops), [stops]),
    selected = stops.find((s) => s.id === selectedId),
    target = selected || nextDeliveryStop(stops) || stops[0],
    navigation = deliveryNavigationUrl(stopDestinationOutlet(target));
  return (
    <div className="workspace-page logistics-workspace">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Driver / Tujuan pengiriman</p>
          <h1>Peta tujuan</h1>
          <p>Pilih trip dan tujuan, lalu buka navigasi dari ponsel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="admin-button"
            onClick={() => setActiveTab(TAB_IDS.DELIVERY_DRIVER_TRIPS)}
          >
            <LuArrowLeft />
            Kembali ke Trip saya
          </button>
          <button type="button" className="admin-button" disabled={loading} onClick={refresh}>
            <LuRefreshCw />
            Perbarui
          </button>
        </div>
      </header>
      {error && (
        <p role="alert" className="admin-feedback error">
          {error} Peta menampilkan data terakhir yang berhasil dimuat.
        </p>
      )}
      {trip ? (
        <>
          <div className="admin-toolbar">
            <label className="admin-select-label">
              Trip pengiriman
              <select
                value={trip.id}
                onChange={(e) => {
                  selectTrip(e.target.value);
                  selectStop('');
                }}
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} · {deliveryRouteLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <p className="admin-footnote">
              Tanggal trip{' '}
              {new Date(trip.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB ·{' '}
              {visitGroups.length} tujuan
            </p>
            {navigation && (
              <a
                className="admin-button primary"
                href={navigation}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LuNavigation />
                Navigasi ke {target?.outlet?.name}
              </a>
            )}
          </div>
          <div className="logistics-map-layout">
            <section className="admin-panel logistics-stop-list">
              <div className="admin-panel-heading">
                <h2>Tujuan trip</h2>
                <button type="button" className="admin-button" onClick={() => selectStop('')}>
                  Lihat semua
                </button>
              </div>
              <ol>
                {visitGroups.map((group, index) => {
                  const primaryStop =
                    group.stops.find((s) => s.status === 'PENDING') || group.stops[0];
                  return (
                    <li key={group.stops[0].id}>
                      <button
                        type="button"
                        aria-pressed={group.stops.some((s) => s.id === selectedId)}
                        onClick={() => selectStop(primaryStop.id)}
                      >
                        <span className="logistics-sequence">{index + 1}</span>
                        <span>
                          <strong>{primaryStop.outlet?.name || 'Outlet'}</strong>
                          <small>{primaryStop.outlet?.address}</small>
                          <small>
                            {deliveryStopLabel(primaryStop.status)}
                            {group.stops.length > 1 ? ` · ${group.stops.length} dokumen` : ''}
                            {!validOutletPoint(stopDestinationOutlet(primaryStop))
                              ? ' · Koordinat belum tersedia'
                              : ''}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
            <section className="admin-panel logistics-map-panel" aria-label="Peta lokasi tujuan">
              <Suspense fallback={<p className="admin-empty">Memuat peta…</p>}>
                <DestinationMap stops={stops} selectedId={selectedId} onSelect={selectStop} />
              </Suspense>
            </section>
          </div>
          <details className="admin-footnote">
            <summary className="cursor-pointer">Catatan titik peta dan navigasi</summary>
            <p>
              Titik tujuan dibekukan saat trip dibuat dari outlet yang direferensikan order. Posisi
              langsung truk ditampilkan terpisah. Navigasi jalan dibuka melalui Google Maps.
            </p>
          </details>
        </>
      ) : (
        <p className="admin-empty">
          {loading ? 'Memuat trip…' : 'Belum ada trip terbuka yang ditugaskan.'}
        </p>
      )}
    </div>
  );
}
