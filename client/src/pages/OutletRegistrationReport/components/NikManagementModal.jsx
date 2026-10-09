import { NikRegistryList } from './NikRegistryList';
import { NikRegistryEditor } from './NikRegistryEditor';
import React, { useState, useMemo } from 'react';
import { LuX, LuIdCard, LuDownload } from "react-icons/lu";
import { exportImportNikExcel } from '../../../utils/customerExport';
import { customerRegistrationsApi, outletsApi } from '../../../services/api';

/**
 * NikManagementModal Component
 * Single Responsibility: Manage NIK input, 16-digit verification, and export to official IMPORT NIK.xls
 */
export const NikManagementModal = ({
  isOpen,
  onClose,
  customerList = [],
  onDataUpdated
}) => {
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
    taxNumber: ''
  });
  const handleSelectOutlet = item => {
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
      taxNumber: item.taxNumber || '00.000.000.0-000.000'
    });
  };
  const handleSaveNik = async e => {
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
        updatedAt:selectedOutlet.updatedAt,reason:'Pembaruan identitas pajak dan NIK pemilik outlet',
        taxType: formValues.taxType,
        taxNumber: formValues.taxType === 'PKP' ? formValues.taxNumber : cleanedNik,
        taxName: formValues.ownerName,
        taxAddress: formValues.taxAddress,
        ownerName: formValues.ownerName
      };
      if (selectedOutlet.id && selectedOutlet.registrationStatus) {
        // Customer Registration
        const response=await customerRegistrationsApi.update(selectedOutlet.id, updatePayload);
        setSelectedOutlet(previous=>({...previous,...response.data}));
      } else if (selectedOutlet.id) {
        // Outlet Table
        const response=await outletsApi.update(selectedOutlet.id, updatePayload);
        setSelectedOutlet(previous=>({...previous,...response.data}));
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
    return customerList.filter(c => {
      const code = c.customerCode || c.outletCode || '';
      const name = c.name || c.customerName || '';
      const nik = String(c.taxNumber || c.nik || '').replace(/[^0-9]/g, '');
      const owner = c.taxName || c.ownerName || '';
      const matchSearch = code.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase()) || nik.includes(search) || owner.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      const hasValidNik = nik.length === 16;
      if (filterNikStatus === 'HAS_NIK') return hasValidNik;
      if (filterNikStatus === 'NO_NIK') return !hasValidNik;
      return true;
    });
  }, [customerList, search, filterNikStatus]);
  if (!isOpen) return null;
  const validNikCount = customerList.filter(c => {
    const raw = String(c.taxNumber || c.nik || '').replace(/[^0-9]/g, '');
    return raw.length === 16;
  }).length;
  const handleExportAll = () => {
    exportImportNikExcel(customerList, `IMPORT_NIK_SEMUA_${new Date().toISOString().split('T')[0]}.xls`);
  };
  const handleExportFiltered = () => {
    exportImportNikExcel(filteredList, `IMPORT_NIK_TERFILTER_${new Date().toISOString().split('T')[0]}.xls`);
  };
  return <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
            <button type="button" onClick={handleExportAll} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer" title="Ekspor Seluruh NIK ke File Excel IMPORT NIK.xls">
              <LuDownload /> Ekspor IMPORT NIK (.xls)
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer">
              <LuX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Column (Table / List) + Right Column (Edit Form) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1 overflow-hidden">
          {/* Left Column: Outlet List with Filter & Search */}
          <NikRegistryList customerList={customerList} filterNikStatus={filterNikStatus} filteredList={filteredList} handleExportFiltered={handleExportFiltered} handleSelectOutlet={handleSelectOutlet} search={search} selectedOutlet={selectedOutlet} setFilterNikStatus={setFilterNikStatus} setSearch={setSearch} validNikCount={validNikCount} />

          {/* Right Column: Edit / Input NIK Form */}
          <NikRegistryEditor formValues={formValues} handleSaveNik={handleSaveNik} isSaving={isSaving} saveError={saveError} saveSuccess={saveSuccess} selectedOutlet={selectedOutlet} setFormValues={setFormValues} />
        </div>
      </div>
    </div>;
};
