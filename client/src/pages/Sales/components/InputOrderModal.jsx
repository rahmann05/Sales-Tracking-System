import React, { useState } from 'react';
import { LuSend } from 'react-icons/lu';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { ProductForm } from '../../../shared/components/common/ProductForm';
import { useDomainPermission } from '../../../shared/hooks/useDomainPermission';
import { useInputOrderState } from '../hooks/useInputOrderState';
import { OrderSummaryPanel } from './OrderSummaryPanel';
import { ProductOrderItem } from './ProductOrderItem';
import { SalesDialog } from './SalesDialog';

/**
 * InputOrderModal Component (Single Responsibility: Order Taking Form Modal for Sales)
 */
export const InputOrderModal = ({ stop, onClose, onSubmitOrder, adminPlaceId, adminPlace }) => {
  const canCreateProduct = useDomainPermission('CREATE_PRODUCT');
  const featurePolicy = useFeaturePolicy('ORDERS');
  const [addingProduct, setAddingProduct] = useState(false);
  const [search, setSearch] = useState('');
  const state = useInputOrderState({ stop, onSubmitOrder, adminPlaceId });

  if (!stop) return null;

  const {
    products,
    setProducts,
    settings,
    draft,
    pending,
    saving,
    error,
    loadingProducts,
    productLoadError,
    loadCatalog,
    orderItems,
    setOrderItems,
    updateProductQty,
    approval,
    handleSubmit,
    resumeEditing,
  } = state;

  const visibleProducts = products.filter((p) =>
    `${p.name} ${p.code || p.sku || ''}`
      .toLocaleLowerCase('id-ID')
      .includes(search.trim().toLocaleLowerCase('id-ID'))
  );

  return (
    <SalesDialog
      title="Buat order"
      description={`${stop.outletName} · ${stop.outletCode || 'Kode belum tersedia'}`}
      onClose={onClose}
      busy={saving}
      dirty={draft.dirty || !!pending}
      restored={draft.restored}
      draftNotice={draft.restored || draft.policyChanged ? draft.restoreMessage : ''}
      draftError={draft.storageError}
      wide
    >
      {pending && (
        <div role="status" className="sales-form-help">
          Hasil pengiriman sebelumnya belum dikonfirmasi. Kirim ulang data yang sama agar tidak
          ganda.
          <button type="button" disabled={saving} className="app-button" onClick={resumeEditing}>
            Periksa hasil sebelum mengubah order
          </button>
        </div>
      )}
      <fieldset disabled={saving || !!pending}>
        <div className="sales-order-builder">
          <section className="sales-catalog">
            <h3>Pilih produk</h3>
            <label>
              Cari produk
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama atau kode produk…"
              />
            </label>
            {canCreateProduct &&
              settings.SALES_ALLOW_PRODUCT_CREATE &&
              (addingProduct ? (
                <ProductForm
                  onCancel={() => setAddingProduct(false)}
                  onSaved={(product) => {
                    setProducts((prev) => [...prev, product]);
                    setAddingProduct(false);
                  }}
                />
              ) : (
                <button type="button" className="app-button" onClick={() => setAddingProduct(true)}>
                  Tambah produk
                </button>
              ))}
            <div className="sales-product-list">
              {visibleProducts.map((prd) => {
                const existing = orderItems.find((i) => i.product.id === prd.id);
                return (
                  <div key={prd.id}>
                    <ProductOrderItem
                      product={existing?.product || prd}
                      qty={existing?.qty || 0}
                      onQtyChange={updateProductQty}
                    />
                    {settings.SALES_ALLOW_PRICE_OVERRIDE && existing && (
                      <label>
                        Harga per unit (Rp)
                        <input
                          aria-label={`Harga ${prd.name}`}
                          type="number"
                          min="1"
                          step="1"
                          value={existing.product.price}
                          onChange={(e) =>
                            setOrderItems((prev) =>
                              prev.map((i) =>
                                i.product.id === prd.id
                                  ? {
                                      ...i,
                                      product: { ...i.product, price: Number(e.target.value) },
                                    }
                                  : i
                              )
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
            {!visibleProducts.length && (
              <p className="sales-note">
                {loadingProducts ? (
                  'Memuat katalog produk…'
                ) : productLoadError ? (
                  <>
                    Gagal memuat katalog: {productLoadError}.{' '}
                    <button type="button" className="app-link" onClick={loadCatalog}>
                      Coba lagi
                    </button>
                  </>
                ) : products.length ? (
                  'Tidak ada produk sesuai pencarian.'
                ) : (
                  'Katalog produk belum tersedia. Hubungi Admin.'
                )}
              </p>
            )}
          </section>
          <OrderSummaryPanel
            {...state}
            stop={stop}
            adminPlace={adminPlace}
            adminPlaceId={adminPlaceId}
          />
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="app-error">
          {error}
        </p>
      )}
      <div className="sales-modal-actions">
        <p className="sales-note">
          {pending
            ? 'Kirim ulang isian yang sama untuk memeriksa hasil pengiriman sebelumnya.'
            : !featurePolicy.canStart
              ? featurePolicy.reason
              : approval.mode === 'NONE'
                ? 'Order diterima sesuai aturan dan dapat diproses tanpa pemeriksaan manusia.'
                : 'Order dikirim untuk pemeriksaan sebelum diproses.'}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !orderItems.length || (!pending && !featurePolicy.canStart)}
          title={!pending ? featurePolicy.reason : undefined}
          className="app-button app-button-primary"
        >
          <LuSend />
          {saving
            ? 'Mengirim…'
            : pending
              ? 'Kirim ulang order yang sama'
              : approval.mode === 'NONE'
                ? 'Kirim order'
                : 'Kirim order untuk diperiksa'}
        </button>
      </div>
    </SalesDialog>
  );
};
