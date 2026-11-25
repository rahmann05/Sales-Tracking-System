import { DataTable } from '../../../shared/components/common/DataTable';
import { formatVisitDuration } from '../../../../../shared/report-presentation.mjs';
import React from 'react';
import {
  LuClock,
  LuMapPin,
  LuImage,
  LuShieldAlert,
  LuExternalLink,
  LuCircleCheck,
  LuCar,
} from 'react-icons/lu';

/**
 * SuspiciousAttendanceRows Component
 * Single Responsibility: Dedicated table body for abnormal / suspicious attendances
 * matching Sinar Anugrah editorial table styles.
 */
export function SuspiciousAttendanceRows({ filteredRows, onSelectRow }) {
  return (
    <div className="bg-surface border border-border-glass rounded-xl overflow-clip">
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel audit absensi janggal"
        className="report-table-region mobile-card-table-wrapper"
      >
        <DataTable className="w-full text-left border-collapse text-xs mobile-card-table">
          <thead>
            <tr className="bg-surface-container/70 border-b border-border-glass text-xs font-semibold text-on-surface-variant">
              <th scope="col" className="text-center w-10">
                No
              </th>
              <th scope="col">Salesman &amp; Klaster</th>
              <th scope="col">Outlet / Toko</th>
              <th scope="col" className="text-center">
                Jam In / Out
              </th>
              <th scope="col" className="text-center">
                Jarak &amp; Jeda Travel
              </th>
              <th scope="col" className="text-center">
                Durasi di Toko
              </th>
              <th scope="col" className="text-center">
                Deviasi GPS
              </th>
              <th scope="col">Jenis Anomali &amp; Temuan</th>
              <th scope="col" className="text-center">
                Bukti Foto
              </th>
              <th scope="col" className="text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, idx) => {
              const isShort = Boolean(r.isDurationAnomaly);
              const isFar = Boolean(r.isDistanceAnomaly || r.distanceWarning === 'WARNING');
              const isTravel = Boolean(r.isTravelAnomaly);
              const isSkipped = Boolean(r.isSkipped);
              return (
                <tr
                  key={r.id || idx}
                  className="hover:bg-surface-container/60 transition-colors border-b border-border-glass cursor-pointer"
                  onClick={() => onSelectRow && onSelectRow(r)}
                >
                  <td
                    data-label="No"
                    className="text-center font-mono text-xs font-semibold text-on-surface-variant tabular-nums"
                  >
                    {idx + 1}
                  </td>

                  {/* Salesman */}
                  <td data-label="Salesman" className="text-on-surface">
                    <div className="font-semibold text-on-surface">{r.salesmanName}</div>
                    <div className="text-xs text-on-surface-variant">{r.clusterName}</div>
                  </td>

                  {/* Outlet */}
                  <td data-label="Outlet" className="text-on-surface md:max-w-[200px]">
                    <div
                      className="font-semibold md:min-w-0 whitespace-normal break-words"
                      title={r.customerName}
                    >
                      {r.customerName}
                    </div>
                    <div
                      className="text-xs text-on-surface-variant md:min-w-0 whitespace-normal break-words font-mono"
                      title={r.customerAddress}
                    >
                      {r.customerId} · {r.customerAddress}
                    </div>
                  </td>

                  {/* Time In / Out */}
                  <td
                    data-label="Jam In/Out"
                    className="md:text-center text-left font-mono text-xs tabular-nums"
                  >
                    <div className="font-semibold text-on-surface">{r.timeIn || '—'}</div>
                    <div className="text-on-surface-variant">{r.timeOut || '—'}</div>
                  </td>

                  {/* Travel Time & Distance */}
                  <td data-label="Jarak & Jeda" className="md:text-center text-left font-mono">
                    {r.prevStopName ? (
                      <div
                        className={`inline-block px-2 py-1 rounded-lg text-xs tabular-nums ${
                          isTravel
                            ? 'bg-[#fff1f2] text-[#9f1239] border border-[#fecdd3] font-semibold'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <div>
                          {r.travelDistanceKm == null
                            ? 'Jarak tidak tersedia'
                            : `${r.travelDistanceKm} km antartitik outlet`}
                        </div>
                        <div className="font-semibold">{r.travelDurationFormatted}</div>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>

                  {/* Duration Flag */}
                  <td data-label="Durasi" className="md:text-center text-left">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs whitespace-nowrap tabular-nums ${
                        isShort
                          ? 'bg-[#fff1f2] text-[#9f1239] border border-[#fecdd3] font-semibold'
                          : 'bg-surface-container text-on-surface font-medium'
                      }`}
                    >
                      <LuClock className="text-xs shrink-0" aria-hidden="true" />
                      {formatVisitDuration(r.durationMinutes, r.durationFormatted) ||
                        'Tidak tersedia'}
                    </div>
                    {isShort ? (
                      <div className="text-[11px] font-medium text-[#9f1239] mt-0.5">
                        Di bawah batas
                      </div>
                    ) : null}
                  </td>

                  {/* GPS Deviation Flag */}
                  <td data-label="Deviasi GPS" className="md:text-center text-left">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium tabular-nums ${
                        isFar
                          ? 'bg-[#fff4df] text-[#99752e] border border-[#fde68a]'
                          : r.deviationMeters == null
                            ? 'bg-surface-container text-on-surface-variant'
                            : 'bg-[#e4f7ea] text-[#15803d]'
                      }`}
                    >
                      <LuMapPin className="text-xs shrink-0" aria-hidden="true" />
                      {r.deviationMeters == null ? 'Tidak tersedia' : `${r.deviationMeters} m`}
                    </div>
                    {isFar ? (
                      <div className="text-[11px] font-medium text-[#99752e] mt-0.5 inline-flex items-center gap-1">
                        <LuShieldAlert className="text-xs shrink-0" aria-hidden="true" />
                        Di luar radius
                      </div>
                    ) : null}
                  </td>

                  {/* Anomaly Badge & Notes */}
                  <td data-label="Anomali" className="md:max-w-[240px]">
                    <div className="space-y-1">
                      {isTravel ? (
                        <div className="p-1.5 rounded-lg bg-[#fff1f2] border border-[#fecdd3] text-xs text-[#9f1239] font-medium flex items-start gap-1">
                          <LuCar className="text-xs shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{r.travelAnomalyReason}</span>
                        </div>
                      ) : null}
                      {isShort ? (
                        <div className="px-2 py-1 rounded-md bg-[#fff1f2] text-[#9f1239] border border-[#fecdd3] text-xs font-medium flex items-start gap-1">
                          <LuClock className="text-xs shrink-0 mt-0.5" aria-hidden="true" />
                          <span>
                            Di bawah batas durasi{r.earlyReason ? `: "${r.earlyReason}"` : ''}
                          </span>
                        </div>
                      ) : null}
                      {isFar ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#fff4df] text-[#99752e] text-xs font-medium border border-[#fde68a]">
                          Deviasi radius GPS ({r.deviationMeters}m)
                        </span>
                      ) : null}
                      {isSkipped ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-xs font-medium border border-border-glass">
                          Jadwal PJP terlewat
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Photo Evidence */}
                  <td data-label="Bukti Foto" className="md:text-center text-left">
                    <div className="flex items-center justify-start md:justify-center gap-1">
                      {r.photoIn ? (
                        <span
                          role="img"
                          className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs"
                          aria-label="Foto Check-In tersedia"
                        >
                          <LuImage aria-hidden="true" />
                        </span>
                      ) : null}
                      {r.photoOut ? (
                        <span
                          role="img"
                          className="w-6 h-6 rounded-md bg-[#e4f7ea] text-[#15803d] flex items-center justify-center text-xs"
                          aria-label="Foto Check-Out tersedia"
                        >
                          <LuImage aria-hidden="true" />
                        </span>
                      ) : null}
                      {!r.photoIn && !r.photoOut ? (
                        <span className="text-xs text-on-surface-variant">—</span>
                      ) : null}
                    </div>
                  </td>

                  {/* Action Button */}
                  <td className="text-center mobile-full-width">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRow && onSelectRow(r);
                      }}
                      className="w-full md:w-auto px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-container text-on-surface transition-colors border border-border-glass text-xs font-medium cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <LuExternalLink aria-hidden="true" />
                      Lihat detail
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-10 text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <LuCircleCheck className="text-[#15803d] text-2xl" aria-hidden="true" />
                    <span className="font-semibold text-sm text-on-surface">
                      Tidak ada temuan absensi janggal
                    </span>
                    <p className="text-xs text-on-surface-variant m-0 max-w-sm">
                      Tidak ada indikasi anomali pada data dan filter saat ini. Bukti yang belum
                      tersedia tetap perlu ditinjau.
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
