import React from 'react';
import { LuFileText } from 'react-icons/lu';

/**
 * AbsenNotesInput Component
 * Single Responsibility: Render keterangan/catatan kunjungan input with quick preset tags and textarea.
 */
export const AbsenNotesInput = ({
  notes,
  onChangeNotes,
  label = 'Keterangan / Catatan Absen Kunjungan',
  presets = [
    'Kunjungan Rutin & Cek Stok',
    'Penagihan Piutang & Inkaso',
    'Display Produk Baru & Promo',
    'Follow-up Pesanan Tertunda',
  ],
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
        <LuFileText className="text-primary text-sm" />
        <span>{label}</span>
      </label>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChangeNotes(preset)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
              notes === preset
                ? 'bg-primary text-on-primary border-primary font-semibold'
                : 'bg-surface-variant/30 text-on-surface-variant border-border-glass hover:bg-surface-variant/60'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={(e) => onChangeNotes(e.target.value)}
        rows={2}
        placeholder="Tuliskan keterangan kunjungan atau catatan tambahan..."
        className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
};
