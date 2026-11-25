import { useOperationRequest } from '../../../shared/hooks/useOperationRequest';
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { LuArrowUp, LuArrowDown, LuX, LuSearch } from 'react-icons/lu';
import { deliveryApi, vehiclesApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { PackingAllocationFields } from './PackingAllocationFields';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import {
  DEFAULT_DELIVERY_DEPOTS,
  parseDeliveryDepots,
} from '../../../../../shared/delivery-depots.mjs';
import {
  destinationPacking,
  isVehicleLoad,
  loadLogistics,
  capacityGuidance,
} from '../../../../../shared/packing-load.mjs';
import { packingBalance } from '../../../../../shared/packing.mjs';
import { useCodeMissing } from '../../../shared/hooks/useCodeMissing';
import { scheduleWindow } from '../../../../../shared/delivery-operations.mjs';
const DestinationMap = lazy(() =>
  import('./PlanningDestinationMap').then((module) => ({ default: module.PlanningDestinationMap }))
);
const entryFor = (pl) => ({
  packingDestinationId: pl.destinationId || undefined,
  loadPlanVersion: pl.loadPlanVersion,
  packingListId: pl.id,
  outletId: pl.outletId,
  outletName: pl.outlet?.name || 'Toko',
  code: pl.code,
  point: pl.destinationPoint,
  totalWeight:
    pl.totalWeight == null ? null : (pl.totalWeight * pl.remainingCartons) / pl.totalCartons,
  totalCartons: pl.remainingCartons,
  remainingCartons: pl.remainingCartons,
  invoices: (pl.remainingInvoices || [])
    .filter((i) => i.remaining > 0)
    .map((i) => ({ ...i, cartons: i.remaining })),
  items: (pl.remainingItems || [])
    .filter((i) => i.remaining > 0)
    .map((i) => ({ ...i, quantity: i.remaining })),
});
const entriesFor = (pl) =>
  isVehicleLoad(pl)
    ? pl.destinations
        .map((destination) =>
          entryFor({
            ...packingBalance(destinationPacking(pl, destination.id)),
            destinationId: destination.id,
            destinationPoint: destination.point,
          })
        )
        .filter((entry) => entry.remainingCartons > 0)
    : [entryFor(pl)];
const entryKey = (entry) => `${entry.packingListId}:${entry.packingDestinationId || ''}`;
// Rule DELIVERY_ALLOW_UNVERIFIED_DESTINATION: a load without a valid outlet point may still be
// scheduled; it is flagged instead of blocked. Conflicting order points always need Admin.
const ready = (pl, allowUnverified = false) =>
  isVehicleLoad(pl)
    ? allowUnverified || pl.destinations?.every((destination) => !!destination.point)
    : !pl.destinationConflict && (allowUnverified || !!pl.destinationPoint);
const missingPoint = (pl) =>
  isVehicleLoad(pl)
    ? pl.destinations?.some((destination) => !destination.point)
    : !pl.destinationPoint;
const wibClock = (value) =>
  new Date(value).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  });
// Same rule the server applies when saving a trip, so a clash is visible before submitting.
function clashWith(openRoutes, key, id, start, end) {
  if (!id || !Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) return null;
  return (
    openRoutes.find((route) => {
      if (route[key] !== id) return false;
      const window = scheduleWindow(route);
      return (
        (!route.returnedAt &&
          (route.departedAt || ['IN_TRANSIT', 'COMPLETED', 'PARTIAL'].includes(route.status))) ||
        (start < window.end && end > window.start)
      );
    }) || null
  );
}
const clashText = (route) => {
  const window = scheduleWindow(route);
  return route.departedAt && !route.returnedAt
    ? `sedang bertugas pada ${route.code}`
    : `dipakai ${route.code} pukul ${wibClock(window.start)}–${wibClock(window.end)} WIB`;
};
const vehicleReasonPresets = [
  'Armada saran sedang dalam perbaikan / bertugas lain',
  'Menyesuaikan kapasitas muatan aktual perjalanan',
  'Penyesuaian akses jalan menuju toko tujuan',
];

