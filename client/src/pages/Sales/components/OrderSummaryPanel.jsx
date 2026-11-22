import React from 'react';
import { TAX_ROUNDING_LABELS } from '../../../../../shared/order-pricing.mjs';
import { POLICY_OPTION_LABELS } from '../../../../../shared/operational-policy.mjs';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';

export function OrderSummaryPanel({
  adminPlace,
  adminPlaceId,
  stop,
  settings,
  code,
  setCode,
  saving,
  pending,
  orderItems,
  paymentType,
  setPaymentType,
  pricing,
  terms,
  contextReason,
  hasPriceOverride,
  priceOverrideReason,
  approval,
  draft,
}) {
  return (
    <aside className="sales-order-summary">
      <h3>Ringkasan order</h3>
      {adminPlace && (
        <p className="sales-note">
          Titik kirim Google: <strong>{adminPlace.name}</strong> · {adminPlace.latitude.toFixed(6)},{' '}
          {adminPlace.longitude.toFixed(6)}
        </p>
      )}
      <BusinessCodeInput
        entity="ORDER"
        value={code}
        onChange={setCode}
        disabled={saving || !!pending}
      />
      <div>
        {orderItems.length ? (
          orderItems.map((i) => (
            <div className="sales-cart-line" key={i.product.id}>
              <span>
                {i.product.name} × {i.qty}
              </span>
              <span>Rp {(i.product.price * i.qty).toLocaleString('id-ID')}</span>
            </div>
          ))
        ) : (
          <p className="sales-note">Belum ada produk dipilih.</p>
        )}
      </div>
      <label>
        Syarat order
        <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
          <option value="CASH">Tunai (CASH)</option>
          <option value="TOP">Tempo (TOP)</option>
          <option value="TRANSFER">Transfer</option>
        </select>
      </label>
      <p className="sales-note">
        Pembulatan pajak: {TAX_ROUNDING_LABELS[pricing.taxRoundingMode || 'NEAREST']}.
        {settings.ORDER_PRICE_OVERRIDE_LIMIT_ENABLED && settings.SALES_ALLOW_PRICE_OVERRIDE
          ? ` Batas harga: turun ${settings.ORDER_PRICE_OVERRIDE_MAX_DISCOUNT_PERCENT ?? 100}%, naik ${settings.ORDER_PRICE_OVERRIDE_MAX_MARKUP_PERCENT ?? 100}% dari katalog.`
          : ''}
      </p>
      <p className="sales-note">
        Termin: {terms} hari
        {stop.outlet?.paymentType && paymentType !== stop.outlet.paymentType
          ? ' · Berbeda dari syarat pelanggan'
          : ''}
        . Pembayaran dilakukan di luar aplikasi.
      </p>
      {!stop.id && (
        <>
          <label>
            Alasan order tanpa PJP{' '}
            {adminPlaceId || settings.ORDER_OUTSIDE_PJP_REQUIRE_REASON === false
              ? '(opsional)'
              : '(wajib)'}
            <textarea
              maxLength={2000}
              value={contextReason}
              onChange={(e) => draft.field('contextReason')(e.target.value)}
            />
          </label>
          <p className="sales-note">Order ini tidak menambah kunjungan atau bukti presensi.</p>
        </>
      )}
      {hasPriceOverride && (
        <label>
          Alasan perubahan harga{' '}
          {settings.ORDER_PRICE_OVERRIDE_REQUIRE_REASON ? '(wajib)' : '(opsional)'}
          <textarea
            maxLength={2000}
            minLength={settings.ORDER_PRICE_OVERRIDE_REQUIRE_REASON ? 5 : undefined}
            value={priceOverrideReason}
            onChange={(e) => draft.field('priceOverrideReason')(e.target.value)}
          />
        </label>
      )}
      <p className="sales-note">
        {pending
          ? 'Pengiriman ulang mengambil order yang sama jika sudah tersimpan.'
          : `Perkiraan persetujuan: ${POLICY_OPTION_LABELS[approval.mode]}. ${approval.source === 'AMOUNT' ? 'Mengikuti batas nominal.' : approval.source === 'PRICE_OVERRIDE' ? 'Mengikuti perubahan harga.' : 'Mengikuti aturan dasar.'} Alur akhir ditetapkan saat order dibuat.`}
      </p>
      <div className="sales-order-totals">
        <p>
          <span>Subtotal</span>
          <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
        </p>
        <p>
          <span>Pajak {pricing.taxRatePercent}%</span>
          <span>Rp {pricing.taxAmount.toLocaleString('id-ID')}</span>
        </p>
        <small className="sales-note">
          Pajak {pricing.taxIncluded ? 'sudah termasuk dalam harga' : 'ditambahkan ke subtotal'}.
        </small>
        <p>
          <span>Total</span>
          <strong>Rp {pricing.totalValue.toLocaleString('id-ID')}</strong>
        </p>
      </div>
    </aside>
  );
}
