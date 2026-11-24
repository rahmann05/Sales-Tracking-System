import { deliveryReceiptError } from '../../../../../shared/delivery-receipt.mjs';
import { DeliveryReceiptInput } from './DeliveryReceiptInput';
import { processPolicyValues } from '../../../../../shared/process-policy.mjs';
import { outletOperationalPoint } from '../../../../../shared/outlet-location.mjs';
import {
  DRIVER_REJECT_REASON_PRESETS,
  MISSING_CHECKOUT_REASON_PRESETS,
  stopDestinationOutlet,
  validatePartialReject,
} from '../../../../../shared/driver-workspace.mjs';
import { GuardedDialog } from '../../../shared/components/common/GuardedDialog';
import { unitDescription } from '../../../../../shared/product-units.mjs';
import React, { useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { useDriverEvidenceDraft } from '../useDriverEvidenceDraft';
export const DriverAttendanceModal = ({ stop, type, onClose, onSubmitAttendance, policy = {} }) => {
  const point = outletOperationalPoint(stopDestinationOutlet(stop));
  const { settings: runtime } = useApp();
  const settings = processPolicyValues(
    Object.keys(policy).length ? { values: policy } : null,
    runtime
  );
  const errorRef = useRef(null);
  const draft = useDriverEvidenceDraft(stop, type, onSubmitAttendance, onClose);
  const {
    recipientName,
    signatureDataUrl,
    notes,
    photo,
    gps,
    reason,
    cartons,
    rejected,
    invoiceRejected,
    withoutCheckout,
    checkoutReason,
    pending,
  } = draft.value;
  const setNotes = draft.field('notes'),
    setReason = draft.field('reason'),
    setCartons = draft.field('cartons'),
    setRejected = draft.field('rejected'),
    setInvoiceRejected = draft.field('invoiceRejected'),
    setWithoutCheckout = draft.field('withoutCheckout'),
    setCheckoutReason = draft.field('checkoutReason');
  const { busy, error, setError } = draft;
  const allowWithoutCheckout =
    type !== 'absen_in' &&
    settings.DELIVERY_ATTENDANCE_MODE === 'IN_OUT' &&
    settings.DELIVERY_ALLOW_RESULT_WITHOUT_OUT === true;
  const logicalResult =
    type !== 'absen_in' &&
    (settings.DELIVERY_ATTENDANCE_MODE !== 'IN_OUT' || (allowWithoutCheckout && withoutCheckout));
  const requireGps = !logicalResult && settings.DELIVERY_REQUIRE_GPS !== false;
  const total = stop.allocatedCartons || 0;
  const invoices = stop.allocatedInvoices || [];
  const items = stop.allocatedItems || [];
  const partial =
    type === 'rejected' &&
    total > 1 &&
    (draft.value.rejectionMode === 'PARTIAL' || (Number(cartons) > 0 && Number(cartons) < total));
  const invoiceMap =
    partial && invoices.length === 1
      ? { [invoices[0].invoiceId]: Number(cartons) || 0 }
      : invoiceRejected;
  const invoiceRejectedTotal = invoices.reduce(
    (sum, inv) => sum + Math.max(0, Number(invoiceMap[inv.invoiceId] || 0)),
    0
  );
  const failValidation = (message) => {
    setError(message);
    queueMicrotask(() => errorRef.current?.focus());
  };
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (pending) {
      await draft.send(pending);
      return;
    }
    if (requireGps && (!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng))) {
      failValidation('Ambil bukti dengan GPS aktif.');
      return;
    }
    if (settings.DELIVERY_REQUIRE_PHOTO && !photo) {
      failValidation('Foto bukti wajib diambil.');
      return;
    }
    if (withoutCheckout && checkoutReason.trim().length < 5) {
      failValidation('Isi alasan tidak tersedia bukti keluar, minimal 5 karakter.');
      return;
    }
    const resultStatus =
      type === 'delivered' ? 'DELIVERED' : partial ? 'PARTIAL_REJECT' : 'REJECTED';
    const rejectedCartonCount = resultStatus === 'REJECTED' ? total : Number(cartons);
    const rejectedItemsList = Object.entries(rejected)
      .filter(([, q]) => Number(q) > 0)
      .map(([lineId, q]) => ({ lineId, quantity: Number(q) }));
    const rejectedInvoicesList = Object.entries(invoiceMap)
      .filter(([, q]) => Number(q) > 0)
      .map(([invoiceId, q]) => ({ invoiceId, cartons: Number(q) }));
    if (type === 'rejected') {
      if (!reason.trim()) {
        failValidation('Isi alasan penolakan terlebih dahulu.');
        return;
      }
      if (resultStatus === 'PARTIAL_REJECT') {
        const partialError = validatePartialReject({
          allocatedCartons: total,
          allocatedItems: items,
          allocatedInvoices: invoices,
          rejectedCartons: rejectedCartonCount,
          rejectedItems: rejectedItemsList,
          rejectedInvoices: rejectedInvoicesList,
        });
        if (partialError) {
          failValidation(partialError);
          return;
        }
      }
    }
    const receipt =
      type !== 'absen_in' && resultStatus !== 'REJECTED'
        ? {
            recipientName:
              settings.DELIVERY_RECIPIENT_MODE === 'DISABLED' ? undefined : recipientName,
            signatureDataUrl:
              settings.DELIVERY_SIGNATURE_MODE === 'DISABLED' ? undefined : signatureDataUrl,
          }
        : {};
    const receiptError =
      type === 'absen_in' ? null : deliveryReceiptError(resultStatus, receipt, settings);
    if (receiptError) {
      failValidation(receiptError);
      return;
    }
    await draft.send({
      logicalResult,
      type: type === 'absen_in' ? 'IN' : 'OUT',
      latitude: gps?.lat,
      longitude: gps?.lng,
      accuracy: gps?.accuracy,
      observedAt: gps?.observedAt,
      photoUrl: photo || undefined,
      notes,
      ...(type === 'absen_in'
        ? {}
        : {
            result: {
              ...receipt,
              status: resultStatus,
              rejectReason: reason.trim(),
              ...(allowWithoutCheckout && withoutCheckout
                ? { missingCheckoutReason: checkoutReason.trim() }
                : {}),
              rejectedCartons: resultStatus === 'DELIVERED' ? 0 : rejectedCartonCount,
              rejectedInvoices: resultStatus === 'PARTIAL_REJECT' ? rejectedInvoicesList : [],
              rejectedItems: resultStatus === 'PARTIAL_REJECT' ? rejectedItemsList : [],
            },
          }),
    });
  };
  return (
    <GuardedDialog
      open
      title={
        type === 'absen_in'
          ? 'Bukti kedatangan'
          : type === 'rejected'
            ? 'Penolakan penuh / sebagian'
            : 'Penerimaan penuh'
      }
      onClose={onClose}
      busy={busy}
      dirty={draft.dirty}
      className="logistics-dialog"
    >
      <form className="p-5 space-y-4" noValidate onSubmit={submit}>
        {(draft.restored || draft.policyChanged) && (
          <p role="status">
            {draft.restoreMessage} Foto dan GPS mempertahankan waktu aslinya; server dapat meminta
            pengambilan ulang.
          </p>
        )}
        {draft.storageError && (
          <p role="alert" className="app-error">
            {draft.storageError}
          </p>
        )}
        {pending && (
          <p role="status">
            Permintaan belum dikonfirmasi. Kirim ulang isian yang sama atau{' '}
            <button type="button" className="app-button" disabled={busy} onClick={draft.edit}>
              Periksa hasil sebelum mengubah
            </button>
            .
          </p>
        )}
        <fieldset disabled={busy || !!pending} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">
              {type === 'absen_in' ? 'Kedatangan' : 'Hasil pengiriman'} · {stop.outlet?.name}
            </h3>
          </div>
          <p className="text-sm">
            {stop.packingList?.code} · Muatan {total} karton
          </p>
          <DeviceCameraCapture
            policyValues={settings}
            photoRequired={settings.DELIVERY_REQUIRE_PHOTO !== false}
            capturedPhoto={photo}
            onCapture={(p, g) => draft.setValue((prev) => ({ ...prev, photo: p, gps: g }))}
            onRetake={() => draft.setValue((prev) => ({ ...prev, photo: null, gps: null }))}
            requireGps={requireGps}
            onLocationChange={settings.DELIVERY_REQUIRE_PHOTO ? undefined : draft.field('gps')}
            enforceGeofence={false}
            targetLat={!logicalResult && settings.DELIVERY_REQUIRE_GEOFENCE ? point.latitude : null}
            targetLng={
              !logicalResult && settings.DELIVERY_REQUIRE_GEOFENCE ? point.longitude : null
            }
            maxRadiusMeters={stop.outlet?.radiusMeters || settings.ATTENDANCE_RADIUS_METERS}
            facingModeDefault="environment"
          />
          {type === 'rejected' && (
            <>
              {total > 1 && (
                <fieldset className="space-y-2 rounded-xl border border-border-glass p-3">
                  <legend className="text-xs font-bold px-1">Jenis penolakan</legend>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 min-h-11 cursor-pointer">
                      <input
                        type="radio"
                        name="driverRejectionMode"
                        checked={!partial}
                        onChange={() =>
                          draft.setValue((prev) => ({
                            ...prev,
                            rejectionMode: 'FULL',
                            cartons: total,
                          }))
                        }
                      />
                      <span>Ditolak penuh ({total} karton)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 min-h-11 cursor-pointer">
                      <input
                        type="radio"
                        name="driverRejectionMode"
                        checked={partial}
                        onChange={() =>
                          draft.setValue((prev) => {
                            const nextCartons =
                              Number(prev.cartons) > 0 && Number(prev.cartons) < total
                                ? Number(prev.cartons)
                                : 1;
                            return {
                              ...prev,
                              rejectionMode: 'PARTIAL',
                              cartons: nextCartons,
                              ...(invoices.length === 1
                                ? { invoiceRejected: { [invoices[0].invoiceId]: nextCartons } }
                                : {}),
                            };
                          })
                        }
                      />
                      <span>Diterima sebagian</span>
                    </label>
                  </div>
                </fieldset>
              )}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-on-surface-variant">
                  Pilih alasan cepat penolakan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DRIVER_REJECT_REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface-container hover:bg-surface-variant cursor-pointer"
                      onClick={() => setReason(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                Alasan penolakan *
                <textarea
                  className="block w-full border rounded-xl p-2"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {partial && (
                <>
                  <label className="block">
                    Karton ditolak (1 s.d. {total - 1})
                    <input
                      type="number"
                      step="1"
                      className="block w-full border rounded-xl p-2"
                      min="1"
                      max={total - 1}
                      required
                      value={cartons}
                      onChange={(e) => setCartons(e.target.value)}
                    />
                  </label>
                  {items.length > 0 && (
                    <fieldset className="space-y-2">
                      <legend>Jumlah barang ditolak (wajib sisakan yang diterima)</legend>
                      {items.map((item) => (
                        <div
                          className="flex flex-wrap items-center justify-between gap-2"
                          key={item.lineId}
                        >
                          <label className="flex-1 flex justify-between gap-2 min-w-[200px]">
                            <span>
                              {stop.packingList?.items?.find((i) => i.lineId === item.lineId)
                                ?.name || item.lineId}{' '}
                              (muatan {item.quantity}{' '}
                              {unitDescription(
                                stop.packingList?.items?.find((i) => i.lineId === item.lineId)
                              )}
                              )
                            </span>
                            <input
                              aria-label="Jumlah barang ditolak"
                              type="number"
                              step="1"
                              min="0"
                              max={item.quantity}
                              className="w-24 border rounded p-2"
                              value={rejected[item.lineId] || 0}
                              onChange={(e) =>
                                setRejected({ ...rejected, [item.lineId]: e.target.value })
                              }
                            />
                          </label>
                          {item.quantity > 0 && (
                            <button
                              type="button"
                              className="logistics-preset-chip"
                              onClick={() =>
                                setRejected({ ...rejected, [item.lineId]: item.quantity })
                              }
                            >
                              Tolak semua ({item.quantity})
                            </button>
                          )}
                        </div>
                      ))}
                    </fieldset>
                  )}
                  {invoices.length === 1 ? (
                    <p className="text-xs text-on-surface-variant">
                      Faktur{' '}
                      <strong>
                        {stop.packingList?.invoices?.find((v) => v.id === invoices[0].invoiceId)
                          ?.invoiceNumber || invoices[0].invoiceId}
                      </strong>
                      : otomatis {Number(cartons) || 0} karton ditolak.
                    </p>
                  ) : (
                    invoices.length > 1 && (
                      <div className="space-y-2">
                        <p
                          className={`text-xs font-semibold ${
                            invoiceRejectedTotal === (Number(cartons) || 0)
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                          }`}
                        >
                          Total faktur ditolak: {invoiceRejectedTotal} / {Number(cartons) || 0}{' '}
                          karton
                        </p>
                        {invoices.map((i) => (
                          <label key={i.invoiceId} className="block">
                            Karton ditolak faktur{' '}
                            {stop.packingList?.invoices?.find((v) => v.id === i.invoiceId)
                              ?.invoiceNumber || i.invoiceId}{' '}
                            (maks. {i.cartons})
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max={i.cartons}
                              className="form-input block w-full"
                              value={invoiceRejected[i.invoiceId] || 0}
                              onChange={(e) =>
                                setInvoiceRejected({
                                  ...invoiceRejected,
                                  [i.invoiceId]: e.target.value,
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
          {type !== 'absen_in' && (type === 'delivered' || partial) && (
            <DeliveryReceiptInput
              policy={settings}
              name={recipientName}
              signature={signatureDataUrl}
              onName={draft.field('recipientName')}
              onSignature={draft.field('signatureDataUrl')}
            />
          )}
          {type === 'absen_in' ? (
            <details open={Boolean(notes)} className="rounded-xl border border-border-glass p-3">
              <summary className="min-h-11 cursor-pointer text-xs font-semibold text-on-surface-variant flex items-center">
                Catatan kedatangan (opsional)
              </summary>
              <label className="block mt-2">
                Catatan
                <textarea
                  className="block w-full border rounded-xl p-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </details>
          ) : (
            <label className="block">
              Catatan (opsional)
              <textarea
                className="block w-full border rounded-xl p-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          )}
          {allowWithoutCheckout && (
            <details
              open={withoutCheckout}
              className="rounded-xl border border-border-glass p-3 space-y-2"
            >
              <summary className="min-h-11 cursor-pointer text-xs font-semibold text-on-surface-variant flex items-center">
                Kendala presensi keluar? (pengecualian)
              </summary>
              <label className="flex items-center gap-3 min-h-11">
                <input
                  type="checkbox"
                  checked={withoutCheckout}
                  onChange={(e) => setWithoutCheckout(e.target.checked)}
                />
                Bukti keluar tidak dapat diambil
              </label>
              {withoutCheckout && (
                <div className="space-y-2">
                  <p className="text-sm text-on-surface-variant">
                    Hasil barang disimpan tanpa presensi keluar dan ditandai untuk pemeriksaan
                    gudang. Foto bukti tetap wajib.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MISSING_CHECKOUT_REASON_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface-container hover:bg-surface-variant cursor-pointer"
                        onClick={() => setCheckoutReason(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <label className="block">
                    Alasan bukti keluar tidak tersedia (minimal 5 karakter)
                    <textarea
                      className="form-input block w-full"
                      required
                      minLength={5}
                      maxLength={2000}
                      value={checkoutReason}
                      onChange={(e) => setCheckoutReason(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </details>
          )}
        </fieldset>
        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full p-3 rounded-xl bg-primary text-on-primary"
        >
          {busy
            ? 'Menyimpan…'
            : pending
              ? 'Kirim ulang isian yang sama'
              : logicalResult
                ? 'Simpan hasil'
                : 'Simpan bukti'}
        </button>
      </form>
    </GuardedDialog>
  );
};