const capacityReasonPresets = [
  'Karton ringan namun bervolume aman di kendaraan',
  'Penataan muatan aman disetujui Kepala Gudang',
  'Rute jarak dekat sesuai kondisi armada',
];

export function CreateRouteForm({ onCreated, onCancel, initialPackingIds = [] }) {
  const operation = useOperationRequest('delivery-route');
  const { settings, user, setActiveTab } = useApp(),
    feature = useFeaturePolicy('DELIVERY'),
    depots = parseDeliveryDepots(settings.DELIVERY_DEPOT_LOCATIONS || DEFAULT_DELIVERY_DEPOTS);
  const allowUnverified = settings.DELIVERY_ALLOW_UNVERIFIED_DESTINATION === true;
  const [code, setCode] = useState('');
  const codeMissing = useCodeMissing('DELIVERY_ROUTE', code);
  const [date, setDate] = useState(wibDateKey),
    [startTime, setStartTime] = useState('08:00'),
    [endTime, setEndTime] = useState('17:00'),
    [departure, setDeparture] = useState(depots[0].id),
    [returnId, setReturnId] = useState(depots[0].id),
    [vehicleId, setVehicleId] = useState(''),
    [driverId, setDriverId] = useState(''),
    [notes, setNotes] = useState(''),
    [capacityReason, setCapacityReason] = useState(''),
    [vehicleReason, setVehicleReason] = useState('');
  const [openRoutes, setOpenRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]),
    [drivers, setDrivers] = useState([]),
    [packings, setPackings] = useState([]),
    [entries, setEntries] = useState([]),
    [query, setQuery] = useState(''),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const snapshot = JSON.stringify([
      code,
      date,
      startTime,
      endTime,
      departure,
      returnId,
      vehicleId,
      driverId,
      notes,
      entries,
      capacityReason,
      vehicleReason,
    ]),
    initial = useRef(snapshot);
  useUnsavedNavigation(snapshot !== initial.current, busy);
  const ids = initialPackingIds.join(',');
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [v, d] = await Promise.all([vehiclesApi.getAll(), deliveryApi.getDrivers()]);
        const documents = [];
        let page = 1,
          total = Infinity;
        while (documents.length < total) {
          const r = await deliveryApi.getPackingLists({ status: 'RELEASED', page, limit: 100 });
          if (!r.data.items.length) break;
          documents.push(...r.data.items);
          total = r.data.total;
          page++;
        }
        const open = [];
        for (let routePage = 1, routeTotal = Infinity; open.length < routeTotal; routePage++) {
          const r = await deliveryApi.getDeliveryRoutes({
            open: 'true',
            page: routePage,
            limit: 100,
          });
          const items = r.data?.items || [];
          if (!items.length) break;
          open.push(...items);
          routeTotal = r.data.total;
        }
        if (!active) return;
        setOpenRoutes(open);
        const driverList = d.data || [];
        setVehicles(v.data || []);
        setDrivers(driverList);
        setPackings(documents);
        // Rule DELIVERY_AUTO_SELECT_LOADS: loads handed over by Admin start selected. A vehicle
        // load must travel alone, so ordinary loads win and otherwise only the first one is taken.
        const readyDocs = documents.filter(
            (pl) => pl.remainingCartons > 0 && ready(pl, allowUnverified)
          ),
          ordinaryDocs = readyDocs.filter((pl) => !isVehicleLoad(pl)),
          autoDocs = ordinaryDocs.length ? ordinaryDocs : readyDocs.slice(0, 1);
        const selectedDocs = initialPackingIds.length
          ? documents.filter(
              (pl) =>
                initialPackingIds.includes(pl.id) &&
                pl.remainingCartons > 0 &&
                ready(pl, allowUnverified)
            )
          : settings.DELIVERY_AUTO_SELECT_LOADS === true
            ? autoDocs
            : [];
        const selected = selectedDocs.flatMap(entriesFor);
        const suggested = selectedDocs.length === 1 ? selectedDocs[0].suggestedVehicleId || '' : '';
        const defaultDriver = !driverId && driverList.length === 1 ? driverList[0].id : driverId;
        initial.current = JSON.stringify([
          code,
          date,
          startTime,
          endTime,
          departure,
          returnId,
          suggested,
          defaultDriver,
          notes,
          selected,
          capacityReason,
          vehicleReason,
        ]);
        setEntries(selected);
        setVehicleId(suggested);
        if (defaultDriver !== driverId) setDriverId(defaultDriver);
        if (selectedDocs.some(isVehicleLoad) && selectedDocs.length > 1)
          setError(
            'Satu muatan kendaraan harus dijadwalkan sendiri. Hapus packing list lain dari pilihan.'
          );
        else if (initialPackingIds.length && selectedDocs.length !== initialPackingIds.length)
          setError(
            'Sebagian dokumen terpilih sudah dijadwalkan atau titiknya perlu diperiksa. Periksa pilihan sebelum menyimpan.'
          );
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [ids]);
  const planStart = new Date(`${date}T${startTime || '00:00'}:00+07:00`),
    planEnd = new Date(`${date}T${endTime || '00:00'}:00+07:00`);
  const vehicleClash = clashWith(openRoutes, 'vehicleId', vehicleId, planStart, planEnd),
    driverClash = clashWith(openRoutes, 'driverId', driverId, planStart, planEnd);
  const cartons = entries.reduce((sum, entry) => sum + entry.totalCartons, 0),
    vehicle = vehicles.find((row) => row.id === vehicleId);
  const loadSummary = loadLogistics({
      loadPlanVersion: 2,
      destinations: entries.map((entry) => ({
        outletId: entry.outletId,
        totalCartons: entry.totalCartons,
        totalWeight:
          entry.totalWeight == null
            ? null
            : (entry.totalWeight * entry.totalCartons) / entry.remainingCartons,
      })),
      items: entries.flatMap((entry) => entry.items),
    }),
    guidance = capacityGuidance(loadSummary, vehicle),
    over = guidance.overCartons || guidance.overWeight;
  const selectedDocs = packings.filter((pl) =>
      entries.some((entry) => entry.packingListId === pl.id)
    ),
    suggestedVehicleId = selectedDocs.find((pl) => pl.suggestedVehicleId)?.suggestedVehicleId || '',
    suggestedVehicle = vehicles.find((row) => row.id === suggestedVehicleId),
    changedSuggestion = selectedDocs.some(
      (pl) => pl.suggestedVehicleId && pl.suggestedVehicleId !== vehicleId
    );
  const addPacking = (pl) => {
    if (
      isVehicleLoad(pl) &&
      entries.length &&
      !window.confirm(
        'Satu packing list ini sudah mewakili satu muatan kendaraan. Ganti pilihan muatan sebelumnya?'
      )
    )
      return;
    setEntries((current) => (isVehicleLoad(pl) ? entriesFor(pl) : [...current, ...entriesFor(pl)]));
    if (pl.suggestedVehicleId) setVehicleId(pl.suggestedVehicleId);
    setCapacityReason('');
    setVehicleReason('');
  };
  const uniqueStores = new Set(entries.map((entry) => entry.outletId)).size;
  const uniqueTargets = new Set(
    entries.map(
      (entry) =>
        `${entry.outletId}:${entry.point?.latitude?.toFixed(6)}:${entry.point?.longitude?.toFixed(6)}`
    )
  ).size;
  const available = packings.filter(
    (pl) =>
      pl.remainingCartons > 0 &&
      !entries.some((entry) => entry.packingListId === pl.id) &&
      `${pl.code || ''} ${pl.outlet?.name || ''} ${(pl.destinations || []).map((row) => row?.outlet?.name || '').join(' ')}`
        .toLocaleLowerCase('id-ID')
        .includes(query.toLocaleLowerCase('id-ID'))
  );
  const move = (index, direction) =>
    setEntries((current) => {
      const updated = [...current],
        target = index + direction;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  const cancel = () => {
    if (
      !busy &&
      (snapshot === initial.current ||
        window.confirm('Perubahan perjalanan belum disimpan. Batalkan perubahan?'))
    )
      onCancel();
  };
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (codeMissing) {
      setError('Nomor perjalanan wajib diisi karena pengkodean manual aktif.');
      return;
    }
    if (vehicleClash || driverClash) {
      setError(
        vehicleClash
          ? `Kendaraan ${clashText(vehicleClash)}. Pilih kendaraan atau jam lain.`
          : `Supir ${clashText(driverClash)}. Pilih supir atau jam lain.`
      );
      return;
    }
    if (!vehicle?.photoUrl) {
      setError('Set foto kendaraan di Kendaraan & servis sebelum digunakan.');
      return;
    }
    if (over && !capacityReason.trim()) {
      setError('Isi alasan persetujuan bila perkiraan melampaui patokan kapasitas.');
      return;
    }
    if (changedSuggestion && !vehicleReason.trim()) {
      setError('Isi alasan mengganti saran kendaraan Admin.');
      return;
    }
    if (endTime <= startTime) {
      setError('Target kembali harus setelah waktu berangkat.');
      return;
    }
    setBusy(true);
    try {
      const response = await deliveryApi.createDeliveryRoute(
        await operation.identify({
          code,
          date,
          vehicleId,
          driverId,
          departureDepotId: departure,
          returnDepotId: returnId,
          plannedStartAt: new Date(`${date}T${startTime}:00+07:00`).toISOString(),
          plannedEndAt: new Date(`${date}T${endTime}:00+07:00`).toISOString(),
          notes,
          capacityOverrideReason: capacityReason,
          vehicleDecisionReason: vehicleReason,
          stops: entries.map((entry, index) => ({
            packingListId: entry.packingListId,
            packingDestinationId: entry.packingDestinationId,
            outletId: entry.outletId,
            sequence: index + 1,
            allocatedCartons: entry.totalCartons,
            allocatedItems: entry.items
              .filter((i) => i.quantity > 0)
              .map((i) => ({ lineId: i.lineId, quantity: i.quantity })),
            allocatedInvoices: entry.invoices
              .filter((i) => i.cartons > 0)
              .map((i) => ({ invoiceId: i.id, cartons: i.cartons })),
          })),
        })
      );
      operation.clear();
      initial.current = snapshot;
      onCreated(response.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="admin-panel p-5 space-y-5">
      <div className="work-step-intro">
        <strong>Susun perjalanan pengiriman</strong>Pilih muatan, kendaraan dan supir, lalu urutkan
        toko. Setelah rencana tersimpan, lanjutkan pemeriksaan dan serah terima muatan.
      </div>
      {error && (
        <p ref={errorRef} tabIndex={-1} className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      {loading && <p role="status">Memuat muatan dan armada…</p>}
      <fieldset disabled={loading || busy} className="work-route-layout">
        <div className="space-y-5">
          <section className="space-y-3">
            <h2 className="font-semibold text-lg">1. Muatan dari Admin</h2>
            <label className="admin-search">
              <LuSearch />
              <input
                type="search"
                aria-label="Cari muatan dari Admin"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari toko atau nomor dokumen…"
              />
            </label>
            <div className="space-y-2">
              {available.map((pl) => (
                <div className="work-target-card" key={pl.id}>
                  <div>
                    <strong>
                      {isVehicleLoad(pl)
                        ? `${pl.destinations.length} tujuan dalam satu muatan`
                        : pl.outlet?.name}
                    </strong>
                    <p className="admin-footnote">
                      {pl.code} · {pl.remainingCartons} karton belum dijadwalkan
                    </p>
                  </div>
                  {pl.destinationConflict ? (
                    <p role="status" className="text-amber-700">
                      Titik pada order sumber berbeda. Minta Admin memeriksa tujuan.
                    </p>
                  ) : !ready(pl, allowUnverified) ? (
                    <p role="status" className="work-clash">
                      Titik tujuan belum tersedia. Minta Admin melengkapi lokasi.
                    </p>
                  ) : (
                    <>
                      {missingPoint(pl) && (
                        <p role="status" className="admin-footnote">
                          Titik outlet tidak valid. Pengiriman tetap bisa dijalankan dan ditandai
                          peringatan.
                        </p>
                      )}
                      <button
                        type="button"
                        className="admin-button"
                        disabled={
                          entries.some((entry) => entry.loadPlanVersion === 2) && !isVehicleLoad(pl)
                        }
                        onClick={() => addPacking(pl)}
                      >
                        Tambahkan muatan
                      </button>
                    </>
                  )}
                </div>
              ))}
              {!loading && !available.length && (
                <div className="admin-empty space-y-2">
                  <p>
                    {query
                      ? 'Tidak ada muatan yang cocok. Ubah pencarian.'
                      : entries.length
                        ? 'Seluruh muatan yang tersedia sudah dipilih.'
                        : 'Belum ada dokumen muatan yang menunggu dijadwalkan. Admin perlu menyerahkan dokumen lengkap terlebih dahulu.'}
                  </p>
                  {!query && !entries.length && (
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => {
                        if (
                          window.dispatchEvent(
                            new CustomEvent('app:before-navigate', { cancelable: true })
                          )
                        )
                          setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST);
                      }}
                    >
                      Buka Packing List
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold text-lg">2. Urutan toko dan dokumen</h2>
            {!entries.length && <p>Pilih muatan di atas untuk menyusun tujuan.</p>}
            {entries.map((entry, index) => (
              <article key={entryKey(entry)} className="work-target-card">
                <div className="flex justify-between gap-3">
                  <div>
                    <strong>
                      {index + 1}. {entry.outletName}
                    </strong>
                    <p>
                      {entry.code} · {entry.totalCartons} karton
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="admin-button"
                      type="button"
                      aria-label={`Naikkan ${entry.outletName}`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <LuArrowUp />
                    </button>
                    <button
                      className="admin-button"
                      type="button"
                      aria-label={`Turunkan ${entry.outletName}`}
                      disabled={index === entries.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <LuArrowDown />
                    </button>
                    <button
                      className="admin-button"
                      type="button"
                      aria-label={`Hapus muatan ${entry.code}`}
                      onClick={() =>
                        setEntries((current) =>
                          current.filter((row) => row.packingListId !== entry.packingListId)
                        )
                      }
                    >
                      <LuX />
                    </button>
                  </div>
                </div>
                {!entry.point && (
                  <p role="status" className="admin-footnote">
                    Titik outlet tidak valid. Pengiriman tetap berjalan dan ditandai peringatan.
                  </p>
                )}
                {entry.point && (
                  <a
                    className="admin-table-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${entry.point.latitude},${entry.point.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.point.latitude.toFixed(6)}, {entry.point.longitude.toFixed(6)} · Google
                    Maps
                  </a>
                )}
                <details>
                  <summary className="min-h-11 cursor-pointer">
                    {settings.PACKING_ALLOW_SPLIT === true && entry.loadPlanVersion !== 2
                      ? 'Rincian / bagi muatan ke beberapa perjalanan'
                      : 'Lihat rincian barang dan faktur'}
                  </summary>
                  <PackingAllocationFields
                    entry={entry}
                    allowSplit={
                      settings.PACKING_ALLOW_SPLIT === true && entry.loadPlanVersion !== 2
                    }
                    onChange={(updated) =>
                      setEntries((current) =>
                        current.map((row) => (entryKey(row) === entryKey(updated) ? updated : row))
                      )
                    }
                  />
                  <p className="admin-footnote">
                    Packing list muatan kendaraan membawa seluruh tujuan yang belum dijadwalkan
                    dalam satu perjalanan. Jumlah barang, karton, dan faktur harus sesuai.
                  </p>
                </details>
              </article>
            ))}
          </section>
          {entries.length > 0 && (
            <Suspense fallback={<p>Memuat peta tujuan…</p>}>
              <DestinationMap
                entries={entries}
                departure={depots.find((point) => point.id === departure)}
                returnPoint={depots.find((point) => point.id === returnId)}
              />
            </Suspense>
          )}
        </div>
        <aside className="work-route-summary">
          <h2 className="font-semibold text-lg">3. Armada dan jadwal</h2>
          <p>
            <strong>{cartons} karton</strong> · {uniqueStores} toko · {uniqueTargets} titik tujuan ·{' '}
            {new Set(entries.map((entry) => entry.packingListId)).size} packing list
          </p>
          <label className="block">
            Kendaraan
            <select
              className="form-input block w-full"
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Pilih kendaraan</option>
              {vehicles
                .filter((v) => v.isActive && v.condition === 'AVAILABLE')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} · {v.name} · Patokan{' '}
                    {v.maxCartons > 0 ? `${v.maxCartons} karton` : 'belum diisi'}
                    {!v.photoUrl ? ' · Foto belum ada' : ''}
                    {clashWith(openRoutes, 'vehicleId', v.id, planStart, planEnd)
                      ? ' · Bentrok jadwal'
                      : ''}
                  </option>
                ))}
            </select>
          </label>
          {vehicleClash && (
            <p role="alert" className="work-clash">
              Kendaraan {clashText(vehicleClash)}. Pilih kendaraan atau jam lain.
            </p>
          )}
          {suggestedVehicle && (
            <p className="admin-footnote">
              Saran kendaraan Admin: <strong>{suggestedVehicle.code}</strong> ·{' '}
              {suggestedVehicle.name}
            </p>
          )}
          {vehicle && (
            <div>
              {vehicle.photoUrl && (
                <img
                  src={vehicle.photoUrl}
                  alt={`Kendaraan ${vehicle.code}`}
                  className="rounded-xl w-full h-36 object-cover"
                />
              )}
              <p className={over ? 'text-red-700' : 'admin-footnote'}>
                {cartons} karton /{' '}
                {vehicle.maxCartons > 0
                  ? `patokan ${vehicle.maxCartons} karton`
                  : 'patokan belum diketahui'}
                {over ? ' · Melampaui patokan' : ''}
              </p>
            </div>
          )}
          <p className="admin-footnote">
            Berat:{' '}
            {loadSummary.weightComplete
              ? `${loadSummary.knownWeightKg} kg`
              : `${loadSummary.knownWeightKg} kg diketahui; ${loadSummary.unknownWeightDestinations} tujuan belum diketahui`}
            . Kapasitas menjadi patokan, bukan kepastian volume muatan.
          </p>
          {changedSuggestion && (
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-on-surface-variant">
                Alasan cepat mengganti saran kendaraan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vehicleReasonPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface hover:bg-surface-variant cursor-pointer"
                    onClick={() => setVehicleReason(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <label className="block">
                Alasan mengganti saran kendaraan Admin
                <textarea
                  className="form-input block w-full"
                  required
                  value={vehicleReason}
                  maxLength={2000}
                  onChange={(e) => setVehicleReason(e.target.value)}
                />
              </label>
            </div>
          )}
          {over && (
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-on-surface-variant">
                Alasan cepat kapasitas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {capacityReasonPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface hover:bg-surface-variant cursor-pointer"
                    onClick={() => setCapacityReason(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <label className="block">
                Perkiraan melampaui patokan: alasan persetujuan kepala gudang
                <textarea
                  className="form-input block w-full"
                  required
                  value={capacityReason}
                  maxLength={2000}
                  onChange={(e) => setCapacityReason(e.target.value)}
                />
              </label>
            </div>
          )}
          <label className="block">
            Supir
            <select
              className="form-input block w-full"
              required
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Pilih supir</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                  {clashWith(openRoutes, 'driverId', driver.id, planStart, planEnd)
                    ? ' · Bentrok jadwal'
                    : ''}
                </option>
              ))}
            </select>
          </label>
          {driverClash && (
            <p role="alert" className="work-clash">
              Supir {clashText(driverClash)}. Pilih supir atau jam lain.
            </p>
          )}
          <label className="block">
            Tanggal
            <input
              type="date"
              required
              className="form-input block w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              Berangkat WIB
              <input
                type="time"
                required
                className="form-input block w-full"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              Target kembali WIB
              <input
                type="time"
                required
                className="form-input block w-full"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          {startTime && endTime && endTime <= startTime && (
            <p role="alert" className="text-xs text-red-700">
              Target kembali harus setelah waktu berangkat.
            </p>
          )}
          <label>
            Titik berangkat
            <select
              className="form-input block w-full"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
            >
              {depots.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Titik kembali
            <select
              className="form-input block w-full"
              value={returnId}
              onChange={(e) => setReturnId(e.target.value)}
            >
              {depots.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name}
                </option>
              ))}
            </select>
          </label>
          <p className="admin-footnote">
            Titik kembali dapat berbeda dari berangkat. GPS absen supir menjadi bukti titik aktual.
            Bentrok jadwal diperiksa saat disimpan.
          </p>
          <details open={codeMissing || undefined}>
            <summary className="min-h-11 cursor-pointer">Nomor dan catatan perjalanan</summary>
            <BusinessCodeInput entity="DELIVERY_ROUTE" value={code} onChange={setCode} />
            <label>
              Catatan (opsional)
              <textarea
                className="form-input block w-full"
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </details>
          {!vehicleId ? (
            <p role="status" className="admin-footnote">
              Pilih kendaraan untuk melanjutkan.
            </p>
          ) : (
            !vehicle?.photoUrl && (
              <div role="status" className="admin-feedback error space-y-2">
                <p>
                  Foto kendaraan belum tersedia. Lengkapi foto asli melalui Kendaraan &amp; servis
                  sebelum menyimpan perjalanan.
                </p>
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => {
                    if (
                      window.dispatchEvent(
                        new CustomEvent('app:before-navigate', { cancelable: true })
                      )
                    )
                      setActiveTab(
                        user?.role === 'KEPALA_GUDANG'
                          ? TAB_IDS.WAREHOUSE_VEHICLES
                          : TAB_IDS.ADMIN_VEHICLES
                      );
                  }}
                >
                  Buka Kendaraan &amp; servis
                </button>
              </div>
            )
          )}
          {!driverId && (
            <p role="status" className="admin-footnote">
              Pilih Supir yang akan menerima tugas perjalanan.
            </p>
          )}
          <button
            type="submit"
            className="admin-button primary"
            title={feature.reason}
            disabled={
              !feature.canStart ||
              !entries.length ||
              !vehicle?.photoUrl ||
              !driverId ||
              Boolean(vehicleClash || driverClash) ||
              (Boolean(startTime && endTime) && endTime <= startTime) ||
              (over && !capacityReason.trim()) ||
              (changedSuggestion && !vehicleReason.trim())
            }
          >
            {busy ? 'Menyimpan…' : 'Setujui muatan & simpan perjalanan'}
          </button>
          <button type="button" className="admin-button" onClick={cancel}>
            Batal
          </button>
        </aside>
      </fieldset>
    </form>
  );
}
