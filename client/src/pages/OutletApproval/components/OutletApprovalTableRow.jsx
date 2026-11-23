import React from 'react';
import { LuMapPin, LuUser } from 'react-icons/lu';
import { registrationStatusBadge } from '../../OutletManagement/outletPresentation';

/**
 * OutletApprovalTableRow Component
 * Single Responsibility: Render a single row of an outlet registration record in the approval table.
 */
export const OutletApprovalTableRow = ({ item, onReview }) => {
  const statusBadge = registrationStatusBadge(item.registrationStatus);
  return (
    <tr className="hover:bg-surface-variant/20 transition-colors">
      {/* Tanggal */}
      <td data-label="Tanggal" className="whitespace-nowrap font-mono text-on-surface-variant">
        {new Date(item.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>

      {/* Nama & Alamat */}
      <td data-label="Nama Toko" className="">
        <div className="font-bold text-on-surface text-sm">{item.name}</div>
        {item.registrationCode && <div className="text-xs font-mono">{item.registrationCode}</div>}
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
          <LuMapPin className="text-primary text-xs shrink-0" />
          <span>{item.address}</span>
        </div>
        <div
          className={`mt-2 text-[11px] font-semibold ${
            Boolean(item.hasPhoto ?? item.photoUrl) ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          {Boolean(item.hasPhoto ?? item.photoUrl)
            ? 'Foto outlet terlampir'
            : 'Foto outlet belum dilampirkan'}
        </div>
      </td>

      {/* Salesman */}
      <td data-label="Salesman" className="">
        <div className="font-bold text-on-surface flex items-center gap-1">
          <LuUser className="text-primary text-xs" />
          <span>{item.salesmanName || '-'}</span>
        </div>
        <div className="text-[10px] text-on-surface-variant">
          Mengetahui: {item.outletKnownBy || item.ownerName || '-'}
        </div>
      </td>

      {/* Area & Divisi */}
      <td data-label="Wilayah" className="">
        <span className="font-bold text-on-surface">{item.area}</span>
        <div className="text-[10px] text-on-surface-variant font-semibold mt-0.5">
          Divisi: {item.division || item.divisionName || '-'}
        </div>
      </td>

      {/* Channel & Payment */}
      <td data-label="Channel" className="">
        <span className="admin-status">
          {item.channel === 'MODERN_TRADE' ? 'MT' : 'GT'} - {item.subChannel}
        </span>
        <div className="text-[10px] text-on-surface-variant mt-1">
          Payment: {item.paymentType}{' '}
          {item.termOfPaymentDays > 0 ? `(${item.termOfPaymentDays} Hari)` : ''}
        </div>
      </td>

      {/* Status */}
      <td data-label="Status" className="">
        <span className={statusBadge.className}>{statusBadge.label}</span>
        {item.customerCode && (
          <div className="text-[10px] font-mono font-bold text-emerald-700 mt-1">
            Kode: {item.customerCode}
          </div>
        )}
      </td>

      {/* Aksi */}
      <td
        data-label="Aksi"
        className="text-center mobile-full-width whitespace-nowrap min-w-[110px]"
      >
        <button
          type="button"
          onClick={() => onReview(item)}
          className={`inline-flex items-center justify-center whitespace-nowrap min-w-[80px] px-4 py-2 md:py-1.5 rounded-lg text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer ${
            item.registrationStatus === 'SUBMITTED'
              ? 'bg-primary text-white'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-glass'
          }`}
        >
          {item.registrationStatus === 'SUBMITTED' ? 'Tinjau' : 'Lihat Detail'}
        </button>
      </td>
    </tr>
  );
};
