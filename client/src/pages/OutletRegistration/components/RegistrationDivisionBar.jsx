import React from 'react';

export function RegistrationDivisionBar({ divisions = [], formData, updateField }) {
  const currentDivision = formData.division || formData.divisionName || '';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold bg-surface-container-low p-2.5 rounded-xl border border-border-glass">
      <div className="flex items-center gap-2">
        <span className="w-20 text-on-surface-variant shrink-0">DIVISI :</span>
        <select
          aria-label="Divisi"
          value={currentDivision}
          onChange={(e) => {
            const selectedDiv = divisions.find((d) => d.name === e.target.value);
            updateField('division', e.target.value);
            updateField('divisionName', e.target.value);
            if (selectedDiv) updateField('divisionId', selectedDiv.id);
          }}
          className="flex-1 px-2.5 py-1 bg-surface font-black text-xs rounded-lg border border-border-glass text-primary focus:border-primary outline-none cursor-pointer"
        >
          {!divisions.some((div) => div.name === currentDivision) && (
            <option value={currentDivision}>{currentDivision || 'Pilih divisi'}</option>
          )}
          {divisions.map((div) => (
            <option key={div.id} value={div.name}>
              {div.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-20 text-on-surface-variant shrink-0">CABANG :</span>
        <input
          aria-label="Cabang"
          type="text"
          value={formData.branch}
          onChange={(e) => updateField('branch', e.target.value)}
          className="flex-1 px-2.5 py-1 bg-surface font-bold text-xs rounded-lg border border-border-glass focus:border-primary outline-none"
          placeholder="PADALARANG"
        />
      </div>
    </div>
  );
}
