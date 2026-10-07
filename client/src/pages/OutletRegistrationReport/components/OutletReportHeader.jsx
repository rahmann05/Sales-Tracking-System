import React, { useState, useEffect } from 'react';
import { LuClipboardList, LuFileSpreadsheet, LuFileText, LuSettings, LuCheck, LuIdCard } from 'react-icons/lu';
import { configApi } from '../../../services/api';

/**
 * OutletReportHeader Component
 * Single Responsibility: Render Report title, active division parameter manager for Admin, and export buttons.
 */
export const OutletReportHeader = ({
  totalCount,
  onExportCSV,
  onExportNd6TXT,
  onExportTXT,
  onExportNikExcel,
  onOpenNikModal,
}) => {
  const [activeDivision, setActiveDivision] = useState('BELFOODS');
  const [isUpdatingDiv, setIsUpdatingDiv] = useState(false);
  const [divUpdateSuccess, setDivUpdateSuccess] = useState(false);

  useEffect(() => {
    const loadDiv = async () => {
      try {
        const res = await configApi.getByKey('ACTIVE_DIVISION');
        if (res?.data) {
          const val = typeof res.data === 'string' ? res.data : res.data.value || 'BELFOODS';
          setActiveDivision(val);
        }
      } catch (err) {
        console.warn('[OutletReportHeader] Load division config error:', err);
      }
    };
    loadDiv();
  }, []);

  const handleChangeDivision = async (newDiv) => {
    setIsUpdatingDiv(true);
    setDivUpdateSuccess(false);
    try {
      await configApi.updateByKey('ACTIVE_DIVISION', newDiv);
      setActiveDivision(newDiv);
      setDivUpdateSuccess(true);
      setTimeout(() => setDivUpdateSuccess(false), 2000);
    } catch (err) {
      alert('Gagal memperbarui konfigurasi divisi: ' + err.message);
    } finally {
      setIsUpdatingDiv(false);
    }
  };

  return (
    <div className="outlet-reg-header-card bg-surface border border-border-glass rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <LuClipboardList /> MASTER REGISTRASI OUTLET
            </span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface">
              Total: {totalCount} Outlet
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-full text-xs border border-border-glass">
              <LuSettings className="text-primary text-xs" />
              <span className="text-[11px] font-bold text-on-surface-variant">Divisi Aktif Sistem:</span>
              <select
                value={activeDivision}
                disabled={isUpdatingDiv}
                onChange={(e) => handleChangeDivision(e.target.value)}
                className="bg-transparent font-extrabold text-primary text-xs border-none cursor-pointer focus:ring-0 focus:outline-hidden"
              >
                <option value="BELFOODS">BELFOODS (BFI)</option>
                <option value="UNICHARM">UNICHARM</option>
                <option value="GENERAL">GENERAL FMCG</option>
              </select>
              {divUpdateSuccess && <LuCheck className="text-emerald-600 text-xs" />}
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-on-surface tracking-tight m-0">
            Laporan Pendaftaran & Approval Outlet
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 m-0">
            Modul pelaporan admin untuk ekspor data (Excel/CSV/TXT), kelola & input NIK KTP, cetak formulir resmi fisik, dan aktivasi ke master database
          </p>
        </div>

        {/* Export & NIK Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0">
          {onOpenNikModal && (
            <button
              type="button"
              onClick={onOpenNikModal}
              className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Kelola dan Input NIK 16-Digit Pemilik Toko"
            >
              <LuIdCard className="text-sm" /> <span>Kelola / Input NIK</span>
            </button>
          )}
          {onExportNikExcel && (
            <button
              type="button"
              onClick={onExportNikExcel}
              className="h-9 px-3.5 rounded-xl bg-surface hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Ekspor Format Resmi IMPORT NIK.xlsx (7 Kolom: Code, Name, NIK, Owner, Alamat, PKP, NPWP)"
            >
              <LuFileSpreadsheet /> <span>Ekspor IMPORT NIK</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportCSV}
            className="h-9 px-3.5 rounded-xl bg-surface hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Ekspor Laporan Master Tabel ke Excel (.xls)"
          >
            <LuFileSpreadsheet /> <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={onExportNd6TXT}
            className="h-9 px-3.5 rounded-xl bg-surface hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Ekspor Format Data Stream (TXT/Pipe)"
          >
            <LuFileText /> <span>Ekspor TXT</span>
          </button>
          <button
            type="button"
            onClick={onExportTXT}
            className="h-9 px-3.5 rounded-xl bg-surface hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Ekspor Ringkasan Teks Terbaca"
          >
            <LuFileText /> <span>Ringkasan TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
