import React from 'react';
import { LuX } from 'react-icons/lu';
import { BusinessCodeInput } from '../../shared/components/common/BusinessCodeInput';

export function OutletFormModal({ mode, clusterList, formData, setFormData, onSubmit, onClose, saving, error }) {
  const creating = mode === 'create';
  const title = creating ? 'Tambah outlet baru' : 'Edit master data outlet';
  const update = (key, value) => setFormData(previous => ({ ...previous, [key]: value }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <section role="dialog" aria-modal="true" aria-labelledby="outlet-form-title" className="bg-surface border border-border-glass rounded-xl p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto space-y-4">
        <header className="flex items-center justify-between gap-3 border-b border-border-glass pb-3">
          <h2 id="outlet-form-title" className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup formulir outlet" className="p-2"><LuX /></button>
        </header>
        <form onSubmit={onSubmit} className="space-y-4 text-sm">
          {creating && <BusinessCodeInput entity="OUTLET" value={formData.outletCode} onChange={value => update('outletCode', value)} disabled={saving} />}
          {error && <p role="alert" className="text-red-600">{error}</p>}
          <label className="block space-y-1">
            <span>Nama outlet / toko</span>
            <input required value={formData.name} onChange={event => update('name', event.target.value)} className="form-input" />
          </label>
          <label className="block space-y-1">
            <span>Alamat lengkap</span>
            <textarea rows={2} required value={formData.address} onChange={event => update('address', event.target.value)} className="form-textarea" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['latitude', 'longitude'].map(key => (
              <label key={key} className="block space-y-1">
                <span>{key === 'latitude' ? 'Latitude' : 'Longitude'} (GPS)</span>
                <input type="number" step="any" required value={formData[key]} onChange={event => update(key, event.target.value)} className="form-input font-mono" />
              </label>
            ))}
          </div>
          <label className="block space-y-1">
            <span>Klaster wilayah</span>
            <select value={formData.clusterId || ''} onChange={event => {
              const cluster = clusterList.find(item => item.id === event.target.value);
              setFormData(previous => ({ ...previous, clusterId: event.target.value, clusterName: cluster?.name || '' }));
            }} className="form-select">
              <option value="" disabled>Pilih klaster wilayah</option>
              {clusterList.map(cluster => <option key={cluster.id} value={cluster.id}>{cluster.name} ({cluster.region})</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-3 border-t border-border-glass pt-4">
            <button type="button" onClick={onClose} className="border rounded-lg px-4 py-2">Batal</button>
            <button type="submit" disabled={saving} className="bg-primary text-on-primary rounded-lg px-4 py-2">{saving ? 'Menyimpan…' : 'Simpan outlet'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
