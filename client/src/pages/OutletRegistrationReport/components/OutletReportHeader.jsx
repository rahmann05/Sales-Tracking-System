import React, { useState, useEffect } from 'react';
import { LuFileText, LuIdCard } from 'react-icons/lu';
import { configApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { notifyError } from '../../../services/notificationService';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';

const FALLBACK_DIVISIONS = [
  { code: 'BELFOODS', name: 'BELFOODS' },
  { code: 'UNICHARM', name: 'UNICHARM' },
  { code: 'GENERAL', name: 'GENERAL' },
];

/**
 * OutletReportHeader Component
 * Single Responsibility: Render Report title, active division selector, and export actions.
 */
export const OutletReportHeader = ({
  totalCount,
  outletExporters,
  nikExporters,
  onExportNd6TXT,
  onOpenNikModal,
}) => {
  const { divisions = [] } = useApp();
  const [activeDivision, setActiveDivision] = useState('BELFOODS');
  const [isUpdatingDiv, setIsUpdatingDiv] = useState(false);
  const [divUpdateSuccess, setDivUpdateSuccess] = useState(false);

  const divisionOptions =
    Array.isArray(divisions) && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS;

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
      notifyError('Gagal memperbarui konfigurasi divisi: ' + err.message);
    } finally {
      setIsUpdatingDiv(false);
    }
  };

  return (
    <div className="outlet-reg-header-card">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-on-surface-variant m-0">
            Master registrasi outlet · {totalCount} outlet
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight m-0">
            Laporan registrasi outlet
          </h1>
          <p className="text-xs text-on-surface-variant m-0">
            Telusuri status pengajuan toko, cetak formulir, dan ekspor data pelanggan.
          </p>
        </div>

        <div className="flex items-end gap-2 flex-wrap lg:justify-end shrink-0">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-on-surface-variant">
            <span>
              Divisi aktif sistem
              {divUpdateSuccess && (
                <span className="ml-1.5 text-emerald-700 font-semibold">· Tersimpan</span>
              )}
            </span>
            <select
              value={activeDivision}
              disabled={isUpdatingDiv}
              onChange={(e) => handleChangeDivision(e.target.value)}
              className="h-9 px-3 rounded-lg bg-surface border border-border-glass text-xs font-semibold text-on-surface cursor-pointer focus:ring-2 focus:ring-primary outline-none"
            >
              {divisionOptions.map((div) => (
                <option key={div.code} value={div.code}>
                  {div.name || div.code}
                </option>
              ))}
              {!divisionOptions.some((d) => d.code === activeDivision) && (
                <option value={activeDivision}>{activeDivision}</option>
              )}
            </select>
          </label>

          {onOpenNikModal && (
            <button
              type="button"
              onClick={onOpenNikModal}
              className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Kelola dan Input NIK 16-Digit Pemilik Toko"
            >
              <LuIdCard className="text-sm" /> <span>Kelola NIK</span>
            </button>
          )}

          <ExportFormatMenu
            label="Ekspor Master Outlet"
            exporters={outletExporters}
            disabled={!totalCount}
          />

          <ExportFormatMenu
            label="Ekspor IMPORT NIK"
            exporters={nikExporters}
            disabled={!totalCount}
          />

          {onExportNd6TXT && (
            <button
              type="button"
              onClick={onExportNd6TXT}
              className="h-9 px-3 rounded-lg bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 border border-border-glass transition-colors cursor-pointer whitespace-nowrap"
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
