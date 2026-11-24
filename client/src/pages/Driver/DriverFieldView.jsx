import { SharedVisitModal } from './components/SharedVisitModal';
import { DepartureChecklistSummary } from '../../shared/components/common/DepartureChecklistSummary';
import React, { useState } from 'react';
import { LuRefreshCw, LuArrowRight, LuMapPin, LuWrench } from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
import { sendDriverEvidence } from '../../services/api/deliveryApi';
import { DriverPendingSubmissions } from './components/DriverPendingSubmissions';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { useSelectedDetail } from '../../shared/hooks/useSelectedDetail';
import { useDomainPermission } from '../../shared/hooks/useDomainPermission';
import { TAB_IDS } from '../../constants/navigation';
import { useDriverTrips } from './useDriverTrips';
import { DriverStopCard } from './components/DriverStopCard';
import { DriverAttendanceModal } from './components/DriverAttendanceModal';
import { RouteOperationsActions } from '../Warehouse/components/RouteOperationsActions';
import { OperationalIssues } from '../Warehouse/components/OperationalIssues';
import { RecordMaintenanceModal } from '../Warehouse/components/RecordMaintenanceModal';
import { deliveryRouteLabel, deliveryStopLabel } from '../Warehouse/deliveryLabels';
import { routeProgress } from '../../../../shared/delivery-operations.mjs';
import {
  orderedStops,
  nextDeliveryStop,
  deliveryStopGate,
  deliveryVisitGroups,
} from '../../../../shared/driver-workspace.mjs';
const stamp = (v) =>
  v ? new Date(v).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Belum tercatat';
