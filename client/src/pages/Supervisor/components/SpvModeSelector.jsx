import React from 'react';

export function SpvModeSelector({
  selectedSales, onSelectSales, salesOptions = [],
  spvStops = [], selectedTargetStopId, onSelectTargetStop,
  onOpenAbsenIn, onOpenOffPjp
}) {
  return (
    <section className="workspace-card">
      <div className="workspace-heading">
        <div>
          <h2>Target Kunjungan Supervisi</h2>
          <p>Pilih sales dan toko yang akan dikunjungi, lalu lakukan absen masuk.</p>
        </div>
      </div>
      <div className="app-filter-grid">
        <label className="app-field">
          Pilih Sales
          <select value={selectedSales} onChange={e => onSelectSales(e.target.value)}>
            <option value="">-- Pilih Sales --</option>
            {salesOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        
        <label className="app-field">
          Target Toko
          <select 
            value={selectedTargetStopId || ''} 
            onChange={e => onSelectTargetStop(e.target.value)}
            disabled={!selectedSales}
          >
            <option value="">-- Pilih Toko --</option>
            {spvStops.map(s => <option key={s.id} value={s.id}>{s.outletName}</option>)}
          </select>
        </label>
        
        <div className="flex flex-col justify-end gap-2">
           <button 
             type="button" 
             disabled={!selectedTargetStopId}
             onClick={() => {
                const stop = spvStops.find(s => s.id === selectedTargetStopId);
                if (stop) onOpenAbsenIn(stop);
             }}
             className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50 h-[38px] w-full"
           >
             Absen Sesuai Rute
           </button>
           
           <button 
             type="button" 
             onClick={onOpenOffPjp}
             className="px-5 py-2 rounded-xl border border-primary text-primary text-xs font-bold hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer h-[38px] w-full"
           >
             Absen Toko Terpisah
           </button>
        </div>
      </div>
    </section>
  );
}
