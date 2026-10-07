import React from 'react';
import { LuIdCard, LuSave, LuCheck, LuUser, LuMapPin } from "react-icons/lu";
import { FiAlertCircle } from 'react-icons/fi';
/**
 * NikManagementModal Component
 * Single Responsibility: Manage NIK input, 16-digit verification, and export to official IMPORT NIK.xls
 */
export function NikRegistryEditor({
  formValues,
  handleSaveNik,
  isSaving,
  saveError,
  saveSuccess,
  selectedOutlet,
  setFormValues
}) {
  return <div className="md:col-span-5 p-5 bg-surface flex flex-col justify-between overflow-y-auto">
            {selectedOutlet ? <form onSubmit={handleSaveNik} className="space-y-4">
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

                {saveSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <LuCheck /> Data NIK berhasil disimpan ke database!
                  </div>}

                {saveError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                    <FiAlertCircle /> {saveError}
                  </div>}

                {/* NIK Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-on-surface flex items-center gap-1.5">
                      <LuIdCard className="text-primary text-sm" /> Nomor NIK (KTP Indonesia) *
                    </label>
                    <span className={`text-[10px] font-mono font-bold ${formValues.nik.replace(/[^0-9]/g, '').length === 16 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formValues.nik.replace(/[^0-9]/g, '').length}/16 Digit
                    </span>
                  </div>
                  <input type="text" maxLength={16} required placeholder="Contoh: 3205313108950002" value={formValues.nik} onChange={e => setFormValues({
          ...formValues,
          nik: e.target.value.replace(/[^0-9]/g, '')
        })} className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-mono font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
                  <p className="text-[10px] text-on-surface-variant m-0">
                    Wajib 16 digit angka tanpa spasi atau tanda hubung.
                  </p>
                </div>

                {/* Nama Pemilik / Wajib Pajak */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface flex items-center gap-1.5">
                    <LuUser className="text-primary text-sm" /> Nama Pemilik KTP / Wajib Pajak *
                  </label>
                  <input type="text" required placeholder="Nama sesuai KTP" value={formValues.ownerName} onChange={e => setFormValues({
          ...formValues,
          ownerName: e.target.value.toUpperCase()
        })} className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
                </div>

                {/* Alamat KTP / Toko */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface flex items-center gap-1.5">
                    <LuMapPin className="text-primary text-sm" /> Alamat Toko / Domisili
                  </label>
                  <textarea rows={2} placeholder="Alamat lengkap outlet" value={formValues.taxAddress} onChange={e => setFormValues({
          ...formValues,
          taxAddress: e.target.value.toUpperCase()
        })} className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
                </div>

                {/* Tipe Pajak */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Status Pajak</label>
                    <select value={formValues.taxType} onChange={e => setFormValues({
            ...formValues,
            taxType: e.target.value
          })} className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none">
                      <option value="NON_PKP">NON PKP (Flag N)</option>
                      <option value="PKP">PKP (Flag Y)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Nomor NPWP</label>
                    <input type="text" placeholder="00.000.000.0-000.000" value={formValues.taxNumber} onChange={e => setFormValues({
            ...formValues,
            taxNumber: e.target.value
          })} className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs font-mono text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-3">
                  <button type="submit" disabled={isSaving} className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
                    <LuSave /> {isSaving ? 'Menyimpan NIK...' : 'Simpan Data NIK'}
                  </button>
                </div>
              </form> : <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-xl text-primary mb-2">
                  <LuIdCard />
                </div>
                <h4 className="text-sm font-bold text-on-surface m-0">Pilih Outlet</h4>
                <p className="text-xs mt-1 max-w-xs">
                  Pilih salah satu toko di daftar sebelah kiri untuk menginput atau memperbarui NIK pemilik toko.
                </p>
              </div>}
          </div>;
}
