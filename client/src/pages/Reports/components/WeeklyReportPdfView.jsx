import React from 'react';
import { LuPrinter, LuX } from 'react-icons/lu';

/**
 * WeeklyReportPdfView Component
 * Renders an official printable sheet for the Weekly Performance & Attendance Report (ND6).
 */
export const WeeklyReportPdfView = ({ reportData, salesmanName, onClose }) => {
  if (!reportData) return null;

  const { period = {}, summary = {}, daysSummary = [], salesmen = [] } = reportData;

  const handlePrint = () => {
    window.print();
  };

  const startFormatted = period.startDate
    ? new Date(period.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const endFormatted = period.endDate
    ? new Date(period.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Action Bar */}
      <div className="fixed top-4 right-6 z-60 flex items-center gap-2 no-print bg-surface p-2 rounded-2xl shadow-2xl border border-border-glass">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          <LuPrinter className="text-base" /> Cetak / Unduh PDF
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2.5 bg-surface-container text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all cursor-pointer"
        >
          <LuX className="text-base" /> Tutup
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        id="weekly-report-printable"
        className="bg-white text-black font-sans p-6 sm:p-8 max-w-[1050px] w-full shadow-2xl rounded-sm my-auto text-[11px] leading-tight border border-gray-400 print:border-none print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full"
        style={{ fontFamily: "'Arial', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
          <div>
            <h1 className="text-base font-black tracking-tight text-gray-900 m-0 uppercase">
              CV. SINAR ANUGRAH
            </h1>
            <p className="text-[10px] font-bold text-gray-700 tracking-wider m-0">
              FMCG DISTRIBUTOR • CABANG PADALARANG
            </p>
            <p className="text-[9px] text-gray-500 m-0 mt-0.5">
              Distribution Management System • ReportId: 6230122-WR
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-black uppercase tracking-wider text-black m-0">
              WEEKLY PERFORMANCE REPORT
            </h2>
            <p className="text-[10px] font-semibold text-gray-700 m-0 mt-0.5">
              Rekapitulasi Kunjungan 6 Hari Kerja (Senin - Sabtu)
            </p>
            <p className="text-[9px] font-mono text-gray-500 m-0">
              Periode: {startFormatted} s/d {endFormatted}
            </p>
          </div>
        </div>

        {/* Summary Box */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-100 border border-gray-300 rounded-sm mb-3 text-[10px]">
          <div>
            <span className="text-gray-500 font-semibold block">Salesman / Filter:</span>
            <strong className="text-gray-900 text-[11px]">{salesmanName || 'Semua Salesman (Tim)'}</strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Total Call (Plan / Actual):</span>
            <strong className="text-gray-900 text-[11px]">
              {summary.totalActualCalls} / {summary.totalPlanCalls} Call ({summary.callComplianceRate})
            </strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Effective Call (EC):</span>
            <strong className="text-gray-900 text-[11px]">
              {summary.totalEffectiveCalls} Toko ({summary.effectiveCallRate})
            </strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Total Omzet Mingguan:</span>
            <strong className="text-gray-900 text-[11px]">
              Rp {(summary.totalOrderAmount || 0).toLocaleString('id-ID')} ({summary.totalSkuSold} SKU)
            </strong>
          </div>
        </div>

        {/* Day-by-Day Matrix Table */}
        <div className="border border-black mb-4 overflow-hidden">
          <table className="w-full text-left border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-200 border-b border-black font-black uppercase text-gray-800">
                <th className="p-1.5 border-r border-black" rowSpan="2">Salesman</th>
                <th className="p-1.5 border-r border-black" rowSpan="2">Klaster</th>
                <th className="p-1 border-r border-black text-center" colSpan="6">
                  Realisasi Kunjungan Harian (Actual / Plan Call)
                </th>
                <th className="p-1 border-r border-black text-center" colSpan="4">
                  Total Mingguan (WTD)
                </th>
              </tr>
              <tr className="bg-gray-100 border-b border-black font-bold text-center text-[8.5px]">
                <th className="p-1 border-r border-black">Senin</th>
                <th className="p-1 border-r border-black">Selasa</th>
                <th className="p-1 border-r border-black">Rabu</th>
                <th className="p-1 border-r border-black">Kamis</th>
                <th className="p-1 border-r border-black">Jumat</th>
                <th className="p-1 border-r border-black">Sabtu</th>
                <th className="p-1 border-r border-black">Act / Plan</th>
                <th className="p-1 border-r border-black">Call %</th>
                <th className="p-1 border-r border-black">EC %</th>
                <th className="p-1.5 text-right">Omzet (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {salesmen.map((s, idx) => (
                <tr
                  key={s.salesmanId || idx}
                  className={`border-b border-gray-300 ${
                    idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="p-1.5 border-r border-gray-300 font-bold whitespace-nowrap">
                    {s.salesmanName}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-gray-600 whitespace-nowrap">
                    {s.clusterName}
                  </td>

                  {/* Days */}
                  {['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map((dayKey) => {
                    const d = s.days?.[dayKey] || { plan: 0, actual: 0, ec: 0 };
                    return (
                      <td
                        key={dayKey}
                        className="p-1 border-r border-gray-300 text-center font-mono"
                      >
                        {d.plan > 0 ? (
                          <span>
                            <strong className={d.actual > 0 ? 'text-gray-900' : 'text-gray-400'}>
                              {d.actual}
                            </strong>
                            /{d.plan}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Weekly Totals */}
                  <td className="p-1 border-r border-gray-300 text-center font-mono font-bold">
                    {s.weeklyTotal?.actual} / {s.weeklyTotal?.plan}
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono font-bold">
                    {s.weeklyTotal?.callRate}
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono font-bold text-purple-700">
                    {s.weeklyTotal?.ecRate}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                    Rp {(s.weeklyTotal?.omzet || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-gray-200 border-t-2 border-black font-black text-[9.5px]">
                <td className="p-1.5 border-r border-black" colSpan="2">
                  TOTAL TIM SALES
                </td>
                {daysSummary.map((ds, idx) => (
                  <td key={idx} className="p-1 border-r border-black text-center font-mono">
                    {ds.actualCalls}/{ds.planCalls}
                  </td>
                ))}
                <td className="p-1 border-r border-black text-center font-mono">
                  {summary.totalActualCalls}/{summary.totalPlanCalls}
                </td>
                <td className="p-1 border-r border-black text-center font-mono">
                  {summary.callComplianceRate}
                </td>
                <td className="p-1 border-r border-black text-center font-mono text-purple-800">
                  {summary.effectiveCallRate}
                </td>
                <td className="p-1.5 text-right font-mono text-gray-900 whitespace-nowrap">
                  Rp {(summary.totalOrderAmount || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-3 gap-4 pt-2 text-center text-[10px] break-inside-avoid">
          <div className="border border-gray-300 p-2.5 rounded-sm">
            <span className="text-gray-500 font-bold block mb-12">Dibuat Oleh (Salesman),</span>
            <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
              ( {salesmanName || 'Sales Field Terkait'} )
            </div>
            <span className="text-[8.5px] text-gray-500">Sales Representative</span>
          </div>

          <div className="border border-gray-300 p-2.5 rounded-sm">
            <span className="text-gray-500 font-bold block mb-12">Diperiksa Oleh (Supervisor),</span>
            <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
              ( Ahmad Subagja )
            </div>
            <span className="text-[8.5px] text-gray-500">Supervisor Distribusi</span>
          </div>

          <div className="border border-gray-300 p-2.5 rounded-sm">
            <span className="text-gray-500 font-bold block mb-12">Disetujui Oleh (Manajemen),</span>
            <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
              ( Bambang Suroso / Maria Ulfah )
            </div>
            <span className="text-[8.5px] text-gray-500">Manajer Operasional / Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

