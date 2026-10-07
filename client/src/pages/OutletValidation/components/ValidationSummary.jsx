import React from 'react';
import { LuStore, LuCircleCheck, LuTriangleAlert, LuCircleHelp } from 'react-icons/lu';
export function ValidationSummary({
  channelFilter,
  metrics,
  setChannelFilter,
  setPage,
  setStatusFilter,
  statusFilter
}) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface border border-border-glass shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1.5">
            <LuStore className="text-primary text-xs" /> Total Outlet
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.total}</span>
        </div>

        <div onClick={() => {
      setChannelFilter(channelFilter === 'GENERAL_TRADE' ? 'ALL' : 'GENERAL_TRADE');
      setPage(1);
    }} className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${channelFilter === 'GENERAL_TRADE' ? 'bg-surface border-primary shadow-xs ring-1 ring-primary/20' : 'bg-surface border-border-glass hover:bg-surface-container/60 hover:border-primary/40'}`}>
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
            <span>General Trade (GT)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.gt}</span>
        </div>

        <div onClick={() => {
      setChannelFilter(channelFilter === 'MODERN_TRADE' ? 'ALL' : 'MODERN_TRADE');
      setPage(1);
    }} className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${channelFilter === 'MODERN_TRADE' ? 'bg-surface border-primary shadow-xs ring-1 ring-primary/20' : 'bg-surface border-border-glass hover:bg-surface-container/60 hover:border-primary/40'}`}>
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
            <span>Modern Trade (MT)</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.mt}</span>
        </div>

        <div onClick={() => {
      setStatusFilter(statusFilter === 'VALID' ? 'ALL' : 'VALID');
      setPage(1);
    }} className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${statusFilter === 'VALID' ? 'bg-surface border-primary shadow-xs ring-1 ring-primary/20' : 'bg-surface border-border-glass hover:bg-surface-container/60 hover:border-primary/40'}`}>
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
            <span>Sesuai Peta</span>
            <LuCircleCheck className="text-emerald-600 dark:text-emerald-400 text-xs" />
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.valid}</span>
        </div>

        <div onClick={() => {
      setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING');
      setPage(1);
    }} className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${statusFilter === 'WARNING' ? 'bg-surface border-primary shadow-xs ring-1 ring-primary/20' : 'bg-surface border-border-glass hover:bg-surface-container/60 hover:border-primary/40'}`}>
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
            <span>Perlu Tinjauan</span>
            <LuTriangleAlert className="text-amber-500 text-xs" />
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.warning}</span>
        </div>

        <div onClick={() => {
      setStatusFilter(statusFilter === 'UNVALIDATED' ? 'ALL' : 'UNVALIDATED');
      setPage(1);
    }} className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${statusFilter === 'UNVALIDATED' ? 'bg-surface border-primary shadow-xs ring-1 ring-primary/20' : 'bg-surface border-border-glass hover:bg-surface-container/60 hover:border-primary/40'}`}>
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
            <span>Belum Diperiksa</span>
            <LuCircleHelp className="text-on-surface-variant/60 text-xs" />
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.unvalidated}</span>
        </div>
      </div>;
}
