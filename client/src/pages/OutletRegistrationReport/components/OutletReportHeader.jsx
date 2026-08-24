import React, { useState, useEffect } from 'react';
import { LuClipboardList, LuFileSpreadsheet, LuFileText, LuSettings, LuCheck } from 'react-icons/lu';
import { configApi } from '../../../services/api';

/**
 * OutletReportHeader Component
 * Single Responsibility: Render Report title, active division parameter manager for Admin, and export buttons.
 */
export const OutletReportHeader = ({
  totalCount,
  onExportCSV,
  onExportTXT,
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
    <div className="outlet-reg-header-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <LuClipboardList /> MASTER REGISTRASI OUTLET
            </span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface">
              Total: {totalCount} Outlet
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container-high rounded-full text-xs border border-border-glass">
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
            Modul pelaporan admin untuk ekspor data (Excel/CSV/TXT), cetak formulir resmi fisik, dan aktivasi ke master database
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExportCSV}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <LuFileSpreadsheet /> Ekspor Excel / CSV
          </button>
          <button
            type="button"
            onClick={onExportTXT}
            className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass transition-all"
          >
            <LuFileText /> Ekspor TXT
          </button>
        </div>
      </div>
    </div>
  );
};
