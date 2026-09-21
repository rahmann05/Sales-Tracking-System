import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import { outletsApi } from '../../../services/api';
import { LuPackage, LuPlus, LuTrash2, LuSearch, LuFileText, LuStore, LuChevronDown, LuChevronUp, LuX } from 'react-icons/lu';

/**
 * PackingListManager — CRUD packing lists for Kepala Gudang.
 * Allows creating packing lists by selecting an outlet, adding invoices, and specifying carton counts.
 */
export const PackingListManager = () => {
  const [packingLists, setPackingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchPackingLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getPackingLists({ search, limit: 50 });
      if (res.success) setPackingLists(res.data.items || []);
    } catch (err) {
      console.error('Error fetching packing lists:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchPackingLists, 300);
    return () => clearTimeout(timer);
  }, [fetchPackingLists]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus packing list ini?')) return;
    try {
      await deliveryApi.deletePackingList(id);
      fetchPackingLists();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuPackage className="text-primary" />
            Kelola Packing List
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Buat dan kelola packing list untuk pengiriman</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          {showCreateForm ? <LuX /> : <LuPlus />}
          {showCreateForm ? 'Batal' : 'Buat Packing List'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreatePackingListForm
          onCreated={() => {
            setShowCreateForm(false);
            fetchPackingLists();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Search */}
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode packing list atau nama toko..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant text-sm">Memuat data...</div>
      ) : packingLists.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <LuPackage className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
          <p className="text-sm text-on-surface-variant">Belum ada packing list</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packingLists.map((pl) => (
            <PackingListCard
              key={pl.id}
              pl={pl}
              expanded={expandedId === pl.id}
              onToggle={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
              onDelete={() => handleDelete(pl.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PackingListCard = ({ pl, expanded, onToggle, onDelete }) => {
  const isAssigned = pl.deliveryStops?.length > 0;

  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-variant/30 transition-colors"
        onClick={onToggle}
      >
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <LuPackage className="text-lg text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">{pl.code}</span>
            {isAssigned && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                Sudah di Rute
              </span>
            )}
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5 truncate">
            <LuStore className="inline mr-1" />
            {pl.outlet?.name} • {pl.totalCartons} Karton • {pl.invoices?.length || 0} Faktur
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isAssigned && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              title="Hapus"
            >
              <LuTrash2 className="text-sm" />
            </button>
          )}
          {expanded ? <LuChevronUp className="text-on-surface-variant" /> : <LuChevronDown className="text-on-surface-variant" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border-glass pt-3">
          <div className="text-xs text-on-surface-variant">
            Dibuat oleh: <span className="font-semibold text-on-surface">{pl.createdBy?.name}</span>
            <span className="mx-2">•</span>
            {new Date(pl.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs font-semibold text-on-surface mt-2 mb-1">Daftar Faktur:</div>
          {pl.invoices?.map((inv, idx) => (
            <div key={inv.id || idx} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-surface-variant/30">
              <LuFileText className="text-on-surface-variant shrink-0" />
              <span className="flex-1 font-medium text-on-surface">{inv.invoiceNumber}</span>
              <span className="text-on-surface-variant">{inv.totalCartons} krt</span>
              {inv.totalAmount && (
                <span className="text-on-surface-variant">Rp {inv.totalAmount.toLocaleString('id-ID')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreatePackingListForm = ({ onCreated, onCancel }) => {
  const [outlets, setOutlets] = useState([]);
  const [outletSearch, setOutletSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [invoices, setInvoices] = useState([{ invoiceNumber: '', totalCartons: 1, totalAmount: '' }]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const res = await outletsApi.getAll({ search: outletSearch, limit: 20 });
        if (res.success) setOutlets(res.data?.outlets || res.data || []);
      } catch (err) {
        console.error('Error fetching outlets:', err);
      }
    };
    if (outletSearch.length >= 2) {
      const timer = setTimeout(fetchOutlets, 300);
      return () => clearTimeout(timer);
    }
  }, [outletSearch]);

  const addInvoice = () => {
    setInvoices([...invoices, { invoiceNumber: '', totalCartons: 1, totalAmount: '' }]);
  };

  const removeInvoice = (idx) => {
    if (invoices.length <= 1) return;
    setInvoices(invoices.filter((_, i) => i !== idx));
  };

  const updateInvoice = (idx, field, value) => {
    const updated = [...invoices];
    updated[idx] = { ...updated[idx], [field]: value };
    setInvoices(updated);
  };

  const totalCartons = invoices.reduce((sum, inv) => sum + (parseInt(inv.totalCartons) || 0), 0);

  const handleSubmit = async () => {
    if (!selectedOutlet) return alert('Pilih toko terlebih dahulu');
    if (invoices.some((inv) => !inv.invoiceNumber.trim())) return alert('Semua nomor faktur wajib diisi');

    setSubmitting(true);
    try {
      await deliveryApi.createPackingList({
        outletId: selectedOutlet.id,
        totalCartons,
        notes: notes || undefined,
        invoices: invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber.trim(),
          totalCartons: parseInt(inv.totalCartons) || 1,
          totalAmount: inv.totalAmount ? parseFloat(inv.totalAmount) : undefined,
        })),
      });
      onCreated();
    } catch (err) {
      alert(err.message || 'Gagal membuat packing list');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-on-surface">Buat Packing List Baru</h3>

      {/* Outlet Selection */}
      <div className="relative">
        <label className="text-xs font-semibold text-on-surface-variant block mb-1">Toko Tujuan</label>
        {selectedOutlet ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <LuStore className="text-primary shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-on-surface">{selectedOutlet.name}</div>
              <div className="text-xs text-on-surface-variant">{selectedOutlet.address}</div>
            </div>
            <button onClick={() => setSelectedOutlet(null)} className="text-on-surface-variant hover:text-red-500">
              <LuX />
            </button>
          </div>
        ) : (
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
            <input
              type="text"
              value={outletSearch}
              onChange={(e) => { setOutletSearch(e.target.value); setShowOutletDropdown(true); }}
              onFocus={() => setShowOutletDropdown(true)}
              placeholder="Ketik nama toko (min 2 huruf)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {showOutletDropdown && outlets.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-surface border border-border-glass rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {outlets.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setSelectedOutlet(o); setShowOutletDropdown(false); setOutletSearch(''); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-variant/50 transition-colors border-b border-border-glass last:border-0"
                  >
                    <div className="text-sm font-medium text-on-surface">{o.name}</div>
                    <div className="text-xs text-on-surface-variant">{o.address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-on-surface-variant">Daftar Faktur</label>
          <button
            onClick={addInvoice}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <LuPlus className="text-xs" /> Tambah Faktur
          </button>
        </div>
        <div className="space-y-2">
          {invoices.map((inv, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={inv.invoiceNumber}
                onChange={(e) => updateInvoice(idx, 'invoiceNumber', e.target.value)}
                placeholder="No. Faktur"
                className="flex-1 px-3 py-2 rounded-lg border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                value={inv.totalCartons}
                onChange={(e) => updateInvoice(idx, 'totalCartons', e.target.value)}
                placeholder="Krt"
                min="1"
                className="w-20 px-3 py-2 rounded-lg border border-border-glass bg-surface text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                value={inv.totalAmount}
                onChange={(e) => updateInvoice(idx, 'totalAmount', e.target.value)}
                placeholder="Rp (opsional)"
                className="w-32 px-3 py-2 rounded-lg border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => removeInvoice(idx)}
                disabled={invoices.length <= 1}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
              >
                <LuTrash2 className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Total & Notes */}
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold">
          Total: {totalCartons} Karton
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan (opsional)"
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-border-glass hover:bg-surface-variant transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedOutlet}
          className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Packing List'}
        </button>
      </div>
    </div>
  );
};
