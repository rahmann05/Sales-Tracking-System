import { LuSearch, LuCalendar, LuUser, LuDownload, LuRefreshCw, LuFilter, LuPrinter, LuPlus, LuHourglass, LuTriangleAlert, LuClock, LuShieldAlert, LuCheck } from 'react-icons/lu';

/**
 * DailyCallFilterBar Component
 * Single Responsibility: Filter controls for Date, Salesman, Status Type, Keyword Search, and Export action.
 */
export const DailyCallFilterBar = ({
  date,
  onChangeDate,
  salesmanId,
  onChangeSalesman,
  salesTeam = [],
  filterType,
  onSelectFilter,
  search,
  onChangeSearch,
  onRefresh,
  onExport,
  onOpenPdf,
  isLoading = false,
}) => {
  const filterOptions = [
    { key: 'ALL', label: 'Semua Kunjungan', icon: null },
    { key: 'EFFECTIVE_CALL', label: 'Effective Call (EC)', icon: LuCheck },
    { key: 'NON_EFFECTIVE_CALL', label: 'Non-EC (Tanpa Order)', icon: null },
    { key: 'EXTRA_CALL', label: 'Extra Call', icon: LuPlus },
    { key: 'SKIPPED', label: 'Terlewat', icon: LuHourglass },
    { key: 'ANOMALY_TRAVEL', label: 'Jeda Travel Janggal', icon: LuTriangleAlert },
    { key: 'ANOMALY_DURATION', label: 'Durasi < 5 Menit', icon: LuClock },
    { key: 'ALL_ANOMALIES', label: 'Semua Anomali', icon: LuShieldAlert },
  ];

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
      {/* Top Filter Controls: Date, Salesman, Search, Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Date Picker */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
            Tanggal Kunjungan
          </label>
          <div className="relative flex items-center">
            <LuCalendar className="absolute left-3 text-on-surface-variant text-sm" />
            <input
              type="date"
              value={date}
              onChange={(e) => onChangeDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* 2. Salesman Selector */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
            Pilih Salesman
          </label>
          <div className="relative flex items-center">
            <LuUser className="absolute left-3 text-on-surface-variant text-sm" />
            <select
              value={salesmanId}
              onChange={(e) => onChangeSalesman(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Semua Salesman (Tim)</option>
              {salesTeam.map((sales) => (
                <option key={sales.id} value={sales.id}>
                  {sales.name} ({sales.cluster?.name || 'Klaster Terjadwal'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Search Keyword */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
            Cari Customer / Toko
          </label>
          <div className="relative flex items-center">
            <LuSearch className="absolute left-3 text-on-surface-variant text-sm" />
            <input
              type="text"
              placeholder="Ketik nama toko / kode customer..."
              value={search}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            title="Ekspor Laporan Format Excel ND6"
          >
            <LuDownload /> Excel
          </button>

          <button
            type="button"
            onClick={onOpenPdf}
            className="flex-1 py-2 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            title="Buka Dokumen Cetak / PDF Resmi"
          >
            <LuPrinter /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Bottom Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
        {filterOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelectFilter(opt.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === opt.key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-border-glass'
              }`}
            >
              {Icon && <Icon className="text-xs" />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

