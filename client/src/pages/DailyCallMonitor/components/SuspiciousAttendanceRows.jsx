import { DataTable } from '../../../shared/components/common/DataTable';
import { formatVisitDuration } from '../../../../../shared/report-presentation.mjs';
import React from 'react';
import { LuImage, LuExternalLink, LuCircleCheck } from 'react-icons/lu';

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
                    className="text-center text-xs text-on-surface-variant tabular-nums"
                  >
                    {idx + 1}
                  </td>

                  {/* Salesman */}
                  <td data-label="Salesman" className="text-on-surface">
                    <div className="font-medium text-on-surface">{r.salesmanName}</div>
                    <div className="text-xs text-on-surface-variant">{r.clusterName}</div>
                  </td>

                  {/* Outlet */}
                  <td data-label="Outlet" className="text-on-surface md:max-w-[200px]">
                    <div
                      className="font-medium md:min-w-0 whitespace-normal break-words"
                      title={r.customerName}
                    >
                      {r.customerName}
                    </div>
                    <div
                      className="text-xs text-on-surface-variant md:min-w-0 whitespace-normal break-words"
                      title={r.customerAddress}
                    >
                      {r.customerId} · {r.customerAddress}
                    </div>
                  </td>

                  {/* Time In / Out */}
                  <td
                    data-label="Jam In/Out"
                    className="md:text-center text-left text-xs tabular-nums"
                  >
                    <div className="text-on-surface">{r.timeIn || '—'}</div>
                    <div className="text-on-surface-variant">{r.timeOut || '—'}</div>
                  </td>

                  {/* Travel Time & Distance */}
                  <td data-label="Jarak & Jeda" className="md:text-center text-left tabular-nums">
                    {r.prevStopName ? (
                      <div>
                        <div className={isTravel ? 'admin-status admin-status-rejected' : ''}>
                          {r.travelDistanceKm == null
                            ? 'Jarak tidak tersedia'
                            : `${r.travelDistanceKm} km antartitik outlet`}
                        </div>
                        <div className="text-on-surface-variant">{r.travelDurationFormatted}</div>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>

                  {/* Duration Flag */}
                  <td data-label="Durasi" className="md:text-center text-left tabular-nums">
                    <div className={isShort ? 'admin-status admin-status-rejected' : ''}>
                      {formatVisitDuration(r.durationMinutes, r.durationFormatted) ||
                        'Tidak tersedia'}
                    </div>
                    {isShort ? (
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        Di bawah batas
                      </div>
                    ) : null}
                  </td>

                  {/* GPS Deviation Flag */}
                  <td data-label="Deviasi GPS" className="md:text-center text-left tabular-nums">
                    <div
                      className={
                        isFar
                          ? 'admin-status admin-status-pending'
                          : r.deviationMeters == null
                            ? 'text-on-surface-variant'
                            : 'admin-status admin-status-approved'
                      }
                    >
                      {r.deviationMeters == null ? 'Tidak tersedia' : `${r.deviationMeters} m`}
                    </div>
                    {isFar ? (
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        Di luar radius
                      </div>
                    ) : null}
                  </td>

                  {/* Anomaly notes: one plain line per finding, marked by a status dot */}
                  <td data-label="Anomali" className="md:max-w-[240px]">
                    <div className="space-y-1">
                      {isTravel ? (
                        <p className="admin-status admin-status-rejected !whitespace-normal">
                          {r.travelAnomalyReason}
                        </p>
                      ) : null}
                      {isShort ? (
                        <p className="admin-status admin-status-rejected !whitespace-normal">
                          Di bawah batas durasi{r.earlyReason ? `: "${r.earlyReason}"` : ''}
                        </p>
                      ) : null}
                      {isFar ? (
                        <p className="admin-status admin-status-pending !whitespace-normal">
                          Deviasi radius GPS ({r.deviationMeters} m)
                        </p>
                      ) : null}
                      {isSkipped ? (
                        <p className="admin-status !whitespace-normal">Jadwal PJP terlewat</p>
                      ) : null}
                    </div>
                  </td>

                  {/* Photo Evidence */}
                  <td data-label="Bukti Foto" className="md:text-center text-left">
                    <div className="flex items-center justify-start md:justify-center gap-2 text-on-surface-variant">
                      {r.photoIn ? (
                        <span role="img" aria-label="Foto Check-In tersedia" title="Foto masuk">
                          <LuImage aria-hidden="true" />
                        </span>
                      ) : null}
                      {r.photoOut ? (
                        <span role="img" aria-label="Foto Check-Out tersedia" title="Foto keluar">
                          <LuImage aria-hidden="true" />
                        </span>
                      ) : null}
                      {!r.photoIn && !r.photoOut ? <span className="text-xs">—</span> : null}
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
                    <LuCircleCheck
                      className="text-on-surface-variant text-2xl"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-sm text-on-surface">
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
