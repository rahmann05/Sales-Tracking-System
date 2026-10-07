import React from 'react';
import { LuMapPin, LuClock, LuCamera, LuEye, LuPlus, LuHourglass, LuCar, LuShieldAlert, LuTriangleAlert } from "react-icons/lu";

/**
 * DailyCallTableRow Component
 * Single Responsibility: Render a single Daily Call report row matching ND6 structure.
 */
export const DailyCallTableRow = ({ row, onSelectRow }) => {
  const isEc = row.effectiveCall === 'Y';
  const isActual = row.actualCall === 'Y';

  return (
    <tr
      onClick={() => onSelectRow(row)}
      className={`hover:bg-surface-variant/20 transition-colors cursor-pointer border-b border-border-glass/60 text-xs ${
        row.isDurationAnomaly || row.isDistanceAnomaly ? 'bg-amber-500/5' : ''
      }`}
    >
      {/* 1. No */}
      <td data-label="No" className="text-center font-mono font-bold text-on-surface-variant w-10 py-2.5 px-2 whitespace-nowrap">
        {row.no}
      </td>

      {/* 2. Salesman */}
      <td data-label="Salesman" className="whitespace-nowrap py-2.5 px-2.5">
        <div className="font-bold text-on-surface text-xs whitespace-nowrap">{row.salesmanName}</div>
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5 whitespace-nowrap">
          <LuMapPin className="text-primary text-[10px] shrink-0" />
          <span>{row.clusterName}</span>
        </div>
      </td>

      {/* 3. Jam In / Out */}
      <td data-label="Jam In/Out" className="whitespace-nowrap py-2.5 px-2">
        {isActual && row.timeIn && row.timeIn !== '-' ? (
          <div>
            <div className="font-bold text-on-surface font-mono text-xs whitespace-nowrap">{row.timeIn} – {row.timeOut || '-'}</div>
            <div className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5 whitespace-nowrap">
              <LuClock className="text-[10px] text-primary shrink-0" />
              <span>{row.durationFormatted || `${row.durationMinutes || 0}m`}</span>
            </div>
          </div>
        ) : (
          <span className="text-on-surface-variant/60 font-mono text-xs">—</span>
        )}
      </td>

      {/* 4. Durasi */}
      <td data-label="Durasi" className="whitespace-nowrap text-center py-2.5 px-2">
        {row.isDurationAnomaly ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold border border-rose-500/20 inline-flex items-center gap-1 whitespace-nowrap">
            <LuTriangleAlert className="text-xs" /> &lt; 5m
          </span>
        ) : isActual ? (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold whitespace-nowrap">
            Normal
          </span>
        ) : (
          <span className="text-on-surface-variant/60 font-mono text-xs">—</span>
        )}
      </td>

      {/* 5. Customer Code & Name */}
      <td data-label="Customer" className="min-w-[180px] py-2.5 px-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-bold text-primary text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-md tracking-tight whitespace-nowrap">
            {row.customerId}
          </span>
          {row.isExtraCall && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-[9.5px] font-bold inline-flex items-center gap-0.5 whitespace-nowrap">
              <LuPlus className="text-[9px]" /> Extra
            </span>
          )}
          {row.isSkipped && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 text-[9.5px] font-bold inline-flex items-center gap-0.5 whitespace-nowrap">
              <LuHourglass className="text-[9px]" /> Terlewat
            </span>
          )}
        </div>
        <div className="font-bold text-on-surface text-xs mt-1">{row.customerName}</div>
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5" title={row.customerAddress}>
          <LuMapPin className="text-primary text-[10px] shrink-0" />
          <span className="line-clamp-1">{row.customerAddress}</span>
        </div>
        {row.prevStopName && (
          <div
            className={`text-[9.5px] font-mono mt-1 flex items-center gap-1 ${
              row.isTravelAnomaly ? 'text-rose-600 font-bold' : 'text-on-surface-variant'
            }`}
          >
            <LuCar className="text-[10px] shrink-0" />
            <span>Dari "{row.prevStopName}": {row.travelDistanceKm}km ({row.travelDurationFormatted})</span>
            {row.isTravelAnomaly && <LuShieldAlert className="text-[10px] text-rose-600 shrink-0" />}
          </div>
        )}
      </td>

      {/* 6. Sub Channel & Itinerary */}
      <td data-label="Sub Channel" className="whitespace-nowrap py-2.5 px-2">
        <div className="font-bold text-on-surface text-xs whitespace-nowrap">{row.subChannel}</div>
        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5 whitespace-nowrap">{row.itny}</div>
      </td>

      {/* 7. Call Indicators (Plan / Actual / EC) */}
      <td data-label="Call Status" className="whitespace-nowrap text-center py-2.5 px-2">
        <div className="inline-flex items-center justify-center gap-1 bg-surface-container/60 p-1 rounded-lg border border-border-glass whitespace-nowrap">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              row.planCall === 'Y' ? 'bg-blue-500/15 text-blue-600' : 'bg-slate-200/50 text-slate-500 dark:bg-slate-800'
            }`}
            title="Plan Call"
          >
            P:{row.planCall}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              isActual ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
            }`}
            title="Actual Call"
          >
            A:{row.actualCall}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              isEc
                ? 'bg-purple-500/15 text-purple-600 font-black'
                : isActual
                ? 'bg-amber-500/15 text-amber-600'
                : 'bg-slate-200/50 text-slate-400 dark:bg-slate-800'
            }`}
            title="Effective Call"
          >
            EC:{row.effectiveCall || '-'}
          </span>
        </div>
      </td>

      {/* 8. Order (Rp) & SKU */}
      <td data-label="Order (Rp)" className="whitespace-nowrap md:text-right text-left py-2.5 px-2">
        {row.orderAmount > 0 ? (
          <div>
            <div className="font-bold text-emerald-600 font-mono text-xs whitespace-nowrap">
              Rp {row.orderAmount.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-purple-600 font-semibold whitespace-nowrap">{row.skuSold} SKU Terjual</div>
          </div>
        ) : (
          <span className="text-on-surface-variant/60 font-mono text-xs">—</span>
        )}
      </td>

      {/* 9. Reason & Remark */}
      <td data-label="Catatan" className="min-w-[150px] py-2.5 px-2.5">
        {row.isTravelAnomaly && (
          <div className="text-[10px] font-bold text-rose-700 leading-tight mb-1 flex items-center gap-1">
            <LuShieldAlert className="text-[10px] shrink-0" />
            <span>{row.travelAnomalyReason}</span>
          </div>
        )}
        {row.reason ? (
          <div className="text-xs font-semibold text-rose-600 leading-snug break-words" title={row.reason}>
            {row.reason}
          </div>
        ) : row.remark ? (
          <div className="text-xs text-on-surface-variant leading-snug break-words" title={row.remark}>
            {row.remark}
          </div>
        ) : (
          <span className="text-on-surface-variant/60 font-mono text-xs">—</span>
        )}
        {row.earlyReason && (
          <div className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1" title={row.earlyReason}>
            <LuTriangleAlert className="text-[10px] shrink-0" />
            <span>{row.earlyReason}</span>
          </div>
        )}
      </td>

      {/* 10. GPS Deviation */}
      <td data-label="Deviasi GPS" className="whitespace-nowrap text-center py-2.5 px-2">
        {isActual ? (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[10px] font-bold whitespace-nowrap ${
              row.distanceWarning === 'WARNING'
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {row.deviationMeters}m ({row.distanceWarning})
          </span>
        ) : (
          <span className="text-on-surface-variant/60 font-mono text-xs">—</span>
        )}
      </td>

      {/* 11. Detail & Foto */}
      <td className="text-center whitespace-nowrap py-2.5 px-2 w-24 min-w-[85px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectRow(row);
          }}
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs min-w-[78px] h-8 shrink-0 ${
            row.photoIn || row.photoOut
              ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-glass'
          }`}
          title="Lihat Detail Kunjungan & Foto"
        >
          {row.photoIn || row.photoOut ? (
            <LuCamera className="text-xs shrink-0" />
          ) : (
            <LuEye className="text-xs shrink-0" />
          )}
          <span className="whitespace-nowrap font-bold">Detail</span>
        </button>
      </td>
    </tr>
  );
};

