import React from 'react';
import { LuMapPin, LuClock, LuCamera, LuCircleCheck, LuPlus, LuHourglass, LuCar, LuShieldAlert, LuTriangleAlert } from 'react-icons/lu';

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
      <td className="py-3 px-3 text-center font-mono font-bold text-on-surface-variant">
        {row.no}
      </td>

      {/* 2. Salesman */}
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="font-bold text-on-surface">{row.salesmanName}</div>
        <div className="text-[10px] text-on-surface-variant">{row.clusterName}</div>
      </td>

      {/* 3. Jam In / Out */}
      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
        <div className="font-bold text-on-surface">{row.timeIn} - {row.timeOut}</div>
        <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
          <LuClock className="text-[10px]" />
          <span>{row.durationFormatted} ({row.durationMinutes}m)</span>
        </div>
      </td>

      {/* 4. Durasi */}
      <td className="py-3 px-3 whitespace-nowrap text-center">
        {row.isDurationAnomaly ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold border border-rose-500/20 inline-flex items-center gap-1">
            <LuTriangleAlert className="text-xs" /> &lt; 5 Menit
          </span>
        ) : isActual ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
            Normal
          </span>
        ) : (
          <span className="text-on-surface-variant font-mono">-</span>
        )}
      </td>

      {/* 5. Customer Code & Name */}
      <td className="py-3 px-3 min-w-[180px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-bold text-primary text-[11px] px-1.5 py-0.2 bg-primary/10 rounded">
            {row.customerId}
          </span>
          <span className="font-bold text-on-surface">{row.customerName}</span>

          {row.isExtraCall && (
            <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 text-[9.5px] font-black inline-flex items-center gap-0.5">
              <LuPlus className="text-[9px]" /> Extra
            </span>
          )}
          {row.isSkipped && (
            <span className="px-1.5 py-0.2 rounded bg-gray-500/10 text-gray-600 text-[9.5px] font-black inline-flex items-center gap-0.5">
              <LuHourglass className="text-[9px]" /> Terlewat
            </span>
          )}
        </div>
        <div className="text-[10px] text-on-surface-variant truncate max-w-[220px] mt-0.5 flex items-center gap-1">
          <LuMapPin className="text-primary text-[10px] shrink-0" />
          <span>{row.customerAddress}</span>
        </div>
        {row.prevStopName && (
          <div
            className={`text-[9.5px] font-mono mt-0.5 flex items-center gap-1 ${
              row.isTravelAnomaly ? 'text-rose-600 font-black' : 'text-on-surface-variant'
            }`}
          >
            <LuCar className="text-[10px] shrink-0" />
            <span>Dari "{row.prevStopName}": {row.travelDistanceKm}km ({row.travelDurationFormatted})</span>
            {row.isTravelAnomaly && <LuShieldAlert className="text-[10px] text-rose-600 shrink-0" />}
          </div>
        )}
      </td>

      {/* 6. Sub Channel & Itinerary */}
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="font-bold text-on-surface">{row.subChannel}</div>
        <div className="text-[10px] text-on-surface-variant font-mono">{row.itny}</div>
      </td>

      {/* 7. Call Indicators (Plan / Actual / EC) */}
      <td className="py-3 px-3 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-1">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              row.planCall === 'Y' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-500/10 text-slate-500'
            }`}
            title="Plan Call"
          >
            P:{row.planCall}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              isActual ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
            }`}
            title="Actual Call"
          >
            A:{row.actualCall}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              isEc
                ? 'bg-purple-500/10 text-purple-600 font-black'
                : isActual
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-slate-500/10 text-slate-400'
            }`}
            title="Effective Call"
          >
            EC:{row.effectiveCall || '-'}
          </span>
        </div>
      </td>

      {/* 8. Order (Rp) & SKU */}
      <td className="py-3 px-3 whitespace-nowrap text-right">
        {row.orderAmount > 0 ? (
          <>
            <div className="font-bold text-emerald-600">
              Rp {row.orderAmount.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-purple-600 font-semibold">{row.skuSold} SKU Terjual</div>
          </>
        ) : (
          <span className="text-on-surface-variant font-mono">-</span>
        )}
      </td>

      {/* 9. Reason & Remark */}
      <td className="py-3 px-3 max-w-[170px]">
        {row.isTravelAnomaly && (
          <div className="text-[10px] font-bold text-rose-700 leading-tight mb-0.5 flex items-center gap-1">
            <LuShieldAlert className="text-[10px] shrink-0" />
            <span>{row.travelAnomalyReason}</span>
          </div>
        )}
        {row.reason ? (
          <div className="text-[11px] font-semibold text-rose-600 truncate" title={row.reason}>
            {row.reason}
          </div>
        ) : (
          <div className="text-[11px] text-on-surface-variant truncate" title={row.remark}>
            {row.remark || '-'}
          </div>
        )}
        {row.earlyReason && (
          <div className="text-[10px] text-amber-700 font-semibold truncate flex items-center gap-1" title={row.earlyReason}>
            <LuTriangleAlert className="text-[10px] shrink-0" />
            <span>{row.earlyReason}</span>
          </div>
        )}
      </td>

      {/* 10. GPS Deviation */}
      <td className="py-3 px-3 whitespace-nowrap text-center">
        <span
          className={`inline-flex px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
            row.distanceWarning === 'WARNING'
              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-600'
          }`}
        >
          {row.deviationMeters}m ({row.distanceWarning})
        </span>
      </td>

      {/* 11. Foto & Aksi */}
      <td className="py-3 px-3 text-center whitespace-nowrap">
        {row.photoIn || row.photoOut ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectRow(row);
            }}
            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-bold flex items-center gap-1 mx-auto cursor-pointer"
            title="Lihat Foto & Detail"
          >
            <LuCamera /> Foto
          </button>
        ) : (
          <span className="text-on-surface-variant text-[10px]">-</span>
        )}
      </td>
    </tr>
  );
};

