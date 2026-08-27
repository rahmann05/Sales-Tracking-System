import React from 'react';
import { LuPrinter, LuX } from 'react-icons/lu';

/**
 * DailyCallPdfView Component
 * Renders an exact official printable sheet of the Daily Call Report
 * with company header, KPI summary, full ND6 visit table, and signature sections.
 */
export const DailyCallPdfView = ({ reportData, date, salesmanName, onClose }) => {
  if (!reportData) return null;

  const { summary = {}, rows = [] } = reportData;

  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Action Bar (Hidden when printing) */}
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

      {/* Printable Sheet (Standard A4 Landscape / Document Box) */}
      <div
        id="daily-call-printable"
        className="bg-white text-black font-sans p-6 sm:p-8 max-w-[1050px] w-full shadow-2xl rounded-sm my-auto text-[11px] leading-tight border border-gray-400 print:border-none print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full"
        style={{ fontFamily: "'Arial', sans-serif" }}
      >
        {/* 1. Official Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
          <div>
            <h1 className="text-base font-black tracking-tight text-gray-900 m-0 uppercase">
              CV. SINAR ANUGRAH
            </h1>
            <p className="text-[10px] font-bold text-gray-700 tracking-wider m-0">
              FMCG DISTRIBUTOR • CABANG PADALARANG
            </p>
            <p className="text-[9px] text-gray-500 m-0 mt-0.5">
              Distribution Management System • ReportId: 6230122-DC
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-black uppercase tracking-wider text-black m-0">
              DAILY CALL REPORT
            </h2>
            <p className="text-[10px] font-semibold text-gray-700 m-0 mt-0.5">
              Laporan Kunjungan & Pencapaian Harian Sales
            </p>
            <p className="text-[9px] font-mono text-gray-500 m-0">
              Tanggal: {formattedDate}
            </p>
          </div>
        </div>

        {/* 2. Metadata & KPI Summary Banner */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-100 border border-gray-300 rounded-sm mb-3 text-[10px]">
          <div>
            <span className="text-gray-500 font-semibold block">Salesman / Tim:</span>
            <strong className="text-gray-900 text-[11px]">{salesmanName || 'Semua Salesman'}</strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Total Kunjungan (Plan / Actual):</span>
            <strong className="text-gray-900 text-[11px]">
              {summary.totalActualCalls} / {summary.totalPlanCalls} Call ({summary.totalPlanCalls > 0 ? Math.round((summary.totalActualCalls / summary.totalPlanCalls) * 100) : 0}%)
            </strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Effective Call (EC):</span>
            <strong className="text-gray-900 text-[11px]">
              {summary.totalEffectiveCalls} Toko ({summary.effectiveCallRate})
            </strong>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Total Order / Omzet:</span>
            <strong className="text-gray-900 text-[11px]">
              Rp {(summary.totalOrderAmount || 0).toLocaleString('id-ID')} ({summary.totalSkuSold} SKU)
            </strong>
          </div>
        </div>

        {/* 3. Table of Visits */}
        <div className="border border-black mb-4 overflow-hidden">
          <table className="w-full text-left border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-gray-200 border-b border-black font-black uppercase text-gray-800 text-[9px]">
                <th className="p-1.5 border-r border-black text-center w-6">No</th>
                <th className="p-1.5 border-r border-black">Salesman</th>
                <th className="p-1.5 border-r border-black text-center">Jam In - Out</th>
                <th className="p-1.5 border-r border-black text-center">Durasi</th>
                <th className="p-1.5 border-r border-black">Kode & Nama Toko</th>
                <th className="p-1.5 border-r border-black">Channel</th>
                <th className="p-1.5 border-r border-black text-center">Call</th>
                <th className="p-1.5 border-r border-black text-right">Order (Rp)</th>
                <th className="p-1.5 border-r border-black text-center">SKU</th>
                <th className="p-1.5 border-r border-black">Alasan / Catatan</th>
                <th className="p-1.5 text-center">Deviasi GPS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  className={`border-b border-gray-300 ${
                    idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono font-bold">
                    {r.no}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 font-bold whitespace-nowrap">
                    {r.salesmanName}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 font-mono text-center whitespace-nowrap">
                    {r.timeIn} - {r.timeOut}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 font-mono text-center whitespace-nowrap">
                    {r.durationFormatted}
                  </td>
                  <td className="p-1.5 border-r border-gray-300">
                    <span className="font-mono font-bold text-gray-700">[{r.customerId}]</span>{' '}
                    <strong className="text-gray-900">{r.customerName}</strong>
                    <div className="text-[8.5px] text-gray-500 truncate max-w-[180px]">{r.customerAddress}</div>
                  </td>
                  <td className="p-1.5 border-r border-gray-300 whitespace-nowrap">
                    {r.subChannel}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 font-mono text-center whitespace-nowrap font-bold">
                    P:{r.planCall} A:{r.actualCall} EC:{r.effectiveCall || '-'}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-right font-bold whitespace-nowrap">
                    {r.orderAmount > 0 ? `Rp ${r.orderAmount.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-center font-mono">
                    {r.skuSold || '-'}
                  </td>
                  <td className="p-1.5 border-r border-gray-300 text-[8.5px]">
                    {r.reason ? <span className="text-red-700 font-bold">{r.reason}</span> : r.remark || '-'}
                    {r.earlyReason && <div className="text-amber-800">[Dini: {r.earlyReason}]</div>}
                  </td>
                  <td className="p-1.5 text-center font-mono text-[8.5px] whitespace-nowrap">
                    {r.deviationMeters}m ({r.distanceWarning})
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="11" className="p-4 text-center text-gray-500 font-semibold">
                    Tidak ada rekaman kunjungan toko untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Official Signatures Section */}
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
