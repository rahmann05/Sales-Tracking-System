import React from 'react';
import { LuMapPin, LuUser } from 'react-icons/lu';

/**
 * OutletApprovalTableRow Component
 * Single Responsibility: Render a single row of an outlet registration record in the approval table.
 */
export const OutletApprovalTableRow = ({ item, onReview }) => {
  return (
    <tr className="hover:bg-surface-variant/20 transition-colors">
      {/* Tanggal */}
      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-on-surface-variant">
        {new Date(item.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>

      {/* Nama & Alamat */}
      <td className="py-3.5 px-4">
        <div className="font-bold text-on-surface text-sm">{item.name}</div>
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
          <LuMapPin className="text-primary text-xs shrink-0" />
          <span>{item.address}</span>
        </div>
      </td>

      {/* Salesman */}
      <td className="py-3.5 px-4">
        <div className="font-bold text-on-surface flex items-center gap-1">
          <LuUser className="text-primary text-xs" />
          <span>{item.salesmanName || '-'}</span>
        </div>
        <div className="text-[10px] text-on-surface-variant">
          Mengetahui: {item.outletKnownBy || item.ownerName || '-'}
        </div>
      </td>

      {/* Area & Divisi */}
      <td className="py-3.5 px-4">
        <span className="font-bold text-on-surface">{item.area}</span>
        <div className="text-[10px] text-on-surface-variant font-semibold mt-0.5">
          Divisi: {item.division}
        </div>
      </td>

      {/* Channel & Payment */}
      <td className="py-3.5 px-4">
        <span className="px-2 py-0.5 rounded-md bg-surface-container text-[10px] font-bold border border-border-glass">
          {item.channel === 'MODERN_TRADE' ? 'MT' : 'GT'} - {item.subChannel}
        </span>
        <div className="text-[10px] text-on-surface-variant mt-1">
          Payment: {item.paymentType} {item.termOfPaymentDays > 0 ? `(${item.termOfPaymentDays} Hari)` : ''}
        </div>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
            item.registrationStatus === 'REGISTERED_ACTIVE'
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
        {item.customerCode && (
          <div className="text-[10px] font-mono font-bold text-emerald-600 mt-0.5">
            Kode: {item.customerCode}
          </div>
        )}
      </td>

      {/* Aksi */}
      <td className="py-3.5 px-4 text-center">
        <button
          type="button"
          onClick={() => onReview(item)}
          className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:opacity-90 transition-all"
        >
          Tinjau
        </button>
      </td>
    </tr>
  );
};
