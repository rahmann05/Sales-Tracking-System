import React from 'react';
import { LuMapPin, LuPrinter, LuCheckCheck } from 'react-icons/lu';

/**
 * OutletReportTableRow Component
 * Single Responsibility: Render a single table row for Admin Report with activation & print triggers.
 */
export const OutletReportTableRow = ({
  item,
  onOpenPdf,
  onOpenFinalize,
}) => {
  const isApprovedAndReady =
    item.registrationStatus === 'SPV_APPROVED';

  const isAlreadyActive = item.registrationStatus === 'REGISTERED_ACTIVE';

  return (
    <tr className="hover:bg-surface-variant/20 transition-colors">
      {/* Kode Outlet */}
      <td data-label="Kode Outlet" className="py-3.5 px-4 font-mono font-bold text-xs whitespace-nowrap">
        {item.customerCode ? (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            {item.customerCode}
          </span>
        ) : (
          <span className="text-on-surface-variant/60 font-sans italic text-xs">Belum Ada</span>
        )}
      </td>

      {/* Nama & Alamat */}
      <td data-label="Nama Toko" className="py-3.5 px-4 min-w-[200px]">
        <div className="font-bold text-on-surface text-xs">{item.name}</div>
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5" title={item.address}>
          <LuMapPin className="text-primary text-xs shrink-0" />
          <span className="line-clamp-1">{item.address}</span>
        </div>
      </td>

      {/* Area & Divisi */}
      <td data-label="Area" className="py-3.5 px-4 whitespace-nowrap">
        <div className="font-bold text-on-surface text-xs">{item.area}</div>
        <div className="text-[10px] text-on-surface-variant mt-0.5">{item.division}</div>
      </td>

      {/* Channel */}
      <td data-label="Channel" className="py-3.5 px-4 whitespace-nowrap">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container border border-border-glass">
          {item.channel === 'MODERN_TRADE' ? 'MT' : 'GT'} - {item.subChannel}
        </span>
      </td>

      {/* Sales & SPV */}
      <td data-label="Sales & SPV" className="py-3.5 px-4 text-xs whitespace-nowrap">
        <div className="font-bold text-on-surface">{item.salesmanName || '-'}</div>
        <div className="text-[10px] text-on-surface-variant mt-0.5">SPV: {item.spvName || '-'}</div>
      </td>

      {/* Status */}
      <td data-label="Status" className="py-3.5 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            isAlreadyActive
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : item.registrationStatus === 'SPV_APPROVED'
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : item.registrationStatus === 'REJECTED'
              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          }`}
        >
          {item.registrationStatus}
        </span>
      </td>

      {/* Aksi */}
      <td data-label="Aksi Admin" className="py-2.5 px-3 text-center whitespace-nowrap min-w-[130px]">
        <div className="flex flex-col items-stretch justify-center gap-1.5 w-full max-w-[130px] mx-auto">
          {/* Print PDF Button */}
          <button
            type="button"
            onClick={() => onOpenPdf(item)}
            className="w-full px-2.5 py-1.5 bg-surface hover:bg-surface-container rounded-lg text-xs font-bold text-on-surface transition-all border border-border-glass flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            title="Cetak Formulir Resmi"
          >
            <LuPrinter className="text-xs shrink-0" />
            <span>Cetak PDF</span>
          </button>

          {/* Admin Activation Button */}
          {isApprovedAndReady && (
            <button
              type="button"
              onClick={() => onOpenFinalize(item)}
              className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Input ke Sistem & Aktivasi"
            >
              <LuCheckCheck className="text-xs shrink-0" />
              <span>Input ke Sistem</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
