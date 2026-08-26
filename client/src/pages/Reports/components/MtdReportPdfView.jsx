import React from 'react';
import { LuPrinter, LuX } from 'react-icons/lu';

/**
 * MtdReportPdfView Component
 * Renders an official printable sheet for Month-to-Date (MTD) Sales, Target, and LMA Growth analysis.
 */
export const MtdReportPdfView = ({ reportData, salesmanName, onClose }) => {
  if (!reportData) return null;

  const { period = {}, summary = {}, channelBreakdown = [], salesmen = [] } = reportData;

  const handlePrint = () => {
    window.print();
  };

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
        id="mtd-report-printable"
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
              Distribution Management System • ReportId: 6230122-MTD
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-black uppercase tracking-wider text-black m-0">
              MONTH-TO-DATE (MTD) REPORT
            </h2>
            <p className="text-[10px] font-semibold text-gray-700 m-0 mt-0.5">
              Pencapaian Target & Analisis Pertumbuhan LMA
            </p>
            <p className="text-[9px] font-mono text-gray-500 m-0">
              Bulan: {period.monthName} {period.year} (Hari Kerja: {period.workingDaysElapsed}/{period.totalWorkingDays} - {period.workingDaysRate})
            </p>
          </div>
        </div>

        {/* Summary KPI Box */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-100 border border-gray-300 rounded-sm mb-3 text-[10px]">
          <div>
            <span className="text-gray-500 font-semibold block">Salesman / Filter:</span>
            <strong className="text-gray-900 text-[11px]">{salesmanName || 'Semua Salesman (Tim)'}</strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Realisasi vs Target MTD:</span>
            <strong className="text-gray-900 text-[11px]">
              Rp {(summary.mtdActualAmount || 0).toLocaleString('id-ID')} / Rp {(summary.monthlyTargetAmount || 0).toLocaleString('id-ID')}
            </strong>
            <span className="text-blue-700 font-bold block">Pencapaian: {summary.overallAchievementRate}</span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Last Month Actual (LMA):</span>
            <strong className="text-gray-900 text-[11px]">
              Rp {(summary.lastMonthActual || 0).toLocaleString('id-ID')}
            </strong>
            <span className="text-emerald-700 font-bold block">% MTD to LMA: {summary.mtdToLmaRate}</span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Call Compliance & EC:</span>
            <strong className="text-gray-900 text-[11px]">
              Call: {summary.mtdCallComplianceRate} • EC: {summary.mtdEffectiveCallRate}
            </strong>
            <span className="text-purple-700 font-bold block">Total SKU: {summary.totalMtdSkuSold}</span>
          </div>
        </div>

        {/* Channel Breakdown Snippet */}
        {channelBreakdown.length > 0 && (
          <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-sm mb-3 text-[9.5px]">
            <strong className="text-gray-900 uppercase tracking-wider block mb-1">
              Kontribusi Penjualan per Saluran Distribusi (Channel Breakdown):
            </strong>
            <div className="grid grid-cols-3 gap-2">
              {channelBreakdown.map((c) => (
                <div key={c.channelKey} className="border border-gray-200 p-1.5 rounded-xs bg-white">
                  <div className="font-bold text-gray-800">{c.channelName}</div>
                  <div className="flex items-center justify-between text-gray-600 mt-0.5 font-mono">
                    <span>Omzet: Rp {(c.mtdOmzet || 0).toLocaleString('id-ID')}</span>
                    <strong className="text-purple-700">{c.contributionRate}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salesman Table */}
        <div className="border border-black mb-4 overflow-hidden">
          <table className="w-full text-left border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-200 border-b border-black font-black uppercase text-gray-800">
                <th className="p-1.5 border-r border-black">No</th>
                <th className="p-1.5 border-r border-black">Salesman</th>
                <th className="p-1.5 border-r border-black">Klaster</th>
                <th className="p-1.5 border-r border-black text-right">Target (Rp)</th>
                <th className="p-1.5 border-r border-black text-right">MTD Actual (Rp)</th>
                <th className="p-1.5 border-r border-black text-center">% Achv</th>
                <th className="p-1.5 border-r border-black text-right">LMA (Rp)</th>
                <th className="p-1.5 border-r border-black text-center">% MTD/LMA</th>
                <th className="p-1.5 border-r border-black text-center">MTD Call (A/P)</th>
                <th className="p-1.5 border-r border-black text-center">Call %</th>
                <th className="p-1.5 border-r border-black text-center">EC %</th>
                <th className="p-1.5 text-center">SKU</th>
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
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 font-bold whitespace-nowrap">
                    {s.salesmanName}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-gray-600 whitespace-nowrap">
                    {s.clusterName}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-right font-mono whitespace-nowrap">
                    Rp {(s.monthlyTarget || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                    Rp {(s.mtdActualAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono font-bold text-blue-700">
                    {s.achievementRate}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-right font-mono whitespace-nowrap text-gray-600">
                    Rp {(s.lastMonthActual || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono font-bold text-emerald-700">
                    {s.mtdToLmaRate}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono whitespace-nowrap">
                    {s.mtdActualCalls}/{s.mtdPlanCalls}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono">
                    {s.callComplianceRate}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono font-bold text-purple-700">
                    {s.effectiveCallRate}
                  </td>
                  <td className="p-1.5 text-center font-mono">
                    {s.totalSkuSold}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-gray-200 border-t-2 border-black font-black text-[9.5px]">
                <td className="p-1.5 border-r border-black text-center" colSpan="3">
                  TOTAL TIM DISTRIBUSI
                </td>
                <td className="p-1.5 border-r border-black text-right font-mono whitespace-nowrap">
                  Rp {(summary.monthlyTargetAmount || 0).toLocaleString('id-ID')}
                </td>
                <td className="p-1.5 border-r border-black text-right font-mono whitespace-nowrap">
                  Rp {(summary.mtdActualAmount || 0).toLocaleString('id-ID')}
                </td>
                <td className="p-1.5 border-r border-black text-center font-mono text-blue-800">
                  {summary.overallAchievementRate}
                </td>
                <td className="p-1.5 border-r border-black text-right font-mono whitespace-nowrap">
                  Rp {(summary.lastMonthActual || 0).toLocaleString('id-ID')}
                </td>
                <td className="p-1.5 border-r border-black text-center font-mono text-emerald-800">
                  {summary.mtdToLmaRate}
                </td>
                <td className="p-1.5 border-r border-black text-center font-mono">
                  {summary.totalMtdActualCalls}/{summary.totalMtdPlanCalls}
                </td>
                <td className="p-1.5 border-r border-black text-center font-mono">
                  {summary.mtdCallComplianceRate}
                </td>
                <td className="p-1.5 border-r border-black text-center font-mono text-purple-800">
                  {summary.mtdEffectiveCallRate}
                </td>
                <td className="p-1.5 text-center font-mono">
                  {summary.totalMtdSkuSold}
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

