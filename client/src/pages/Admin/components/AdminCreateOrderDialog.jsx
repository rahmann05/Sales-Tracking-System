import React, { useEffect, useState } from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { InputOrderModal } from '../../Sales/components/InputOrderModal';
import { ordersApi, outletsApi } from '../../../services/api';

export function AdminCreateOrderDialog({ onClose, onSaved }) {
  const [query, setQuery] = useState(''),
    [page, setPage] = useState(1),
    [directory, setDirectory] = useState(null),
    [outlet, setOutlet] = useState(null),
    [places, setPlaces] = useState(null),
    [placeQuery, setPlaceQuery] = useState(''),
    [place, setPlace] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (outlet) return;
    let live = true;
    const timer = setTimeout(() => {
      setBusy(true);
      outletsApi
        .directory({ search: query, page, limit: 20 })
        .then((value) => {
          if (live) {
            setDirectory(value);
            setError('');
          }
        })
        .catch((e) => {
          if (live) setError(e.message);
        })
        .finally(() => {
          if (live) setBusy(false);
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, page, outlet]);
  async function loadPlaces(targetOutlet = outlet, customQuery = placeQuery) {
    if (!targetOutlet || customQuery.trim().length < 3) return;
    setBusy(true);
    setError('');
    try {
      const res = await ordersApi.adminPlaces(targetOutlet.id, customQuery);
      setPlaces(res.data || []);
      setPlace(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const selectOutlet = (row) => {
    const nextQuery = `${row.name} ${row.address || ''}`.trim();
    setOutlet(row);
    setPlaceQuery(nextQuery);
    setPlaces(null);
    if (nextQuery.length >= 3) loadPlaces(row, nextQuery);
  };
  const verifiedMasterPlace =
    outlet?.googleLocation?.placeId &&
    Number.isFinite(Number(outlet.googleLocation.latitude ?? outlet.latitude)) &&
    Number.isFinite(Number(outlet.googleLocation.longitude ?? outlet.longitude))
      ? {
          placeId: outlet.googleLocation.placeId,
          name: outlet.googleLocation.name || outlet.name,
          address: outlet.googleLocation.formattedAddress || outlet.address || '',
          latitude: Number(outlet.googleLocation.latitude ?? outlet.latitude),
          longitude: Number(outlet.googleLocation.longitude ?? outlet.longitude),
        }
      : null;
  if (place)
    return (
      <InputOrderModal
        stop={{
          outletId: outlet.id,
          outletName: outlet.name,
          outletCode: outlet.outletCode,
          outlet,
        }}
        adminPlaceId={place.placeId}
        adminPlace={place}
        onClose={onClose}
        onSubmitOrder={async (payload) => {
          await ordersApi.createOrder(payload);
          await onSaved();
          onClose();
        }}
      />
    );
  return (
    <NativeDialog open title="Buat order Admin" onClose={onClose}>
      <div className="grid gap-4">
        <div className="logistics-flow-strip" aria-label="Langkah pembuatan order Admin">
          <div
            className={`logistics-flow-step ${!outlet ? 'is-active' : ''}`}
            style={{ cursor: 'default' }}
          >
            <span className="logistics-flow-num">1</span>
            <span className="logistics-flow-step-text">
              <span>Pilih outlet</span>
              <small>{outlet ? outlet.name : 'Cari di daftar toko'}</small>
            </span>
          </div>
          <div
            className={`logistics-flow-step ${outlet ? 'is-active' : ''}`}
            style={{ cursor: 'default' }}
          >
            <span className="logistics-flow-num">2</span>
            <span className="logistics-flow-step-text">
              <span>Konfirmasi titik kirim Google</span>
              <small>{verifiedMasterPlace ? 'Titik master tersedia' : 'Pilih kandidat peta'}</small>
            </span>
          </div>
        </div>
        <p>
          Admin memilih outlet dan mengonfirmasi titik pengirimannya dari Google. Titik yang dipilih
          disimpan pada order dan menjadi tujuan tetap supir saat packing dikirim.
        </p>
        {!outlet ? (
          <>
            <label className="app-field">
              Cari outlet
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            {directory?.data?.map((row) => (
              <button
                className="app-button text-left"
                type="button"
                key={row.id}
                onClick={() => selectOutlet(row)}
              >
                <strong>{row.name}</strong>
                <span className="block">
                  {row.outletCode || 'Tanpa kode'} · {row.address}
                </span>
              </button>
            ))}
            <nav className="app-actions">
              <button
                type="button"
                className="app-button"
                disabled={page <= 1 || busy}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <span>
                {page} / {directory?.pagination?.totalPages || 1}
              </span>
              <button
                type="button"
                className="app-button"
                disabled={busy || page >= (directory?.pagination?.totalPages || 1)}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </nav>
          </>
        ) : (
          <>
            <button
              className="app-button"
              type="button"
              onClick={() => {
                setOutlet(null);
                setPlaces(null);
              }}
            >
              ← Ganti outlet
            </button>
            <div className="rounded-xl border border-border-glass p-3 bg-surface">
              <strong>{outlet.name}</strong>
              <p>{outlet.address || 'Alamat belum tersedia'}</p>
            </div>
            {verifiedMasterPlace && (
              <article className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                <strong className="text-sm text-on-surface">
                  Titik Google master terverifikasi
                </strong>
                <p className="text-xs text-on-surface-variant">
                  {verifiedMasterPlace.name} · {verifiedMasterPlace.address} (
                  {verifiedMasterPlace.latitude.toFixed(6)},{' '}
                  {verifiedMasterPlace.longitude.toFixed(6)})
                </p>
                <button
                  type="button"
                  className="app-button app-button-primary"
                  onClick={() => setPlace(verifiedMasterPlace)}
                >
                  Langsung gunakan titik master ini
                </button>
              </article>
            )}
            <label className="app-field">
              Cari toko atau alamat lain di Google
              <input
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Nama toko, jalan, kota"
              />
            </label>
            <button
              className="app-button"
              type="button"
              disabled={busy || placeQuery.trim().length < 3}
              onClick={() => loadPlaces(outlet, placeQuery)}
            >
              {busy ? 'Mencari…' : 'Cari ulang titik Google'}
            </button>
            {places?.length === 0 && (
              <p role="status">
                Google tidak menemukan kandidat. Perjelas nama atau alamat, lalu cari ulang.
              </p>
            )}
            {places?.map((row) => (
              <article key={row.placeId} className="rounded-xl border p-3 space-y-2">
                <strong>{row.name}</strong>
                <p>{row.address}</p>
                <p className="text-sm">
                  {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}
                  {row.businessStatus === 'CLOSED_PERMANENTLY' ? ' · Tutup permanen' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="app-button"
                    href={`https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(row.placeId)}&query=${encodeURIComponent(row.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Periksa di peta
                  </a>
                  <button
                    className="app-button app-button-primary"
                    type="button"
                    disabled={row.businessStatus === 'CLOSED_PERMANENTLY'}
                    onClick={() => setPlace(row)}
                  >
                    Gunakan titik ini
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
        {error && (
          <p role="alert" className="app-error">
            {error}
          </p>
        )}
      </div>
    </NativeDialog>
  );
}
