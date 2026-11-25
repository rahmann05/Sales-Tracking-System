import React, { useEffect, useRef, useState } from 'react';
import { deliveryApi, vehiclesApi, outletsApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import { setWorkspaceValues } from '../../../shared/utils/workspaceNavigation';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';
import { useOperationRequest } from '../../../shared/hooks/useOperationRequest';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { InvoiceLinesEditor } from './InvoiceLinesEditor';
import { loadLogistics, capacityGuidance } from '../../../../../shared/packing-load.mjs';
import { shipmentInvoiceRequired } from '../../../../../shared/shipment-document.mjs';
import { manualCodeRequired } from '../../../../../shared/coding.mjs';
import {
  orderPricing,
  hasCompleteTaxTerms,
  resolveTaxIncluded,
} from '../../../../../shared/order-pricing.mjs';

function computeInvoiceValue(invoice) {
  if (
    invoice?.items?.length &&
    invoice.items.every((i) => Number.isFinite(i.unitPrice) && i.unitPrice >= 0) &&
    hasCompleteTaxTerms(invoice.taxRatePercent, invoice.taxIncluded)
  ) {
    return orderPricing(
      invoice.items,
      invoice.taxRatePercent,
      resolveTaxIncluded(invoice.taxRatePercent, invoice.taxIncluded),
      invoice.taxRoundingMode || 'NEAREST'
    ).totalValue;
  }
  return null;
}

const packingOverridePresets = [
  'Order mendesak sesuai arahan Supervisor / Admin',
  'Jadwal pengiriman reguler area hari ini',
  'Persetujuan order menyusul di sistem',
];

function initialLoad(doc, orders) {
  if (doc)
    return {
      destinations: doc.destinations,
      items: doc.items,
      invoices: doc.invoices.map(
        ({
          id,
          invoiceNumber,
          totalCartons,
          totalAmount,
          items,
          destinationId,
          sourceOrderIds,
          taxRatePercent,
          taxIncluded,
          taxRoundingMode,
        }) => ({
          tempId: id || crypto.randomUUID(),
          invoiceNumber,
          totalCartons,
          totalAmount: totalAmount ?? '',
          items,
          destinationId,
          sourceOrderIds,
          taxRatePercent,
          taxIncluded,
          taxRoundingMode,
        })
      ),
    };
  const destinations = [],
    items = [],
    invoices = [];
  for (const order of orders) {
    const outlet = {
      ...order.outlet,
      ...order.pjpStop?.outlet,
      ...order.customerSnapshot,
      id: order.outletId || order.pjpStop?.outletId || order.customerSnapshot?.id,
    };
    const point =
      order.customerSnapshot?.deliveryPoint ||
      (Number.isFinite(outlet.latitude) && Number.isFinite(outlet.longitude)
        ? { latitude: outlet.latitude, longitude: outlet.longitude }
        : null);
    const key = `${outlet.id}:${point?.latitude}:${point?.longitude}`;
    let destination = destinations.find((row) => row.key === key);
    if (!destination) {
      destination = {
        id: `destination-${order.id}`,
        key,
        outletId: outlet.id,
        outlet,
        point,
        sourceOrderIds: [],
        totalCartons: 0,
        totalWeight: null,
      };
      destinations.push(destination);
    }
    destination.sourceOrderIds.push(order.id);
    const lines = (order.fulfillmentLines || order.items || [])
      .filter((line) => (line.unpacked ?? line.quantity) > 0)
      .map((line) => ({
        lineId: line.id,
        sourceOrderItemId: line.id,
        sourceOrderId: order.id,
        sourceOrderCode: order.code,
        destinationId: destination.id,
        sku: line.productSku ?? line.product?.sku ?? '',
        name: line.productName ?? line.product?.name ?? '',
        quantity: line.unpacked ?? line.quantity,
        maxQuantity: line.unpacked ?? line.quantity,
        unit: line.unit || 'unit',
        unitPrice: line.unitPrice,
      }));
    const defaultCartons = lines.length > 0 ? 1 : 0;
    destination.totalCartons += defaultCartons;
    items.push(...lines);
    invoices.push({
      tempId: crypto.randomUUID(),
      invoiceNumber: '',
      destinationId: destination.id,
      sourceOrderIds: [order.id],
      totalCartons: defaultCartons,
      totalAmount: '',
      items: lines.map((line) => ({
        lineId: line.lineId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
      taxRatePercent: order.taxRatePercent,
      taxIncluded: order.taxIncluded,
      taxRoundingMode: order.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE || 'NEAREST',
    });
  }
  return { destinations, items, invoices };
}

export function PackingLoadForm({ document: doc, order, orders, onSaved, onCancel }) {
  const { settings, setActiveTab } = useApp(),
    feature = useFeaturePolicy('PACKING'),
    operation = useOperationRequest('packing-load');
  const [load, setLoad] = useState(() => initialLoad(doc, orders || (order ? [order] : [])));
  const [vehicles, setVehicles] = useState([]),
    [vehicleError, setVehicleError] = useState(''),
    [suggestion, setSuggestion] = useState(doc?.suggestedVehicleId || '');
  const [code, setCode] = useState(doc?.code || ''),
    [notes, setNotes] = useState(doc?.notes || ''),
    [reason, setReason] = useState(doc?.overrideReason || ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [search, setSearch] = useState(''),
    [outlets, setOutlets] = useState([]),
    [searchError, setSearchError] = useState('');
  const snapshot = JSON.stringify([load, suggestion, code, notes, reason]),
    initial = useRef(snapshot);
  useUnsavedNavigation(snapshot !== initial.current, busy);
  useEffect(() => {
    let active = true;
    vehiclesApi
      .getAll()
      .then((response) => {
        if (active) setVehicles(response.data || []);
      })
      .catch((e) => {
        if (active) setVehicleError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (search.trim().length < 2) {
      setOutlets([]);
      return;
    }
    let active = true;
    const timer = setTimeout(
      () =>
        outletsApi
          .getAll({ search, limit: 15 })
          .then((response) => {
            if (active) {
              const result = response.data;
              setOutlets(Array.isArray(result) ? result : result.data || result.outlets || []);
              setSearchError('');
            }
          })
          .catch((e) => {
            if (active) setSearchError(e.message);
          }),
      250
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  const required = shipmentInvoiceRequired(
    doc || { documentKind: 'PACKING' },
    doc?.policySnapshot?.values || settings
  );
  const selectedOrders = orders || (order ? [order] : []);
  const hasPendingOrder = Boolean(
    doc?.overrideReason || selectedOrders.some((row) => row.status === 'PENDING_APPROVAL')
  );
  const destinations = load.destinations.map((destination) => {
    const invoices = load.invoices.filter((invoice) => invoice.destinationId === destination.id);
    return {
      ...destination,
      totalCartons: invoices.length
        ? invoices.reduce((sum, invoice) => sum + Number(invoice.totalCartons || 0), 0)
        : destination.totalCartons,
    };
  });
  const totals = loadLogistics({ loadPlanVersion: 2, destinations, items: load.items }),
    vehicle = vehicles.find((row) => row.id === suggestion),
    capacity = capacityGuidance(totals, vehicle);
  const releaseIssues = [];
  for (const dest of destinations) {
    const destItems = load.items.filter(
      (item) => item.destinationId === dest.id && Number(item.quantity) > 0
    );
    const destInvoices = load.invoices.filter((inv) => inv.destinationId === dest.id);
    const destLabel = dest.outlet?.name || 'Toko';
    if (!dest.point) releaseIssues.push(`${destLabel}: titik lokasi toko belum tersedia.`);
    if (!destItems.length)
      releaseIssues.push(`${destLabel}: minimal 1 barang dibawa (> 0).`);
    if (Number(dest.totalCartons) <= 0)
      releaseIssues.push(`${destLabel}: jumlah karton harus > 0.`);
    if (required && !destInvoices.length)
      releaseIssues.push(`${destLabel}: faktur wajib dilampirkan.`);
    if (destInvoices.some((inv) => Number(inv.totalCartons) <= 0))
      releaseIssues.push(`${destLabel}: karton tiap faktur harus > 0.`);
    if (
      manualCodeRequired('INVOICE', settings) &&
      destInvoices.some((inv) => !String(inv.invoiceNumber || '').trim())
    )
      releaseIssues.push(`${destLabel}: nomor faktur masih kosong.`);
  }
  const setInvoice = (index, invoice) =>
    setLoad((current) => ({
      ...current,
      invoices: current.invoices.map((row, i) => (i === index ? invoice : row)),
    }));
  const setQuantity = (lineId, quantity) =>
    setLoad((current) => {
      const item = current.items.find((row) => row.lineId === lineId),
        attached = current.invoices.filter((invoice) =>
          invoice.items.some((line) => line.lineId === lineId)
        );
      const candidates = attached.length
        ? attached
        : current.invoices.filter(
            (invoice) =>
              invoice.destinationId === item.destinationId &&
              invoice.sourceOrderIds.includes(item.sourceOrderId)
          );
      const selected = candidates.length === 1 ? candidates[0] : null,
        oldLine = selected?.items.find((line) => line.lineId === lineId);
      return {
        ...current,
        items: current.items.map((row) => (row.lineId === lineId ? { ...row, quantity } : row)),
        invoices: selected
          ? current.invoices.map((invoice) =>
              invoice !== selected
                ? invoice
                : {
                    ...invoice,
                    items: [
                      ...invoice.items.filter((line) => line.lineId !== lineId),
                      ...(quantity > 0
                        ? [{ ...(oldLine || { lineId, unitPrice: item.unitPrice }), quantity }]
                        : []),
                    ],
                  }
            )
          : current.invoices,
      };
    });
  const removeOrder = (sourceId) =>
    setLoad((current) => {
      const removed = new Set(
          current.items.filter((item) => item.sourceOrderId === sourceId).map((item) => item.lineId)
        ),
        items = current.items.filter((item) => item.sourceOrderId !== sourceId);
      const destinations = current.destinations
        .map((destination) => ({
          ...destination,
          sourceOrderIds: destination.sourceOrderIds.filter((id) => id !== sourceId),
          totalWeight: destination.sourceOrderIds.includes(sourceId)
            ? null
            : destination.totalWeight,
        }))
        .filter((destination) => items.some((item) => item.destinationId === destination.id));
      const invoices = current.invoices
        .map((invoice) => {
          if (
            !invoice.sourceOrderIds.includes(sourceId) &&
            !invoice.items.some((line) => removed.has(line.lineId))
          )
            return invoice;
          const updated = {
            ...invoice,
            sourceOrderIds: invoice.sourceOrderIds.filter((id) => id !== sourceId),
            items: invoice.items.filter((line) => !removed.has(line.lineId)),
          };
          return updated.items.length || updated.sourceOrderIds.length ? updated : null;
        })
        .filter(
          (invoice) =>
            invoice && destinations.some((destination) => destination.id === invoice.destinationId)
        );
      return { ...current, items, destinations, invoices };
    });
  const addInvoice = (destination) =>
    setLoad((current) => ({
      ...current,
      invoices: [
        ...current.invoices,
        {
          tempId: crypto.randomUUID(),
          invoiceNumber: '',
          destinationId: destination.id,
          sourceOrderIds: destination.sourceOrderIds.length === 1 ? destination.sourceOrderIds : [],
          totalCartons: 0,
          totalAmount: '',
          items: [],
          taxRatePercent: Number(settings.TAX_RATE_PERCENT ?? 0),
          taxIncluded: settings.ORDER_PRICES_INCLUDE_TAX !== false,
          taxRoundingMode: 'NEAREST',
        },
      ],
    }));
  const addOutlet = (outlet) => {
    const id = crypto.randomUUID();
    setLoad((current) => ({
      ...current,
      destinations: [
        ...current.destinations,
        {
          id,
          outletId: outlet.id,
          outlet,
          point:
            Number.isFinite(outlet.latitude) && Number.isFinite(outlet.longitude)
              ? { latitude: outlet.latitude, longitude: outlet.longitude }
              : null,
          sourceOrderIds: [],
          totalCartons: 0,
          totalWeight: null,
        },
      ],
      items: [
        ...current.items,
        {
          lineId: crypto.randomUUID(),
          destinationId: id,
          name: '',
          sku: '',
          quantity: 1,
          unit: 'unit',
        },
      ],
    }));
    setSearch('');
  };
  const cancel = () => {
    if (
      !busy &&
      (snapshot === initial.current ||
        window.confirm('Perubahan packing list belum disimpan. Batalkan?'))
    )
      onCancel();
  };
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    const releaseAfterSave = event.nativeEvent.submitter?.value === 'RELEASE';
    if (releaseAfterSave && releaseIssues.length > 0) {
      setError(releaseIssues[0]);
      return;
    }
    if (hasPendingOrder && !reason.trim()) {
      setError('Isi alasan pengecualian untuk order yang belum disetujui.');
      return;
    }
    if (
      releaseAfterSave &&
      !window.confirm(
        `Serahkan dokumen ${code || 'packing list'} (${totals.totalCartons} karton) ke Kepala Gudang?`
      )
    )
      return;
    setError('');
    setBusy(true);
    try {
      const activeItems = load.items.filter((item) => item.quantity > 0);
      const sourceOrderIds = [
        ...new Set(destinations.flatMap((destination) => destination.sourceOrderIds)),
      ];
      if (sourceOrderIds.some((id) => !activeItems.some((item) => item.sourceOrderId === id)))
        throw new Error('Keluarkan order yang seluruh barangnya belum dibawa dari pilihan muatan.');
      const data = {
        loadPlanVersion: 2,
        documentKind: 'PACKING',
        code,
        releaseAfterSave,
        outletId: destinations[0]?.outletId,
        sourceOrderIds,
        suggestedVehicleId: suggestion || null,
        destinations: destinations.map(
          ({ id, outletId, sourceOrderIds, totalCartons, totalWeight }) => ({
            id,
            outletId,
            sourceOrderIds,
            totalCartons,
            totalWeight,
          })
        ),
        items: activeItems,
        invoices: load.invoices.map(({ tempId, ...invoice }) => ({
          ...invoice,
          totalAmount:
            invoice.totalAmount === '' || invoice.totalAmount == null
              ? undefined
              : Number(invoice.totalAmount),
        })),
        totalCartons: totals.totalCartons,
        notes,
        overrideReason: reason,
        ...(doc ? { revision: doc.revision } : {}),
      };
      const response = doc
        ? await deliveryApi.updatePackingList(doc.id, data)
        : await deliveryApi.createPackingList(await operation.identify(data));
      operation.clear();
      initial.current = snapshot;
      onSaved(
        response.data.status === 'RELEASED'
          ? 'Packing list diserahkan. Kepala gudang akan meninjau muatan dan kendaraan.'
          : 'Draft packing list tersimpan.',
        response.data
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="admin-panel p-5 space-y-5">
      <div className="work-step-intro">
        <strong>Satu packing list untuk satu muatan kendaraan</strong>Periksa jumlah barang yang
        dibawa dan isi jumlah karton/koli fisik per toko. Nomor serta nilai faktur terbentuk
        otomatis dari order.
      </div>
      {error && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="admin-feedback error">
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="work-route-layout">
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">Toko, order dan faktur dalam muatan</h2>
          {!destinations.length && (
            <p className="admin-empty">
              Pilih order atau tambahkan tujuan untuk mulai menyusun muatan.
            </p>
          )}
          {destinations.map((destination, index) => {
            const destInvoices = load.invoices
              .map((inv, idx) => ({ inv, idx }))
              .filter(({ inv }) => inv.destinationId === destination.id);
            const orderLinked = destination.sourceOrderIds.length > 0;
            const manualInvoiceCode = manualCodeRequired('INVOICE', settings);
            const streamlinedInvoice =
              orderLinked && !manualInvoiceCode && destInvoices.length === 1;
            return (
              <section key={destination.id} className="work-target-card space-y-4">
                <header className="packing-target-head">
                  <div className="packing-target-title">
                    <span className="app-sequence">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold text-base">
                        {destination.outlet?.name || 'Toko'}
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        {destination.outlet?.address || ''}
                      </p>
                      <div className="packing-target-meta">
                        <span>{destination.sourceOrderIds.length} order</span>
                        <span>·</span>
                        <span>{destination.totalCartons} karton</span>
                        {destination.point ? (
                          <>
                            <span>·</span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${destination.point.latitude},${destination.point.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-table-link"
                            >
                              {destination.point.latitude.toFixed(6)},{' '}
                              {destination.point.longitude.toFixed(6)} · Google Maps
                            </a>
                          </>
                        ) : (
                          <>
                            <span className="admin-status admin-status-pending">
                              Titik belum tersedia — lengkapi sebelum diserahkan
                            </span>
                            {destination.outletId && (
                              <button
                                type="button"
                                className="admin-button"
                                onClick={() => {
                                  if (
                                    window.dispatchEvent(
                                      new CustomEvent('app:before-navigate', { cancelable: true })
                                    )
                                  ) {
                                    setWorkspaceValues(
                                      { outletId: destination.outletId },
                                      { tab: TAB_IDS.OUTLET_MANAGEMENT }
                                    );
                                    setActiveTab(TAB_IDS.OUTLET_MANAGEMENT);
                                  }
                                }}
                              >
                                Lengkapi di Master Outlet
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {destination.sourceOrderIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {destination.sourceOrderIds.map((id) => (
                        <button
                          key={id}
                          type="button"
                          className="admin-button"
                          onClick={() => removeOrder(id)}
                        >
                          Keluarkan order{' '}
                          {load.items.find((item) => item.sourceOrderId === id)?.sourceOrderCode ||
                            id.slice(0, 8)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() =>
                        setLoad((current) => ({
                          ...current,
                          destinations: current.destinations.filter((d) => d.id !== destination.id),
                          items: current.items.filter((it) => it.destinationId !== destination.id),
                          invoices: current.invoices.filter(
                            (inv) => inv.destinationId !== destination.id
                          ),
                        }))
                      }
                    >
                      Hapus tujuan manual ini
                    </button>
                  )}
                </header>
                <div className="admin-table-scroll">
                  <table className="admin-data-table">
                    <caption>
                      Barang untuk tujuan ini; kuantitas produk berbeda dari karton. Isi 0 untuk
                      produk order yang belum dibawa.
                    </caption>
                    <thead>
                      <tr>
                        <th>Order / produk</th>
                        <th>Dibawa</th>
                        <th>Satuan</th>
                        {!destination.sourceOrderIds.length && <th>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {load.items
                        .filter((item) => item.destinationId === destination.id)
                        .map((item) => (
                          <tr key={item.lineId}>
                            <td>
                              {item.sourceOrderCode && (
                                <small className="packing-order-code">{item.sourceOrderCode}</small>
                              )}
                              {item.sourceOrderId ? (
                                <strong>{item.name}</strong>
                              ) : (
                                <label className="app-field">
                                  Nama produk
                                  <input
                                    className="form-input"
                                    required
                                    value={item.name}
                                    onChange={(e) =>
                                      setLoad((current) => ({
                                        ...current,
                                        items: current.items.map((row) =>
                                          row.lineId === item.lineId
                                            ? { ...row, name: e.target.value }
                                            : row
                                        ),
                                      }))
                                    }
                                  />
                                </label>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <input
                                  className="form-input w-24 text-right"
                                  aria-label={`Jumlah dibawa ${item.name}`}
                                  type="number"
                                  min={item.sourceOrderId ? 0 : 1}
                                  max={item.maxQuantity}
                                  required
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => setQuantity(item.lineId, Number(e.target.value))}
                                />
                                {item.maxQuantity != null && (
                                  <small className="admin-footnote whitespace-nowrap">
                                    Maks. {item.maxQuantity}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              {item.sourceOrderId ? (
                                item.unit
                              ) : (
                                <label className="app-field">
                                  Satuan
                                  <input
                                    className="form-input w-24"
                                    required
                                    value={item.unit}
                                    onChange={(e) =>
                                      setLoad((current) => ({
                                        ...current,
                                        items: current.items.map((row) =>
                                          row.lineId === item.lineId
                                            ? { ...row, unit: e.target.value }
                                            : row
                                        ),
                                      }))
                                    }
                                  />
                                </label>
                              )}
                            </td>
                            {!destination.sourceOrderIds.length && (
                              <td>
                                <button
                                  type="button"
                                  className="admin-button"
                                  onClick={() =>
                                    setLoad((current) => ({
                                      ...current,
                                      items: current.items.filter(
                                        (row) => row.lineId !== item.lineId
                                      ),
                                    }))
                                  }
                                >
                                  Hapus
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!destination.sourceOrderIds.length && (
                  <button
                    type="button"
                    className="admin-button"
                    onClick={() =>
                      setLoad((current) => ({
                        ...current,
                        items: [
                          ...current.items,
                          {
                            lineId: crypto.randomUUID(),
                            destinationId: destination.id,
                            name: '',
                            sku: '',
                            quantity: 1,
                            unit: 'unit',
                          },
                        ],
                      }))
                    }
                  >
                    Tambah produk untuk toko ini
                  </button>
                )}
                {streamlinedInvoice ? (
                  (() => {
                    const { inv: singleInvoice, idx: singleIdx } = destInvoices[0];
                    const autoVal = computeInvoiceValue(singleInvoice);
                    const orderCode =
                      singleInvoice.sourceOrderIds
                        .map(
                          (id) =>
                            load.items.find((item) => item.sourceOrderId === id)?.sourceOrderCode ||
                            id.slice(0, 8)
                        )
                        .join(', ') || '-';
                    return (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <label className="app-field">
                            Jumlah karton / koli fisik
                            <input
                              className="form-input block w-full"
                              aria-label={`Jumlah karton ${destination.outlet?.name || 'Toko'}`}
                              type="number"
                              min="0"
                              step="1"
                              required
                              value={singleInvoice.totalCartons}
                              onChange={(e) =>
                                setInvoice(singleIdx, {
                                  ...singleInvoice,
                                  totalCartons: Number(e.target.value),
                                })
                              }
                            />
                            <div className="logistics-preset-chips pt-1">
                              {[1, 2, 5, 10].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  className="logistics-preset-chip"
                                  onClick={() =>
                                    setInvoice(singleIdx, { ...singleInvoice, totalCartons: val })
                                  }
                                >
                                  {val} krt
                                </button>
                              ))}
                            </div>
                          </label>
                          <label className="app-field">
                            Perkiraan berat tujuan ini (kg, opsional)
                            <input
                              className="form-input block w-full"
                              type="number"
                              min="0"
                              step="0.1"
                              value={destination.totalWeight ?? ''}
                              placeholder="Belum diketahui"
                              onChange={(e) =>
                                setLoad((current) => ({
                                  ...current,
                                  destinations: current.destinations.map((row) =>
                                    row.id === destination.id
                                      ? {
                                          ...row,
                                          totalWeight:
                                            e.target.value === '' ? null : Number(e.target.value),
                                        }
                                      : row
                                  ),
                                }))
                              }
                            />
                          </label>
                        </div>
                        <div className="packing-auto-invoice-card">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-xs text-on-surface">
                              Faktur otomatis dari Order {orderCode}
                            </strong>
                            <span className="admin-status admin-status-released">Otomatis</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Nomor faktur:{' '}
                            <span className="font-medium text-on-surface">
                              {singleInvoice.invoiceNumber || 'Ditetapkan otomatis saat disimpan'}
                            </span>{' '}
                            · Nilai faktur otomatis:{' '}
                            <strong className="text-on-surface">
                              {autoVal != null
                                ? `Rp ${autoVal.toLocaleString('id-ID')}`
                                : 'Mengikuti harga order'}
                            </strong>
                          </p>
                        </div>
                        <details className="packing-disclosure">
                          <summary>
                            Opsi lanjutan faktur (pecah faktur / rincian barang &amp; pajak)
                          </summary>
                          <div className="packing-disclosure-body">
                            <InvoiceLinesEditor
                              invoice={singleInvoice}
                              items={load.items.filter(
                                (item) => item.destinationId === destination.id
                              )}
                              orderLinked={orderLinked}
                              onChange={(updated) => setInvoice(singleIdx, updated)}
                            />
                            <div>
                              <button
                                type="button"
                                className="admin-button"
                                onClick={() => addInvoice(destination)}
                              >
                                Tambah faktur pecahan
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <h4 className="font-semibold">
                          Faktur untuk {destination.outlet?.name || 'Toko'}
                        </h4>
                        <button
                          type="button"
                          className="admin-button"
                          onClick={() => addInvoice(destination)}
                        >
                          Tambah faktur
                        </button>
                      </div>
                      {destInvoices.map(({ inv: invoice, idx: i }, pos) => {
                        const autoVal = computeInvoiceValue(invoice);
                        const hasCustomAmount =
                          invoice.totalAmount !== '' && invoice.totalAmount != null;
                        return (
                          <section
                            key={invoice.tempId || i}
                            className="border rounded-xl p-4 space-y-3"
                          >
                            <p className="admin-footnote">
                              Order:{' '}
                              {invoice.sourceOrderIds
                                .map(
                                  (id) =>
                                    load.items.find((item) => item.sourceOrderId === id)
                                      ?.sourceOrderCode || id.slice(0, 8)
                                )
                                .join(', ') || 'Pilih barang dari order pada rincian faktur'}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                {manualInvoiceCode || Boolean(invoice.invoiceNumber) ? (
                                  <BusinessCodeInput
                                    entity="INVOICE"
                                    value={invoice.invoiceNumber}
                                    existing={Boolean(
                                      doc?.invoices.some(
                                        (row) => row.invoiceNumber === invoice.invoiceNumber
                                      )
                                    )}
                                    onChange={(invoiceNumber) =>
                                      setInvoice(i, { ...invoice, invoiceNumber })
                                    }
                                  />
                                ) : (
                                  <div className="app-field text-sm space-y-1">
                                    <span>Nomor faktur</span>
                                    <p className="text-xs text-on-surface-variant">
                                      Ditetapkan otomatis saat disimpan
                                    </p>
                                  </div>
                                )}
                              </div>
                              <label className="app-field">
                                Karton pada faktur
                                <input
                                  className="form-input block w-full"
                                  aria-label={`Karton faktur ${pos + 1}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  required
                                  value={invoice.totalCartons}
                                  onChange={(e) =>
                                    setInvoice(i, {
                                      ...invoice,
                                      totalCartons: Number(e.target.value),
                                    })
                                  }
                                />
                              </label>
                              {!orderLinked || hasCustomAmount ? (
                                <label className="app-field">
                                  Nominal faktur Rp (opsional)
                                  <input
                                    className="form-input block w-full"
                                    type="number"
                                    min="0"
                                    value={invoice.totalAmount}
                                    onChange={(e) =>
                                      setInvoice(i, { ...invoice, totalAmount: e.target.value })
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="text-xs text-on-surface-variant self-end pb-2">
                                  Nilai faktur otomatis:{' '}
                                  <strong className="text-on-surface">
                                    {autoVal != null
                                      ? `Rp ${autoVal.toLocaleString('id-ID')}`
                                      : 'Mengikuti harga order'}
                                  </strong>
                                </div>
                              )}
                            </div>
                            <details className="packing-disclosure">
                              <summary>Rincian barang dan pajak faktur</summary>
                              <div className="packing-disclosure-body">
                                <InvoiceLinesEditor
                                  invoice={invoice}
                                  items={load.items.filter(
                                    (item) => item.destinationId === destination.id
                                  )}
                                  orderLinked={orderLinked}
                                  onChange={(updated) => setInvoice(i, updated)}
                                />
                              </div>
                            </details>
                            {(!required || destInvoices.length > 1) && (
                              <button
                                type="button"
                                className="admin-button"
                                onClick={() =>
                                  setLoad((current) => ({
                                    ...current,
                                    invoices: current.invoices.filter((row, n) =>
                                      invoice.tempId ? row.tempId !== invoice.tempId : n !== i
                                    ),
                                  }))
                                }
                              >
                                Hapus faktur ini
                              </button>
                            )}
                          </section>
                        );
                      })}
                      {!destInvoices.length && (
                        <p className="admin-footnote">
                          {required
                            ? 'Faktur diperlukan sebelum diserahkan.'
                            : 'Faktur opsional sesuai pengaturan.'}
                        </p>
                      )}
                    </div>
                    {!destInvoices.length && (
                      <label className="app-field">
                        Karton tujuan ini
                        <input
                          className="form-input block w-full"
                          type="number"
                          min="0"
                          step="1"
                          value={destination.totalCartons}
                          onChange={(e) =>
                            setLoad((current) => ({
                              ...current,
                              destinations: current.destinations.map((row) =>
                                row.id === destination.id
                                  ? { ...row, totalCartons: Number(e.target.value) }
                                  : row
                              ),
                            }))
                          }
                        />
                      </label>
                    )}
                    <label className="app-field">
                      Perkiraan berat tujuan ini (kg, opsional)
                      <input
                        className="form-input block w-full"
                        type="number"
                        min="0"
                        step="0.1"
                        value={destination.totalWeight ?? ''}
                        placeholder="Belum diketahui"
                        onChange={(e) =>
                          setLoad((current) => ({
                            ...current,
                            destinations: current.destinations.map((row) =>
                              row.id === destination.id
                                ? {
                                    ...row,
                                    totalWeight:
                                      e.target.value === '' ? null : Number(e.target.value),
                                  }
                                : row
                            ),
                          }))
                        }
                      />
                    </label>
                  </>
                )}
              </section>
            );
          })}
          {!doc &&
            !load.items.some((item) => item.sourceOrderId) &&
            settings.PACKING_SOURCE_MODE !== 'ORDER' && (
              <details className="packing-disclosure">
                <summary>Tambah tujuan manual tanpa order</summary>
                <div className="packing-disclosure-body">
                  <label className="app-field">
                    Cari toko
                    <input
                      className="form-input block w-full"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  {searchError && <p role="alert">{searchError}</p>}
                  <div className="flex flex-wrap gap-2">
                    {outlets.map((outlet) => (
                      <button
                        key={outlet.id}
                        type="button"
                        className="admin-button"
                        onClick={() => addOutlet(outlet)}
                      >
                        {outlet.name}
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            )}
        </div>
        <aside className="work-route-summary">
          <h2 className="text-lg font-semibold">Rekap muatan</h2>
          <BusinessCodeInput
            entity="PACKING_LIST"
            value={code}
            onChange={setCode}
            existing={Boolean(doc)}
          />
          <div className="packing-summary-kpis">
            <div>
              <span>Karton</span>
              <strong>{totals.totalCartons}</strong>
            </div>
            <div>
              <span>Toko</span>
              <strong>{totals.outletCount}</strong>
            </div>
            <div>
              <span>Faktur</span>
              <strong>{load.invoices.length}</strong>
            </div>
          </div>
          <p className="admin-footnote">
            {totals.weightComplete
              ? `Total berat perkiraan: ${totals.knownWeightKg} kg`
              : `${totals.knownWeightKg} kg diketahui · berat ${totals.unknownWeightDestinations} tujuan belum diisi`}
          </p>
          <details className="packing-disclosure">
            <summary>Total produk menurut SKU dan satuan</summary>
            <div className="packing-disclosure-body">
              {totals.products.map((item, index) => (
                <p key={index} className="text-xs text-on-surface-variant">
                  {item.name} · <strong className="text-on-surface">{item.quantity}</strong>{' '}
                  {item.unit}
                </p>
              ))}
            </div>
          </details>
          <label className="app-field">
            Saran kendaraan untuk kepala gudang (opsional)
            <select
              className="form-input block w-full"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
            >
              <option value="">Tanpa saran kendaraan</option>
              {vehicles
                .filter((row) => row.isActive)
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code} · {row.name}
                  </option>
                ))}
            </select>
          </label>
          {vehicleError && (
            <p role="alert" className="admin-feedback error">
              Daftar kendaraan belum tersedia: {vehicleError}. Saran boleh dikosongkan.
            </p>
          )}
          {vehicle && (
            <div className="space-y-2 text-xs">
              <p className="text-on-surface-variant">
                Patokan: {capacity.cartonCapacity ?? 'belum diketahui'} karton ·{' '}
                {capacity.weightCapacityKg ?? 'belum diketahui'} kg
              </p>
              {capacity.cartonPercent != null && (
                <>
                  <div className="flex items-center justify-between text-on-surface">
                    <span>Terisi (karton)</span>
                    <strong>{Math.round(capacity.cartonPercent)}%</strong>
                  </div>
                  <progress
                    className="packing-capacity-bar"
                    value={Math.min(100, Math.round(capacity.cartonPercent))}
                    max={100}
                    aria-label="Persentase perkiraan kapasitas karton kendaraan"
                  />
                </>
              )}
              {(capacity.overCartons || capacity.overWeight) && (
                <p className="text-amber-700 font-medium">
                  Perkiraan melampaui patokan. Kepala gudang dapat memilih kendaraan lain atau
                  menyetujui dengan alasan.
                </p>
              )}
            </div>
          )}
          <p className="admin-footnote">
            Kapasitas adalah patokan, bukan ukuran pasti. Berat kosong tidak dianggap nol. Kuantitas
            produk tidak otomatis dikonversi menjadi karton.
          </p>
          {hasPendingOrder && (
            <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50/40 p-3">
              <strong className="block text-xs font-semibold text-amber-900">
                Alasan pengecualian order belum disetujui (wajib)
              </strong>
              <div className="flex flex-wrap gap-1.5">
                {packingOverridePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface hover:bg-surface-variant cursor-pointer"
                    onClick={() => setReason(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                aria-label="Alasan pengecualian order belum disetujui"
                className="form-input block w-full"
                required
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Pilih cepat di atas atau tulis alasan persetujuan Admin…"
              />
            </div>
          )}
          <details className="packing-disclosure">
            <summary>Catatan untuk gudang</summary>
            <div className="packing-disclosure-body">
              <label className="app-field">
                Catatan untuk gudang
                <textarea
                  className="form-input block w-full"
                  value={notes}
                  maxLength={2000}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
          </details>
          {!settings.PACKING_AUTO_RELEASE &&
            releaseIssues.length > 0 &&
            destinations.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 space-y-1">
                <strong className="block">Syarat sebelum diserahkan ke gudang:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {releaseIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          <div className="packing-form-actions">
            {!settings.PACKING_AUTO_RELEASE && (
              <button
                type="submit"
                value="RELEASE"
                className="admin-button primary"
                disabled={!destinations.length || (!doc && !feature.canStart)}
              >
                Serahkan ke gudang
              </button>
            )}
            <button
              type="submit"
              value="DRAFT"
              formNoValidate
              className="admin-button"
              disabled={!destinations.length || (!doc && !feature.canStart)}
            >
              {busy
                ? 'Menyimpan…'
                : settings.PACKING_AUTO_RELEASE
                  ? 'Simpan dokumen'
                  : 'Simpan draft'}
            </button>
            <button type="button" className="admin-button" onClick={cancel}>
              Batal
            </button>
          </div>
          <p className="admin-footnote">
            Berikutnya: kepala gudang meninjau kendaraan, muatan dan urutan toko. Saran Admin belum
            merupakan penugasan kendaraan.
          </p>
        </aside>
      </fieldset>
    </form>
  );
}
