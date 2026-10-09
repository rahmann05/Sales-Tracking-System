import { DataTable } from '../../../shared/components/common/DataTable';
import React from 'react';
import { LuClock, LuMapPin, LuImage, LuShieldAlert, LuExternalLink, LuCircleCheck, LuCar } from "react-icons/lu";

/**
 * SuspiciousAttendanceTable Component
 * Single Responsibility: Dedicated table and audit dashboard for abnormal / suspicious attendances
 * (Early checkout < 5 minutes, GPS deviation > 50 meters, Travel time gaps e.g. 2km in 2 hours, and Skipped visits).
 */
export function SuspiciousAttendanceRows({
  filteredRows,
  onSelectRow
}) {
  return <div className="bg-surface border border-rose-500/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto mobile-card-table-wrapper">
          <DataTable className="w-full text-left border-collapse text-xs mobile-card-table">
            <thead>
              <tr className="bg-rose-500/10 border-b border-rose-500/20 text-[11px] font-black text-rose-800 uppercase tracking-wider">
                <th className="text-center">No</th>
                <th className="">Salesman & Klaster</th>
                <th className="">Outlet / Toko</th>
                <th className="text-center">Jam In / Out</th>
                <th className="text-center">Jarak & Jeda Travel</th>
                <th className="text-center">Durasi di Toko</th>
                <th className="text-center">Deviasi GPS</th>
                <th className="">Jenis Anomali & Temuan</th>
                <th className="text-center">Bukti Foto</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
            const isShort = Boolean(r.isDurationAnomaly);
            const isFar = r.isDistanceAnomaly || r.distanceWarning === 'WARNING';
            const isTravel = r.isTravelAnomaly;
            const isSkipped = r.isSkipped;
            return <tr key={r.id || idx} className="hover:bg-rose-500/5 transition-colors border-b border-border-glass/60 cursor-pointer" onClick={() => onSelectRow && onSelectRow(r)}>
                    <td data-label="No" className="text-center font-mono text-[11px] font-bold text-on-surface-variant">
                      {idx + 1}
                    </td>

                    {/* Salesman */}
                    <td data-label="Salesman" className="font-semibold text-on-surface">
                      <div className="font-bold">{r.salesmanName}</div>
                      <div className="text-[10px] text-on-surface-variant">{r.clusterName}</div>
                    </td>

                    {/* Outlet */}
                    <td data-label="Outlet" className="text-on-surface md:max-w-[200px]">
                      <div className="font-bold md:min-w-0 whitespace-normal break-words" title={r.customerName}>
                        {r.customerName}
                      </div>
                      <div className="text-[10px] text-on-surface-variant md:min-w-0 whitespace-normal break-words font-mono" title={r.customerAddress}>
                        {r.customerId} • {r.customerAddress}
                      </div>
                    </td>

                    {/* Time In / Out */}
                    <td data-label="Jam In/Out" className="md:text-center text-left font-mono text-[11px]">
                      <div className="text-emerald-600 font-semibold">{r.timeIn || '-'}</div>
                      <div className="text-on-surface-variant">{r.timeOut || '-'}</div>
                    </td>

                    {/* Travel Time & Distance */}
                    <td data-label="Jarak & Jeda" className="md:text-center text-left font-mono">
                      {r.prevStopName ? <div className={`inline-block p-1.5 rounded-lg text-[11px] ${isTravel ? 'bg-rose-500/15 text-rose-700 border border-rose-500/30 font-bold animate-pulse' : 'bg-surface-container text-on-surface-variant'}`}>
                          <div>{r.travelDistanceKm} km</div>
                          <div className="font-bold">{r.travelDurationFormatted}</div>
                        </div> : <span className="text-on-surface-variant/40">-</span>}
                    </td>

                    {/* Duration Flag */}
                    <td data-label="Durasi" className="md:text-center text-left">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black font-mono ${isShort ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30' : 'bg-surface-container text-on-surface font-semibold'}`}>
                        <LuClock className="text-xs" />
                        {r.durationFormatted || `${r.durationMinutes}m`}
                      </div>
                      {isShort && <div className="text-[10px] font-black text-rose-600 mt-0.5 inline-flex items-center gap-0.5">
                          <LuClock className="text-[10px]" /> Terlalu Singkat
                        </div>}
                    </td>

                    {/* GPS Deviation Flag */}
                    <td data-label="Deviasi GPS" className="md:text-center text-left">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${isFar ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        <LuMapPin className="text-xs" />
                        {r.deviationMeters || 0} m
                      </div>
                      {isFar && <div className="text-[10px] font-bold text-amber-700 mt-0.5 inline-flex items-center gap-0.5">
                          <LuShieldAlert className="text-[10px]" /> Diluar Radius
                        </div>}
                    </td>

                    {/* Anomaly Badge & Notes */}
                    <td data-label="Anomali" className="md:max-w-[240px]">
                      <div className="space-y-1">
                        {isTravel && <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10.5px] text-rose-900 font-bold flex items-center gap-1">
                            <LuCar className="text-xs shrink-0" />
                            <span>{r.travelAnomalyReason}</span>
                          </div>}
                        {isShort && <div className="p-1 rounded-md bg-rose-500/10 text-rose-800 text-[10.5px] font-semibold flex items-center gap-1">
                            <LuClock className="text-xs shrink-0" />
                            <span>Durasi &lt;5m {r.earlyReason ? `: "${r.earlyReason}"` : ''}</span>
                          </div>}
                        {isFar && <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 text-[10px] font-black border border-amber-500/20">
                            Deviasi Radius GPS ({r.deviationMeters}m)
                          </span>}
                        {isSkipped && <span className="inline-block px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-700 text-[10px] font-black border border-gray-500/20">
                            Jadwal PJP Terlewat
                          </span>}
                      </div>
                    </td>

                    {/* Photo Evidence */}
                    <td data-label="Bukti Foto" className="md:text-center text-left">
                      <div className="flex items-center justify-start md:justify-center gap-1">
                        {r.photoIn ? <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold" title="Foto Check-In Tersedia">
                            <LuImage />
                          </span> : null}
                        {r.photoOut ? <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold" title="Foto Check-Out Tersedia">
                            <LuImage />
                          </span> : null}
                        {!r.photoIn && !r.photoOut && <span className="text-xs text-on-surface-variant/40">-</span>}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="text-center mobile-full-width">
                      <button type="button" onClick={e => {
                  e.stopPropagation();
                  onSelectRow && onSelectRow(r);
                }} className="w-full md:w-auto p-2 md:p-1.5 rounded-xl bg-surface-container hover:bg-rose-500/15 text-on-surface hover:text-rose-700 transition-all border border-border-glass text-xs cursor-pointer flex items-center justify-center gap-1.5" title="Lihat Rincian Lengkap & Foto">
                        <LuExternalLink /> Lihat Rincian Lengkap
                      </button>
                    </td>
                  </tr>;
          })}

              {filteredRows.length === 0 && <tr>
                  <td colSpan="10" className="text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LuCircleCheck className="text-emerald-500 text-2xl" />
                      <span className="font-bold text-sm text-on-surface">Tidak Ditemukan Absensi Janggal</span>
                      <p className="text-xs text-on-surface-variant m-0 max-w-sm">
                        Semua kunjungan berjalan sesuai SOP: durasi di toko &gt;= 5 menit, GPS dalam radius aman, dan jeda perjalanan antar-titik wajar.
                      </p>
                    </div>
                  </td>
                </tr>}
            </tbody>
          </DataTable>
        </div>
      </div>;
}
