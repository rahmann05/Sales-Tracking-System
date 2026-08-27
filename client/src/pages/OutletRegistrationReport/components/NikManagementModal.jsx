import React, { useState, useMemo } from 'react';
import {
  LuX,
  LuSearch,
  LuIdCard,
  LuSave,
  LuDownload,
  LuCheck,
  LuStore,
  LuUser,
  LuMapPin,
  LuFileSpreadsheet,
} from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';
import { exportImportNikExcel } from '../../../utils/customerExport';
import { customerRegistrationsApi, outletsApi } from '../../../services/api';

/**
 * NikManagementModal Component
 * Single Responsibility: Manage NIK input, 16-digit verification, and export to official IMPORT NIK.xls
 */
export const NikManagementModal = ({ isOpen, onClose, customerList = [], onDataUpdated }) => {
  const [search, setSearch] = useState('');
  const [filterNikStatus, setFilterNikStatus] = useState('ALL'); // 'ALL' | 'HAS_NIK' | 'NO_NIK'
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form state for selected outlet NIK edit
  const [formValues, setFormValues] = useState({
    nik: '',
    ownerName: '',
    taxAddress: '',
    taxType: 'NON_PKP',
    taxNumber: '',
  });

  const handleSelectOutlet = (item) => {
    setSelectedOutlet(item);
    setSaveSuccess(false);
    setSaveError('');

    const rawNik = String(item.taxNumber || item.nik || '').replace(/[^0-9]/g, '');
    const isPkp = item.taxType === 'PKP';

    setFormValues({
      nik: rawNik.length >= 10 && !isPkp ? rawNik : isPkp ? '' : rawNik,
      ownerName: item.taxName || item.ownerName || item.name || '',
      taxAddress: item.taxAddress || item.address || '',
      taxType: item.taxType || 'NON_PKP',
      taxNumber: item.taxNumber || '00.000.000.0-000.000',
    });
  };

  const handleSaveNik = async (e) => {
    e.preventDefault();
    if (!selectedOutlet) return;

    const cleanedNik = formValues.nik.replace(/[^0-9]/g, '');
    if (cleanedNik.length > 0 && cleanedNik.length !== 16) {
      setSaveError('NIK harus berupa 16 digit angka (KTP Indonesia)');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const updatePayload = {
        taxType: formValues.taxType,
        taxNumber: formValues.taxType === 'PKP' ? formValues.taxNumber : cleanedNik,
        taxName: formValues.ownerName,
        taxAddress: formValues.taxAddress,
        ownerName: formValues.ownerName,
      };

      if (selectedOutlet.id && selectedOutlet.registrationStatus) {
        // Customer Registration
        await customerRegistrationsApi.update(selectedOutlet.id, updatePayload);
      } else if (selectedOutlet.id) {
        // Outlet Table
        await outletsApi.update(selectedOutlet.id, updatePayload);
      }

      setSaveSuccess(true);
      if (onDataUpdated) onDataUpdated();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err.message || 'Gagal menyimpan data NIK');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredList = useMemo(() => {
    return customerList.filter((c) => {
      const code = c.customerCode || c.outletCode || '';
      const name = c.name || c.customerName || '';
      const nik = String(c.taxNumber || c.nik || '').replace(/[^0-9]/g, '');
      const owner = c.taxName || c.ownerName || '';

      const matchSearch =
        code.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        nik.includes(search) ||
        owner.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      const hasValidNik = nik.length === 16;
      if (filterNikStatus === 'HAS_NIK') return hasValidNik;
      if (filterNikStatus === 'NO_NIK') return !hasValidNik;
      return true;
    });
  }, [customerList, search, filterNikStatus]);

  if (!isOpen) return null;

  const validNikCount = customerList.filter((c) => {
    const raw = String(c.taxNumber || c.nik || '').replace(/[^0-9]/g, '');
    return raw.length === 16;
  }).length;

  const handleExportAll = () => {
    exportImportNikExcel(customerList, `IMPORT_NIK_SEMUA_${new Date().toISOString().split('T')[0]}.xls`);
  };

  const handleExportFiltered = () => {
    exportImportNikExcel(filteredList, `IMPORT_NIK_TERFILTER_${new Date().toISOString().split('T')[0]}.xls`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-border-glass rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-surface border-b border-border-glass flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-black shrink-0">
              <LuIdCard />
            </div>
            <div>
              <h3 className="text-base font-black text-on-surface m-0 flex items-center gap-2">
                Kelola & Input NIK Outlet
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-black border border-emerald-500/30">
                  Format Standar IMPORT NIK
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                Input nomor NIK 16-digit pemilik toko dan ekspor ke format Excel resmi IMPORT NIK.xlsx
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAll}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Ekspor Seluruh NIK ke File Excel IMPORT NIK.xls"
            >
              <LuDownload /> Ekspor IMPORT NIK (.xls)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer"
            >
              <LuX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Column (Table / List) + Right Column (Edit Form) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1 overflow-hidden">
          {/* Left Column: Outlet List with Filter & Search */}
          <div className="md:col-span-7 border-r border-border-glass p-4 flex flex-col gap-3 overflow-hidden bg-surface-container/20">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterNikStatus('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterNikStatus === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  Semua ({customerList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterNikStatus('HAS_NIK')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterNikStatus === 'HAS_NIK'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-surface-container text-emerald-700 hover:bg-emerald-500/10'
                  }`}
                >
                  NIK Lengkap ({validNikCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterNikStatus('NO_NIK')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterNikStatus === 'NO_NIK'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-surface-container text-amber-700 hover:bg-emerald-500/10'
                  }`}
                >
                  Belum Ada NIK ({customerList.length - validNikCount})
                </button>
              </div>

              {filteredList.length !== customerList.length && (
                <button
                  type="button"
                  onClick={handleExportFiltered}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LuDownload className="text-xs" /> Unduh ({filteredList.length})
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
              <input
                type="text"
                placeholder="Cari kode toko, nama outlet, atau NIK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Outlet Table List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
              {filteredList.map((item) => {
                const code = item.customerCode || item.outletCode || '-';
                const name = item.name || item.customerName || '-';
                const rawNik = String(item.taxNumber || item.nik || '').replace(/[^0-9]/g, '');
                const hasValidNik = rawNik.length === 16;
                const isSelected = selectedOutlet?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectOutlet(item)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-xs'
                        : 'bg-surface hover:bg-surface-container border-border-glass'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                          hasValidNik
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-amber-500/15 text-amber-700'
                        }`}
                      >
                        <LuStore />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10">
                            {code}
                          </span>
                          <h4 className="text-xs font-black text-on-surface truncate m-0">
                            {name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-mono mt-0.5">
                          {hasValidNik ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <LuCheck className="text-xs" /> NIK: {rawNik}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <FiAlertCircle className="text-xs" /> NIK Belum 16 Digit ({rawNik.length} digit)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-primary font-black shrink-0">
                      {isSelected ? 'Aktif' : 'Pilih \u2192'}
                    </span>
                  </div>
                );
              })}

              {filteredList.length === 0 && (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  Tidak ada data outlet yang sesuai dengan pencarian.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Edit / Input NIK Form */}
          <div className="md:col-span-5 p-5 bg-surface flex flex-col justify-between overflow-y-auto">
            {selectedOutlet ? (
              <form onSubmit={handleSaveNik} className="space-y-4">
                <div className="pb-3 border-b border-border-glass">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Outlet Terpilih
                  </span>
                  <h4 className="text-sm font-black text-on-surface m-0 mt-0.5">
                    {selectedOutlet.name || selectedOutlet.customerName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono mt-1">
                    <span>Kode: <b>{selectedOutlet.customerCode || selectedOutlet.outletCode || '-'}</b></span>
                    <span>•</span>
                    <span>Wilayah: {selectedOutlet.area || 'CIMAHI'}</span>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <LuCheck /> Data NIK berhasil disimpan ke database!
                  </div>
                )}

                {saveError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                    <FiAlertCircle /> {saveError}
                  </div>
                )}

                {/* NIK Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-on-surface flex items-center gap-1.5">
                      <LuIdCard className="text-primary text-sm" /> Nomor NIK (KTP Indonesia) *
                    </label>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        formValues.nik.replace(/[^0-9]/g, '').length === 16
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {formValues.nik.replace(/[^0-9]/g, '').length}/16 Digit
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    required
                    placeholder="Contoh: 3205313108950002"
                    value={formValues.nik}
                    onChange={(e) =>
                      setFormValues({ ...formValues, nik: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-mono font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                  />
                  <p className="text-[10px] text-on-surface-variant m-0">
                    Wajib 16 digit angka tanpa spasi atau tanda hubung.
                  </p>
                </div>

                {/* Nama Pemilik / Wajib Pajak */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface flex items-center gap-1.5">
                    <LuUser className="text-primary text-sm" /> Nama Pemilik KTP / Wajib Pajak *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama sesuai KTP"
                    value={formValues.ownerName}
                    onChange={(e) => setFormValues({ ...formValues, ownerName: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Alamat KTP / Toko */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface flex items-center gap-1.5">
                    <LuMapPin className="text-primary text-sm" /> Alamat Toko / Domisili
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Alamat lengkap outlet"
                    value={formValues.taxAddress}
                    onChange={(e) => setFormValues({ ...formValues, taxAddress: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Tipe Pajak */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Status Pajak</label>
                    <select
                      value={formValues.taxType}
                      onChange={(e) => setFormValues({ ...formValues, taxType: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="NON_PKP">NON PKP (Flag N)</option>
                      <option value="PKP">PKP (Flag Y)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Nomor NPWP</label>
                    <input
                      type="text"
                      placeholder="00.000.000.0-000.000"
                      value={formValues.taxNumber}
                      onChange={(e) => setFormValues({ ...formValues, taxNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-mono text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LuSave /> {isSaving ? 'Menyimpan NIK...' : 'Simpan Data NIK'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-xl text-primary mb-2">
                  <LuIdCard />
                </div>
                <h4 className="text-sm font-bold text-on-surface m-0">Pilih Outlet</h4>
                <p className="text-xs mt-1 max-w-xs">
                  Pilih salah satu toko di daftar sebelah kiri untuk menginput atau memperbarui NIK pemilik toko.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
