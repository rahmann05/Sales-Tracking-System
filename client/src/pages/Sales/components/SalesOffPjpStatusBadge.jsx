import React from 'react';
import { LuClock, LuCircleCheck, LuTriangleAlert, LuCircleX } from 'react-icons/lu';

/**
 * SalesOffPjpStatusBadge Component
 * Single Responsibility: Render a standardized, color-coded status badge for Off-PJP attendance validation.
 * 1 File = 1 Component
 */
export const SalesOffPjpStatusBadge = ({ status }) => {
  switch (status) {
    case 'TERVALIDASI':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
          <LuCircleCheck className="text-xs" />
          <span>Tervalidasi (Masuk Target)</span>
        </span>
      );

    case 'DITOLAK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-xs">
          <LuCircleX className="text-xs" />
          <span>Ditolak SPV</span>
        </span>
      );

    case 'TIDAK_TERVALIDASI':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-xs">
          <LuTriangleAlert className="text-xs" />
          <span>Tidak Tervalidasi (Lewat Hari)</span>
        </span>
      );

    case 'MENUNGGU':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs animate-pulse">
          <LuClock className="text-xs" />
          <span>Menunggu Validasi SPV</span>
        </span>
      );
  }
};
