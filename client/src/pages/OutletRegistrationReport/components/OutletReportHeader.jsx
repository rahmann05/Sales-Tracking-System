import React, { useState, useEffect } from 'react';
import { LuClipboardList, LuFileText, LuSettings, LuCheck, LuIdCard } from 'react-icons/lu';
import { configApi } from '../../../services/api';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';

/**
 * OutletReportHeader Component
 * Single Responsibility: Render Report title, active division parameter manager for Admin, and 5-format export menus.
 */
export const OutletReportHeader = ({
  totalCount,
  outletExporters,
  nikExporters,
  onExportNd6TXT,
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
            Laporan registrasi outlet
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 m-0">
            Telusuri status pengajuan toko, cetak formulir, dan ekspor data pelanggan.
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
              <LuIdCard className="text-sm" /> <span>Kelola NIK</span>
            </button>
          )}

          {/* 5-Format Master Outlet Export Menu */}
          <ExportFormatMenu
            label="Ekspor Master Outlet"
            exporters={outletExporters}
            disabled={!totalCount}
          />

          {/* 5-Format Official IMPORT NIK Export Menu */}
          <ExportFormatMenu
            label="Ekspor IMPORT NIK"
            exporters={nikExporters}
            disabled={!totalCount}
          />

          {onExportNd6TXT && (
            <button
              type="button"
              onClick={onExportNd6TXT}
              className="h-9 px-3 rounded-xl bg-surface hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Ekspor Format Data Stream ND6 (TXT/Pipe)"
            >
              <LuFileText /> <span>ND6 TXT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
