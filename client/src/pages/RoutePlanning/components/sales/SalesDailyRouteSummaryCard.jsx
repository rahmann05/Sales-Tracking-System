import React, { useState, useEffect } from 'react';
import { LuNavigation, LuStore, LuMapPin, LuClock, LuUser, LuCalendar, LuCheck, LuInfo } from 'react-icons/lu';
import { useApp } from '../../../../context/AppContext';
import { configApi } from '../../../../services/api';
import '../../../../styles/components/SalesDailyRouteSummaryCard.css';

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * SalesDailyRouteSummaryCard Component
 * Single Responsibility: Display today's assigned active route with TSP sequence tailored to the logged-in Sales Rep,
 * with real database-driven frequencies, legend, and cluster region areas.
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
  const { user } = useApp();
  const [legendData, setLegendData] = useState(null);

  // Fetch Call Plan Legend from Database (SystemConfig table)
  useEffect(() => {
    let isMounted = true;
    configApi.getByKey('CALLPLAN_LEGEND')
      .then((res) => {
        if (isMounted && res?.data) {
          setLegendData(res.data);
        }
      })
      .catch((err) => {
        console.warn('[Legend] Failed to load callplan legend:', err);
      });
    return () => { isMounted = false; };
  }, []);

  const displaySalesName = salesPerson?.salesName && salesPerson.salesName !== '-'
    ? salesPerson.salesName
    : (user?.name || '-');

  const displayRouteName = activeRoute?.name && activeRoute.name !== '-'
    ? activeRoute.name
    : (salesPerson?.clusterName || (stops[0]?.clusterName ? `Klaster ${stops[0].clusterName}` : `Rute Kunjungan PJP`));

  const displaySupervisor = supervisorName && supervisorName !== '-'
    ? supervisorName
    : (stops[0]?.supervisorName || salesPerson?.spvName || '-');

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
              <LuUser className="text-xs text-primary" /> Sales: {displaySalesName}
            </span>
          </div>

          <h2 className="sales-daily-title">
            {displayRouteName}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ditugaskan oleh Supervisor: <strong className="text-on-surface">{displaySupervisor}</strong>
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

      {/* Day Switcher Tab Bar (Only visible if Supervisor / Ops Manager) */}
      {canSwitchSales && (
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
      )}

      {/* Single Unified Table for Route Stops */}
      <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden flex flex-col mt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-border-glass bg-surface">
          <div>
            <h4 className="text-sm font-extrabold text-on-surface m-0 flex items-center gap-2">
              <LuStore className="text-primary text-base" />
              <span>Daftar Urutan Kunjungan Hari {selectedDay} ({stops.length} Outlet)</span>
            </h4>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Rencana rute harian yang diurutkan efisien berdasarkan titik lokasi outlet
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1">
            <LuCheck className="text-xs" /> 100% Sesuai Rencana PJP
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[750px]">
            <thead className="bg-surface-variant/30">
              <tr>
                <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass text-center w-16">
                  Urutan
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">
                  Nama Outlet & Alamat
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">
                  Tipe Outlet
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass text-center">
                  Frekuensi Kunjungan
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">
                  Wilayah / Area
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {stops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant italic text-xs">
                    Tidak ada jadwal kunjungan toko untuk hari {selectedDay}.
                  </td>
                </tr>
              ) : (
                stops.map((stop, idx) => {
                  const isGT = stop.type === 'GENERAL_TRADE';
                  const freqCode = stop.callFrequency || stop.callplanName || 'F2';
                  const freqLegend = legendData?.[freqCode];
                  const areaText = stop.subDistrict || stop.regionName || stop.clusterName || '-';

                  return (
                    <tr key={stop.id || idx} className="hover:bg-surface-variant/20 transition-colors">
                      {/* Urutan TSP */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shadow-xs ${
                          isGT 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          #{stop.sequence || idx + 1}
                        </span>
                      </td>

                      {/* Nama & Alamat */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface text-sm">
                          {stop.customerName || stop.outletName || stop.name}
                        </div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                          <LuMapPin className="text-xs text-primary shrink-0" />
                          <span>{stop.address || 'Alamat tidak tersedia'}</span>
                        </div>
                      </td>

                      {/* Tipe Outlet (Column GT vs MT) */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isGT
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                        }`}>
                          <LuStore className="text-xs" />
                          {isGT ? 'General Trade (GT)' : 'Modern Trade (MT)'}
                        </span>
                      </td>

                      {/* Frekuensi Kunjungan (F1, F2, F4, F8) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span 
                            className="px-2.5 py-1 rounded-lg bg-surface-container font-mono text-xs font-bold text-on-surface border border-border-glass shadow-xs"
                            title={freqLegend?.description || `${freqCode}: Kunjungan terjadwal`}
                          >
                            {freqCode}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                            {freqLegend?.cycle || (freqCode === 'F2' ? '2 Minggu Sekali' : freqCode === 'F4' ? 'Setiap Minggu' : '1x Sebulan')}
                          </span>
                        </div>
                      </td>

                      {/* Wilayah / Area */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-on-surface bg-surface-container/60 px-2.5 py-1 rounded-lg border border-border-glass inline-flex items-center gap-1.5">
                          <LuMapPin className="text-primary text-xs" />
                          <span>{areaText}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Box (Loaded directly from Database SystemConfig) */}
        {legendData && (
          <div className="p-4 bg-surface-container-low border-t border-border-glass">
            <div className="flex items-center gap-1.5 mb-2.5">
              <LuInfo className="text-primary text-sm shrink-0" />
              <h5 className="text-xs font-bold text-on-surface m-0">
                Legenda Frekuensi Kunjungan (Call Plan Database):
              </h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {Object.values(legendData).map((item) => (
                <div
                  key={item.code}
                  className="p-2.5 rounded-xl bg-surface border border-border-glass flex items-start gap-2 text-xs shadow-xs"
                >
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 font-mono font-bold text-primary border border-primary/20 shrink-0 text-xs">
                    {item.code}
                  </span>
                  <div>
                    <div className="font-bold text-on-surface text-[11px]">{item.name}</div>
                    <div className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
