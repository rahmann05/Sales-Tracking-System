import { notifyError } from '../../../services/notificationService';
import { NikRegistryList } from './NikRegistryList';
import { NikRegistryEditor } from './NikRegistryEditor';
import React, { useState, useMemo } from 'react';
import { LuIdCard } from 'react-icons/lu';
import { exportImportNikExcel } from '../../../utils/customerExport';
import { exportImportNik } from '../../../utils/export/documents/importNikExport';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { customerRegistrationsApi, outletsApi } from '../../../services/api';

/**
 * NikManagementModal Component
 * Single Responsibility: Manage NIK input, 16-digit verification, and 5-format export to official IMPORT NIK
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
        updatedAt: selectedOutlet.updatedAt,
        reason: 'Pembaruan identitas pajak dan NIK pemilik outlet',
        taxType: formValues.taxType,
        taxNumber: formValues.taxType === 'PKP' ? formValues.taxNumber : cleanedNik,
        taxName: formValues.ownerName,
        taxAddress: formValues.taxAddress,
        ownerName: formValues.ownerName,
      };
      if (selectedOutlet.id && selectedOutlet.registrationStatus) {
        // Customer Registration
        const response = await customerRegistrationsApi.update(selectedOutlet.id, updatePayload);
        setSelectedOutlet((previous) => ({ ...previous, ...response.data }));
      } else if (selectedOutlet.id) {
        // Outlet Table
        const response = await outletsApi.update(selectedOutlet.id, updatePayload);
        setSelectedOutlet((previous) => ({ ...previous, ...response.data }));
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
  const validNikCount = customerList.filter((c) => {
    const raw = String(c.taxNumber || c.nik || '').replace(/[^0-9]/g, '');
    return raw.length === 16;
  }).length;
  const dateCode = new Date().toISOString().split('T')[0];
  const nikExporters = exportImportNik(customerList, `IMPORT_NIK_SEMUA_${dateCode}`);
  const handleExportFiltered = () => {
    return exportImportNikExcel(filteredList, `IMPORT_NIK_TERFILTER_${dateCode}.xlsx`).catch(
      (error) => notifyError(error.message)
    );
  };
  return (
    <NativeDialog
      open={isOpen}
      title="Kelola & Input NIK Outlet"
      onClose={onClose}
      className="wide-modal-dialog"
    >
      <div className="flex flex-col md:max-h-[82vh] md:overflow-hidden rounded-xl border border-border-glass bg-surface">
        <div className="px-4 py-3 bg-surface border-b border-border-glass flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-black shrink-0">
              <LuIdCard />
            </div>
            <div>
              <div className="text-xs font-black text-on-surface flex flex-wrap items-center gap-2">
                <span>Input NIK 16-digit & Ekspor Resmi</span>
                <span className="admin-status admin-status-released">
                  Format Standar IMPORT NIK
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
                Lengkapi data NIK pemilik toko dan ekspor ke 5 format dokumen IMPORT NIK
              </p>
            </div>
          </div>

          <ExportFormatMenu
            label="Ekspor IMPORT NIK"
            exporters={nikExporters}
            disabled={!customerList.length}
            compact
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1 md:overflow-hidden">
          <NikRegistryList
            customerList={customerList}
            filterNikStatus={filterNikStatus}
            filteredList={filteredList}
            handleExportFiltered={handleExportFiltered}
            handleSelectOutlet={handleSelectOutlet}
            search={search}
            selectedOutlet={selectedOutlet}
            setFilterNikStatus={setFilterNikStatus}
            setSearch={setSearch}
            validNikCount={validNikCount}
          />

          <NikRegistryEditor
            formValues={formValues}
            handleSaveNik={handleSaveNik}
            isSaving={isSaving}
            saveError={saveError}
            saveSuccess={saveSuccess}
            selectedOutlet={selectedOutlet}
            setFormValues={setFormValues}
          />
        </div>
      </div>
    </NativeDialog>
  );
};
