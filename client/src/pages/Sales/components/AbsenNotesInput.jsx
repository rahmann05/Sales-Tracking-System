import React from 'react';
import { LuFileText } from 'react-icons/lu';

/**
 * AbsenNotesInput Component
 * Single Responsibility: Render clean, focused keterangan/catatan kunjungan textarea without disturbing preset pills.
 */
export const AbsenNotesInput = ({
  notes,
  onChangeNotes,
  label = 'Keterangan / Catatan Kunjungan',
  placeholder = 'Tuliskan keterangan kunjungan atau catatan tambahan...',
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
        <LuFileText className="text-primary text-sm" />
        <span>{label}</span>
      </label>

      {/* Clean direct textarea */}
      <textarea
        value={notes}
        onChange={(e) => onChangeNotes(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
};