export function DriverFieldView() {
  const { driverTracking, user, setActiveTab } = useApp();
  const canMaintenance = useDomainPermission('VEHICLE_MAINTENANCE');
  const {
    routes,
    issues,
    loading,
    error,
    updatedAt,
    refresh,
    activeRoute: trip,
    selectTrip,
  } = useDriverTrips();
  const [selectedStopId, selectStop] = useWorkspaceState('driverStop', ''),
    [modal, setModal] = useState(null),
    [serviceModal, setServiceModal] = useState(false);
  const stops = orderedStops(trip),
    next = nextDeliveryStop(stops),
    selected = stops.find((s) => s.id === selectedStopId) || next || stops[0],
    progress = routeProgress(trip || {});
  const totalRejectedCartons = stops.reduce((sum, s) => sum + Number(s.rejectedCartons || 0), 0);
  const rejectedStopsCount = stops.filter((s) => Number(s.rejectedCartons || 0) > 0).length;
  const visitGroups = deliveryVisitGroups(stops);
  const visit = visitGroups.find((group) => group.stops.some((stop) => stop.id === selected?.id));
  const selectedVisitIndex = visitGroups.findIndex((group) =>
    group.stops.some((stop) => stop.id === selected?.id)
  );
  const openEvidence = (type) => {
    const policyValues = trip?.policySnapshot?.values;
    const base = visit?.stops || [selected];
    const pending = base.filter(
      (stop) =>
        stop.status === 'PENDING' &&
        (type === 'absen_in'
          ? !stop.arrivedAt
          : policyValues?.DELIVERY_ATTENDANCE_MODE === 'OPTIONAL' || !!stop.arrivedAt)
    );
    const targets = pending.length ? pending : [selected].filter(Boolean);
    setModal({
      stop: targets.find((s) => s.id === selected?.id) || targets[0] || selected,
      stops: targets,
      type,
      primaryStopId: selected?.id,
    });
  };
  const detailRef = useSelectedDetail(selectedStopId ? selected?.id : null, true);
  const disabled = !!error || trip?.status !== 'IN_TRANSIT' || trip?.onHold || !!trip?.returnedAt;
  const disabledReason = error
    ? 'Perbarui data trip terlebih dahulu sebelum mengirim bukti.'
    : !trip
      ? ''
      : trip.onHold
        ? 'Trip sedang ditahan Kepala Gudang. Hubungi gudang sebelum melanjutkan.'
        : trip.returnedAt
          ? 'Trip sudah tercatat kembali ke gudang.'
          : trip.status === 'DRAFT'
            ? 'Muatan masih disiapkan gudang. Tunggu serah terima selesai.'
            : trip.status === 'READY'
              ? 'Konfirmasikan "Berangkat" di panel tindakan perjalanan terlebih dahulu.'
              : trip.status !== 'IN_TRANSIT'
                ? 'Status trip belum dalam pengantaran.'
                : '';
  const destinationGate = deliveryStopGate(
    stops.filter(
      (stop) => stop.id === selected?.id || !visit?.stops.some((member) => member.id === stop.id)
    ),
    selected?.id,
    trip?.policySnapshot?.values
  );
  const tripIssues = issues.filter(
    (i) => i.routeId === trip?.id || stops.some((s) => s.id === i.deliveryStopId)
  );
  const save = async (id, data) => {
    await sendDriverEvidence(id, data);
    setModal(null);
    await refresh();
  };
  return (
    <div className="workspace-page logistics-workspace driver-workspace">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Driver / Pelaksanaan pengiriman</p>
          <h1>Trip saya</h1>
          <p>Trip yang belum ditutup, termasuk penugasan dari tanggal sebelumnya.</p>
        </div>
        <button type="button" className="admin-button" disabled={loading} onClick={refresh}>
          <LuRefreshCw />
          {loading ? 'Memperbarui…' : 'Perbarui'}
        </button>
      </header>
      <p role="status" className="admin-footnote">
        Pembaruan setiap 30 detik · Terakhir berhasil: {stamp(updatedAt)} WIB
      </p>
      <DriverPendingSubmissions onChanged={refresh} />
      {error && (
        <p role="alert" className="admin-feedback error">
          {error} Data terakhir tetap ditampilkan. Perbarui data sebelum melakukan tindakan.
        </p>
      )}
      {loading && !routes.length ? (
        <p className="admin-empty">Memuat trip yang ditugaskan…</p>
      ) : !trip ? (
        <section className="admin-panel admin-empty">
          <h2>Belum ada trip terbuka</h2>
          <p>Hubungi Kepala Gudang untuk memeriksa penugasan Anda.</p>
        </section>
      ) : (
        <>
          <section className="admin-panel logistics-trip-heading">
            <div>
              <span className="admin-status">{deliveryRouteLabel(trip)}</span>
              <h2>{trip.code}</h2>
              <p>
                {trip.vehicle?.code || 'Truk belum ditetapkan'} · {trip.vehicle?.name} · Tanggal
                trip{' '}
                {trip.date
                  ? new Date(trip.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
                  : 'Belum tersedia'}
              </p>
            </div>
            <div className="logistics-heading-tools">
              {routes.length > 1 && (
                <label>
                  Trip yang ditugaskan
                  <select
                    value={trip.id}
                    onChange={(e) => {
                      if (
                        window.dispatchEvent(
                          new CustomEvent('app:before-navigate', { cancelable: true })
                        )
                      ) {
                        selectTrip(e.target.value);
                        selectStop('');
                      }
                    }}
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} · {deliveryRouteLabel(r)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {canMaintenance && trip.vehicle && (
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => setServiceModal(true)}
                >
                  <LuWrench />
                  Catat servis
                </button>
              )}
              <button
                type="button"
                className="admin-button"
                onClick={() => {
                  selectTrip(trip.id);
                  setActiveTab(TAB_IDS.DELIVERY_DRIVER_MAP);
                }}
              >
                <LuMapPin />
                Peta tujuan
              </button>
            </div>
          </section>
          <div className="logistics-metrics">
            {[
              ['Dokumen diproses', `${progress.resolved}/${progress.total}`],
              ['Diterima penuh', progress.delivered],
              ['Diterima sebagian', stops.filter((s) => s.status === 'PARTIAL_REJECT').length],
              ['Ditolak', stops.filter((s) => s.status === 'REJECTED').length],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          {!trip.returnedAt && ['READY', 'COMPLETED', 'PARTIAL'].includes(trip.status) && (
            <section className="admin-panel logistics-action-panel">
              <h2>
                {trip.status === 'READY'
                  ? 'Langkah berikutnya: konfirmasi keberangkatan'
                  : 'Langkah berikutnya: konfirmasi kembali ke gudang'}
              </h2>
              {['COMPLETED', 'PARTIAL'].includes(trip.status) && totalRejectedCartons > 0 && (
                <p role="status" className="admin-feedback error">
                  Barang retur dibawa kembali: <strong>{totalRejectedCartons} karton</strong> dari{' '}
                  <strong>{rejectedStopsCount}</strong> toko wajib diserahkan ke Kepala Gudang saat
                  tiba untuk pemeriksaan retur.
                </p>
              )}
              <fieldset disabled={!!error}>
                <RouteOperationsActions key={trip.id} route={trip} driver onChanged={refresh} />
              </fieldset>
            </section>
          )}
          <section className="admin-panel logistics-next">
            <div>
              <p className="admin-eyebrow">
                {trip.returnedAt
                  ? 'Perjalanan telah kembali'
                  : trip.status === 'DRAFT'
                    ? 'Menunggu penyiapan gudang'
                    : trip.status === 'READY'
                      ? 'Siap berangkat'
                      : next
                        ? 'Tujuan berikutnya'
                        : 'Seluruh tujuan telah diproses'}
              </p>
              <h2>
                {trip.returnedAt
                  ? 'Menunggu pemeriksaan dan penutupan gudang'
                  : trip.status === 'DRAFT'
                    ? 'Gudang sedang menyiapkan muatan'
                    : trip.status === 'READY'
                      ? next
                        ? `Tujuan pertama: ${next.outlet?.name}`
                        : 'Periksa serah terima muatan & isi odometer'
                      : next
                        ? next.outlet?.name
                        : 'Konfirmasikan perjalanan kembali di atas'}
              </h2>
              <p>
                {trip.onHold
                  ? 'Trip ditahan. Hubungi Kepala Gudang sebelum melanjutkan.'
                  : trip.status === 'DRAFT'
                    ? 'Tunggu gudang menyelesaikan penyiapan, pemeriksaan, dan muat barang.'
                    : trip.status === 'READY'
                      ? 'Klik "Berangkat" pada panel tindakan perjalanan di atas sebelum mulai mengantar ke toko.'
                      : next?.outlet?.address ||
                        'Trip selesai setelah bukti dan retur diperiksa oleh gudang.'}
              </p>
            </div>
            {trip.status === 'IN_TRANSIT' && next && (
              <button
                type="button"
                className="admin-button primary"
                onClick={() => {
                  selectStop(next.id);
                  detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Buka tujuan
                <LuArrowRight />
              </button>
            )}
          </section>
          {(trip.returnedAt || !['READY', 'COMPLETED', 'PARTIAL'].includes(trip.status)) && (
            <DepartureChecklistSummary route={trip} />
          )}
          <div className="logistics-split">
            <section className="admin-panel logistics-stop-list">
              <div className="admin-panel-heading">
                <h2>Urutan tujuan</h2>
                <span>{progress.completionPercent}% diproses</span>
              </div>
              <ol>
                {visitGroups.map((group, index) => {
                  const stop =
                    group.stops.find((item) => item.status === 'PENDING') || group.stops[0];
                  return (
                    <li key={group.stops[0].id}>
                      <button
                        type="button"
                        aria-pressed={group.stops.some((item) => item.id === selected?.id)}
                        onClick={() => selectStop(stop.id)}
                      >
                        <span className="logistics-sequence">{index + 1}</span>
                        <span>
                          <strong>{stop.outlet?.name || 'Outlet'}</strong>
                          <small>
                            {deliveryStopLabel(stop.status)}
                            {stop.status === 'PENDING' && stop.arrivedAt ? ' · Sudah tiba' : ''}
                          </small>
                          <small>
                            {group.stops.reduce(
                              (sum, item) => sum + (item.allocatedCartons || 0),
                              0
                            )}{' '}
                            karton · {group.stops.length} dokumen
                          </small>
                        </span>
                        {stop.id === next?.id && <span className="admin-status">Berikutnya</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
            <section
              ref={detailRef}
              tabIndex={-1}
              className="logistics-stop-detail"
              aria-label="Rincian tujuan pilihan"
            >
              {selected ? (
                <>
                  {visit?.stops.length > 1 && (
                    <p className="work-step-intro">
                      {visit.stops.length} dokumen untuk satu tujuan. Bukti kunjungan diambil
                      sekali; hasil setiap dokumen tetap dicatat terpisah.
                    </p>
                  )}
                  {visit?.stops.length > 1 && (
                    <nav className="work-tabs" aria-label="Dokumen pada tujuan ini">
                      {visit.stops.map((document) => (
                        <button
                          type="button"
                          key={document.id}
                          aria-pressed={selected.id === document.id}
                          onClick={() => selectStop(document.id)}
                        >
                          {document.packingList?.code || 'Dokumen muatan'} ·{' '}
                          {deliveryStopLabel(document.status)}
                        </button>
                      ))}
                    </nav>
                  )}
                  <DriverStopCard
                    policy={trip.policySnapshot?.values}
                    stop={selected}
                    index={selectedVisitIndex >= 0 ? selectedVisitIndex : stops.indexOf(selected)}
                    totalStops={visitGroups.length || stops.length}
                    disabled={disabled || destinationGate.blocked}
                    disabledReason={disabledReason || destinationGate.reason}
                    onAbsenIn={() => openEvidence('absen_in')}
                    onMarkDelivered={() => openEvidence('delivered')}
                    onMarkRejected={() => openEvidence('rejected')}
                  />
                  {!disabled && destinationGate.reason && !destinationGate.blocked && (
                    <p role="status" className="admin-feedback">
                      {destinationGate.reason}
                    </p>
                  )}
                  <p className="admin-footnote">
                    Tiba: {stamp(selected.arrivedAt)} · Selesai diproses:{' '}
                    {stamp(selected.completedAt)}
                  </p>
                </>
              ) : (
                <p className="admin-empty">Trip belum memiliki tujuan.</p>
              )}
            </section>
          </div>
          <section className="admin-panel logistics-gps">
            <h2>Status GPS ponsel</h2>
            <p role="status">{driverTracking?.message || 'Menunggu informasi GPS.'}</p>
            {driverTracking?.at && (
              <p>
                Terakhir berhasil dikirim: {stamp(driverTracking.at)} WIB ·{' '}
                {driverTracking.routeCode || 'Trip'}
              </p>
            )}
            <details className="admin-footnote">
              <summary className="cursor-pointer">Informasi cara kerja pelacakan GPS</summary>
              <p>
                Lokasi langsung tersedia saat halaman aktif, izin GPS diberikan, dan jaringan
                tersambung. Gudang melihat waktu serta sumber posisi terakhir ketika pembaruan
                berhenti.
              </p>
            </details>
          </section>
          {
            <section className="admin-panel logistics-action-panel">
              <fieldset disabled={!!error}>
                <OperationalIssues
                  driverView
                  reference={trip.closedAt || trip.cancelledAt ? undefined : { routeId: trip.id }}
                  issues={tripIssues}
                  people={[user]}
                  onChanged={refresh}
                />
              </fieldset>
            </section>
          }
        </>
      )}
      {modal && modal.stops?.length > 1 ? (
        <SharedVisitModal
          stops={modal.stops}
          type={modal.type}
          primaryStopId={modal.primaryStopId}
          policy={trip?.policySnapshot?.values}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      ) : (
        modal && (
          <DriverAttendanceModal
            policy={trip?.policySnapshot?.values}
            stop={modal.stop}
            type={modal.type}
            onClose={() => setModal(null)}
            onSubmitAttendance={save}
          />
        )
      )}
      {serviceModal && trip?.vehicle && (
        <RecordMaintenanceModal
          vehicle={trip.vehicle}
          onClose={() => setServiceModal(false)}
          onSuccess={() => {
            setServiceModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
