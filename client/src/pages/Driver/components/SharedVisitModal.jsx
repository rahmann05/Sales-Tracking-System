import React, { useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { GuardedDialog } from '../../../shared/components/common/GuardedDialog';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { DeliveryReceiptInput } from './DeliveryReceiptInput';
import { useDriverEvidenceDraft } from '../useDriverEvidenceDraft';
import { deliveryReceiptError } from '../../../../../shared/delivery-receipt.mjs';
import { processPolicyValues } from '../../../../../shared/process-policy.mjs';
import { outletOperationalPoint } from '../../../../../shared/outlet-location.mjs';
import {
  DRIVER_REJECT_REASON_PRESETS,
  stopDestinationOutlet,
  validatePartialReject,
} from '../../../../../shared/driver-workspace.mjs';
export function SharedVisitModal({
  stops,
  primaryStopId,
  type,
  policy = {},
  onClose,
  onSubmit,
}) {
  const first = stops[0],
    point = outletOperationalPoint(stopDestinationOutlet(first)),
    { settings: runtime } = useApp(),
    settings = processPolicyValues(Object.keys(policy).length ? { values: policy } : null, runtime),
    errorRef = useRef(null),
    draft = useDriverEvidenceDraft(first, `shared-${type}`, onSubmit, onClose);
  const values = draft.value,
    results = values.sharedResults || {},
    arrival = type === 'absen_in',
    logical = !arrival && settings.DELIVERY_ATTENDANCE_MODE !== 'IN_OUT',
    targetId = primaryStopId || first.id,
    defaultStatus = (stop) =>
      type === 'rejected' && stop.id === targetId ? 'REJECTED' : 'DELIVERED',
    hasAccepted = stops.some((stop) => (results[stop.id]?.status || defaultStatus(stop)) !== 'REJECTED');
  const setResult = (id, patch) =>
    draft.setValue((current) => ({
      ...current,
      sharedResults: {
        ...current.sharedResults,
        [id]: { ...current.sharedResults?.[id], ...patch },
      },
    }));
  const failValidation = (message) => {
    draft.setError(message);
    queueMicrotask(() => errorRef.current?.focus());
  };
  const save = async (event) => {
    event.preventDefault();
    if (values.pending) {
      await draft.send(values.pending);
      return;
    }
    if (settings.DELIVERY_REQUIRE_PHOTO !== false && !values.photo) {
      failValidation('Foto kunjungan wajib diambil.');
      return;
    }
    if (
      !logical &&
      settings.DELIVERY_REQUIRE_GPS !== false &&
      (!Number.isFinite(values.gps?.lat) || !Number.isFinite(values.gps?.lng))
    ) {
      failValidation('Ambil bukti dengan GPS aktif.');
      return;
    }
    const rows = [];
    for (const stop of stops) {
      const row = results[stop.id] || {},
        status = row.status || defaultStatus(stop),
        invoices = stop.allocatedInvoices || [],
        items = stop.allocatedItems || [],
        rejectedCartons =
          status === 'REJECTED'
            ? stop.allocatedCartons
            : status === 'DELIVERED'
              ? 0
              : Number(row.cartons),
        rejectedItemsList = Object.entries(row.items || {})
          .filter(([, q]) => Number(q) > 0)
          .map(([lineId, q]) => ({ lineId, quantity: Number(q) })),
        invoiceMap =
          status === 'PARTIAL_REJECT' && invoices.length === 1
            ? { [invoices[0].invoiceId]: Number(row.cartons) || 0 }
            : row.invoices || {},
        rejectedInvoicesList = Object.entries(invoiceMap)
          .filter(([, q]) => Number(q) > 0)
          .map(([invoiceId, q]) => ({ invoiceId, cartons: Number(q) }));
      const receipt =
        !arrival && status !== 'REJECTED'
          ? {
              recipientName:
                settings.DELIVERY_RECIPIENT_MODE === 'DISABLED' ? undefined : values.recipientName,
              signatureDataUrl:
                settings.DELIVERY_SIGNATURE_MODE === 'DISABLED'
                  ? undefined
                  : values.signatureDataUrl,
            }
          : {};
      if (!arrival) {
        if (status !== 'REJECTED') {
          const receiptError = deliveryReceiptError(status, receipt, settings);
          if (receiptError) {
            failValidation(receiptError);
            return;
          }
        }
        if (status !== 'DELIVERED' && !row.reason?.trim()) {
          failValidation(`Isi alasan untuk ${stop.packingList?.code}.`);
          return;
        }
        if (status === 'PARTIAL_REJECT') {
          const partialError = validatePartialReject({
            allocatedCartons: stop.allocatedCartons,
            allocatedItems: items,
            allocatedInvoices: invoices,
            rejectedCartons,
            rejectedItems: rejectedItemsList,
            rejectedInvoices: rejectedInvoicesList,
          });
          if (partialError) {
            failValidation(`${stop.packingList?.code}: ${partialError}`);
            return;
          }
        }
      }
      rows.push({
        id: stop.id,
        ...(!arrival
          ? {
              result: {
                ...receipt,
                status,
                rejectReason: (row.reason || '').trim(),
                rejectedCartons,
                rejectedItems: status === 'PARTIAL_REJECT' ? rejectedItemsList : [],
                rejectedInvoices: status === 'PARTIAL_REJECT' ? rejectedInvoicesList : [],
              },
            }
          : {}),
      });
    }
    await draft.send({
      sharedVisit: true,
      type: arrival ? 'IN' : 'OUT',
      logicalResult: logical,
      stops: rows,
      latitude: values.gps?.lat,
      longitude: values.gps?.lng,
      accuracy: values.gps?.accuracy,
      observedAt: values.gps?.observedAt,
      photoUrl: values.photo || undefined,
      notes: values.notes,
    });
  };
  return (
    <GuardedDialog
      open
      title={arrival ? 'Kedatangan di toko' : 'Hasil pengiriman di toko'}
      dirty={draft.dirty}
      busy={draft.busy}
      onClose={onClose}
      className="logistics-dialog"
    >
      <form className="p-5 space-y-4" noValidate onSubmit={save}>
        <div className="work-step-intro">
          <strong>
            {first.outlet?.name} · {stops.length} dokumen
          </strong>
          Satu bukti kunjungan digunakan untuk dokumen yang ditampilkan di bawah. Hasil dan jumlah
          masing-masing dokumen tetap terpisah.
        </div>
        {draft.restored && <p role="status">{draft.restoreMessage}</p>}
        {draft.storageError && <p role="alert">{draft.storageError}</p>}
        {values.pending && (
          <p role="status">
            Permintaan belum dikonfirmasi. Kirim ulang bukti yang sama atau{' '}
            <button type="button" className="admin-button" onClick={draft.edit}>
              Periksa sebelum mengubah
            </button>
            .
          </p>
        )}
        <fieldset disabled={draft.busy || !!values.pending} className="space-y-4">
          <DeviceCameraCapture
            policyValues={settings}
            photoRequired={settings.DELIVERY_REQUIRE_PHOTO !== false}
            capturedPhoto={values.photo}
            onCapture={(photo, gps) => draft.setValue((current) => ({ ...current, photo, gps }))}
            onRetake={() => draft.setValue((current) => ({ ...current, photo: null, gps: null }))}
            requireGps={!logical && settings.DELIVERY_REQUIRE_GPS !== false}
            onLocationChange={
              settings.DELIVERY_REQUIRE_PHOTO === false ? draft.field('gps') : undefined
            }
            enforceGeofence={false}
            targetLat={!logical && settings.DELIVERY_REQUIRE_GEOFENCE ? point.latitude : null}
            targetLng={!logical && settings.DELIVERY_REQUIRE_GEOFENCE ? point.longitude : null}
            maxRadiusMeters={first.outlet?.radiusMeters || settings.ATTENDANCE_RADIUS_METERS}
            facingModeDefault="environment"
          />
          {stops.map((stop) => {
            const row = results[stop.id] || {},
              status = row.status || defaultStatus(stop),
              items = stop.allocatedItems || [],
              invoices = stop.allocatedInvoices || [],
              invoiceSum = invoices.reduce(
                (sum, inv) => sum + Math.max(0, Number(row.invoices?.[inv.invoiceId] || 0)),
                0
              );
            return (
              <section className="work-target-card space-y-3" key={stop.id}>
                <strong>
                  {stop.packingList?.code} · {stop.allocatedCartons} karton
                </strong>
                {arrival ? (
                  <p>Kedatangan dicatat untuk dokumen ini.</p>
                ) : (
                  <>
                    <fieldset className="space-y-1.5">
                      <legend className="text-xs font-semibold">Hasil dokumen</legend>
                      <div className="flex flex-wrap gap-3">
                        <label className="inline-flex items-center gap-2 min-h-11 cursor-pointer">
                          <input
                            type="radio"
                            name={`shared-status-${stop.id}`}
                            checked={status === 'DELIVERED'}
                            onChange={() => setResult(stop.id, { status: 'DELIVERED' })}
                          />
                          <span>Diterima penuh</span>
                        </label>
                        <label className="inline-flex items-center gap-2 min-h-11 cursor-pointer">
                          <input
                            type="radio"
                            name={`shared-status-${stop.id}`}
                            checked={status === 'REJECTED'}
                            onChange={() => setResult(stop.id, { status: 'REJECTED' })}
                          />
                          <span>Ditolak penuh</span>
                        </label>
                        {stop.allocatedCartons > 1 && (
                          <label className="inline-flex items-center gap-2 min-h-11 cursor-pointer">
                            <input
                              type="radio"
                              name={`shared-status-${stop.id}`}
                              checked={status === 'PARTIAL_REJECT'}
                              onChange={() =>
                                setResult(stop.id, {
                                  status: 'PARTIAL_REJECT',
                                  cartons:
                                    Number(row.cartons) > 0 &&
                                    Number(row.cartons) < stop.allocatedCartons
                                      ? row.cartons
                                      : 1,
                                })
                              }
                            />
                            <span>Diterima sebagian</span>
                          </label>
                        )}
                      </div>
                    </fieldset>
                    {status !== 'DELIVERED' && (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {DRIVER_REJECT_REASON_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface-container hover:bg-surface-variant cursor-pointer"
                              onClick={() => setResult(stop.id, { reason: preset })}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        <label className="block">
                          Alasan *
                          <textarea
                            required
                            maxLength={2000}
                            className="form-input block w-full"
                            value={row.reason || ''}
                            onChange={(e) => setResult(stop.id, { reason: e.target.value })}
                          />
                        </label>
                      </div>
                    )}
                    {status === 'PARTIAL_REJECT' && (
                      <>
                        <label>
                          Karton ditolak (1 s.d. {stop.allocatedCartons - 1})
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max={stop.allocatedCartons - 1}
                            required
                            className="form-input block w-full"
                            value={row.cartons || ''}
                            onChange={(e) => setResult(stop.id, { cartons: e.target.value })}
                          />
                        </label>
                        {items.map((item) => (
                          <label className="block" key={item.lineId}>
                            {stop.packingList?.items?.find((line) => line.lineId === item.lineId)
                              ?.name || item.lineId}{' '}
                            · Jumlah ditolak (maks. {item.quantity})
                            <input
                              className="form-input block w-full"
                              type="number"
                              step="1"
                              min="0"
                              max={item.quantity}
                              value={row.items?.[item.lineId] || 0}
                              onChange={(e) =>
                                setResult(stop.id, {
                                  items: { ...row.items, [item.lineId]: e.target.value },
                                })
                              }
                            />
                          </label>
                        ))}
                        {invoices.length === 1 ? (
                          <p className="text-xs text-on-surface-variant">
                            Faktur{' '}
                            <strong>
                              {stop.packingList?.invoices?.find(
                                (v) => v.id === invoices[0].invoiceId
                              )?.invoiceNumber || invoices[0].invoiceId}
                            </strong>
                            : otomatis {Number(row.cartons) || 0} karton ditolak.
                          </p>
                        ) : (
                          invoices.length > 1 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-on-surface-variant">
                                Total faktur ditolak: {invoiceSum} / {Number(row.cartons) || 0}{' '}
                                karton
                              </p>
                              {invoices.map((invoice) => (
                                <label className="block" key={invoice.invoiceId}>
                                  Karton ditolak faktur{' '}
                                  {stop.packingList?.invoices?.find(
                                    (item) => item.id === invoice.invoiceId
                                  )?.invoiceNumber || invoice.invoiceId}{' '}
                                  (maks. {invoice.cartons})
                                  <input
                                    className="form-input block w-full"
                                    type="number"
                                    step="1"
                                    min="0"
                                    max={invoice.cartons}
                                    value={row.invoices?.[invoice.invoiceId] || 0}
                                    onChange={(e) =>
                                      setResult(stop.id, {
                                        invoices: {
                                          ...row.invoices,
                                          [invoice.invoiceId]: e.target.value,
                                        },
                                      })
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          )
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
            );
          })}
          {!arrival && hasAccepted && (
            <DeliveryReceiptInput
              policy={settings}
              name={values.recipientName}
              signature={values.signatureDataUrl}
              onName={draft.field('recipientName')}
              onSignature={draft.field('signatureDataUrl')}
            />
          )}
          <label className="block">
            Catatan tambahan (opsional)
            <textarea
              className="form-input block w-full"
              value={values.notes}
              onChange={(e) => draft.field('notes')(e.target.value)}
            />
          </label>
        </fieldset>
        {draft.error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="admin-feedback error">
            {draft.error}
          </p>
        )}
        <button className="admin-button primary w-full" disabled={draft.busy}>
          {draft.busy
            ? 'Menyimpan…'
            : values.pending
              ? 'Kirim ulang bukti yang sama'
              : arrival
                ? 'Simpan kedatangan untuk semua dokumen'
                : 'Simpan hasil semua dokumen'}
        </button>
      </form>
    </GuardedDialog>
  );
}
