import React from 'react';
import { LuNavigation, LuStore, LuMapPin, LuClock, LuUser, LuCalendar } from 'react-icons/lu';
import '../../../../styles/components/SalesDailyRouteSummaryCard.css';

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * SalesDailyRouteSummaryCard Component
 * Single Responsibility: Display today's assigned active route with TSP sequence tailored to the logged-in Sales Rep.
 * 1 File = 1 Component
 */
export const SalesDailyRouteSummaryCard = ({
  salesPerson,
  supervisorName = '-',
  activeRoute,
  stops = [],
  selectedDay = 'Senin',
  onSelectDay,
  salesList = [],
  onSelectSales,
  canSwitchSales = false,
}) => {
  return (
    <div className="sales-daily-summary-card">
      {/* Header Info & Sales Rep Identity */}
      <div className="sales-daily-header">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="sales-daily-badge">
              <LuNavigation className="text-xs" />
              <span>Rute Aktif Hari: {selectedDay}</span>
            </div>
            <span className="px-2.5 py-0.5 bg-surface-container rounded-full text-xs font-bold text-on-surface flex items-center gap-1">
              <LuUser className="text-xs text-primary" /> Sales: {salesPerson?.salesName || salesPerson?.name || '-'}
            </span>
          </div>

          <h2 className="sales-daily-title">
            {activeRoute?.name || '-'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ditugaskan oleh Supervisor: <strong className="text-on-surface">{supervisorName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-1">
            <LuStore /> {stops.length} Toko Target
          </span>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1">
            <LuClock /> Urutan TSP Teroptimasi
          </span>
        </div>
      </div>

      {/* Sales Switcher (If viewed by Supervisor / Ops Manager) */}
      {canSwitchSales && salesList.length > 0 && (
        <div className="p-3 bg-surface-container-low border-b border-border-glass flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <LuUser className="text-xs" /> Pratinjau Sales:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {salesList.map((sales) => {
              const isCurrent = (salesPerson?.salesId === sales.salesId) || (salesPerson?.salesName === sales.salesName);
              return (
                <button
                  key={sales.salesId}
                  type="button"
                  onClick={() => onSelectSales && onSelectSales(sales)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${isCurrent
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {sales.salesName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Switcher Tab Bar */}
      <div className="p-3 bg-surface-container-low/50 border-b border-border-glass flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
          <LuCalendar className="text-xs" /> Pilih Hari:
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {DAYS_LIST.map((day) => {
            const isDaySelected = day === selectedDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay && onSelectDay(day)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all ${isDaySelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sequence of stops (Filtered per Sales & Day) */}
      <div className="sales-stops-sequence-list">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Urutan Titik Kunjungan Hari {selectedDay} ({stops.length} Outlet):
          </h4>
          <span className="text-[11px] text-emerald-600 font-bold">100% Sesuai Rencana PJP</span>
        </div>

        {/* Separated GT and MT Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* General Trade Column */}
          <div className="bg-surface-container-low rounded-xl border border-border-glass p-3">
            <div className="flex items-center justify-between mb-3 border-b border-border-glass pb-2">
              <h5 className="text-[11px] font-extrabold text-blue-600 flex items-center gap-1">
                <LuStore /> GENERAL TRADE
              </h5>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {stops.filter(s => s.type === 'GENERAL_TRADE').length}
              </span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {stops.filter(s => s.type === 'GENERAL_TRADE').length === 0 ? (
                <div className="text-xs text-on-surface-variant text-center py-4 italic">Kosong</div>
              ) : stops.filter(s => s.type === 'GENERAL_TRADE').map((stop, idx) => (
                <div key={stop.id || idx} className="sales-stop-mini-item !border-blue-200/50 hover:!border-blue-400">
                  <div className="flex items-center gap-3">
                    <div className="sales-stop-seq-num !bg-blue-100 !text-blue-700">#{stop.sequence || idx + 1}</div>
                    <div>
                      <div className="font-bold text-on-surface text-sm">{stop.customerName || stop.outletName}</div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                        <LuMapPin className="text-[11px] text-blue-500" />
                        {stop.address}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-container font-mono text-on-surface">
                      {stop.callplanName || stop.callFrequency || 'F2'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modern Trade Column */}
          <div className="bg-surface-container-low rounded-xl border border-border-glass p-3">
            <div className="flex items-center justify-between mb-3 border-b border-border-glass pb-2">
              <h5 className="text-[11px] font-extrabold text-purple-600 flex items-center gap-1">
                <LuStore /> MODERN TRADE
              </h5>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                {stops.filter(s => s.type !== 'GENERAL_TRADE').length}
              </span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {stops.filter(s => s.type !== 'GENERAL_TRADE').length === 0 ? (
                <div className="text-xs text-on-surface-variant text-center py-4 italic">Kosong</div>
              ) : stops.filter(s => s.type !== 'GENERAL_TRADE').map((stop, idx) => (
                <div key={stop.id || idx} className="sales-stop-mini-item !border-purple-200/50 hover:!border-purple-400">
                  <div className="flex items-center gap-3">
                    <div className="sales-stop-seq-num !bg-purple-100 !text-purple-700">#{stop.sequence || idx + 1}</div>
                    <div>
                      <div className="font-bold text-on-surface text-sm">{stop.customerName || stop.outletName}</div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                        <LuMapPin className="text-[11px] text-purple-500" />
                        {stop.address}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-container font-mono text-on-surface">
                      {stop.callplanName || stop.callFrequency || 'F2'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
