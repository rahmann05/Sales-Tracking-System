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
    item.registrationStatus === 'SPV_APPROVED' ||
    item.registrationStatus === 'OPS_APPROVED' ||
    item.registrationStatus === 'SUBMITTED';

  const isAlreadyActive = item.registrationStatus === 'REGISTERED_ACTIVE';

  return (
    <tr className="hover:bg-surface-variant/20 transition-colors">
      {/* Kode Outlet */}
      <td className="py-3 px-4 font-mono font-bold text-xs">
        {item.customerCode ? (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            {item.customerCode}
          </span>
        ) : (
          <span className="text-on-surface-variant italic">Belum Ada</span>
        )}
      </td>

      {/* Nama & Alamat */}
      <td className="py-3 px-4">
        <div className="font-bold text-on-surface text-xs">{item.name}</div>
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
          <LuMapPin className="text-primary text-xs shrink-0" />
          <span>{item.address}</span>
        </div>
      </td>

      {/* Area & Divisi */}
      <td className="py-3 px-4">
        <div className="font-bold text-on-surface text-xs">{item.area}</div>
        <div className="text-[10px] text-on-surface-variant">{item.division}</div>
      </td>

      {/* Channel */}
      <td className="py-3 px-4">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container border border-border-glass">
          {item.channel === 'MODERN_TRADE' ? 'MT' : 'GT'} - {item.subChannel}
        </span>
      </td>

      {/* Sales & SPV */}
      <td className="py-3 px-4 text-[11px]">
        <div className="font-bold text-on-surface">{item.salesmanName || '-'}</div>
        <div className="text-[10px] text-on-surface-variant">SPV: {item.spvName || '-'}</div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
            isAlreadyActive
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : item.registrationStatus === 'SPV_APPROVED'
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : item.registrationStatus === 'OPS_APPROVED'
              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
              : item.registrationStatus === 'REJECTED'
              ? 'bg-red-500/10 text-red-600 border-red-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          }`}
        >
          {item.registrationStatus}
        </span>
      </td>

      {/* Aksi */}
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {/* Print PDF Button */}
          <button
            type="button"
            onClick={() => onOpenPdf(item)}
            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-on-surface transition-all border border-border-glass flex items-center gap-1"
            title="Cetak Formulir Resmi"
          >
            <LuPrinter /> Cetak PDF
          </button>

          {/* Admin Activation Button */}
          {!isAlreadyActive && item.registrationStatus !== 'REJECTED' && (
            <button
              type="button"
              onClick={() => onOpenFinalize(item)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
            >
              <LuCheckCheck /> Input ke Sistem
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
