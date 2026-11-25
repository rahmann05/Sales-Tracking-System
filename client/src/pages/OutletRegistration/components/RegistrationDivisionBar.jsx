import React from 'react';

const isRemovedDivision = (div) =>
  String(div?.code || '').toUpperCase() === 'MIX' ||
  String(div?.name || '')
    .trim()
    .toUpperCase() === 'DIVISI MIX';

/** Baris DIVISI dan CABANG di bawah judul formulir kertas. */
export function RegistrationDivisionBar({ divisions = [], formData, updateField }) {
  const validDivisions = divisions.filter((div) => !isRemovedDivision(div));
  const rawDivision = formData.division || formData.divisionName || '';
  const currentDivision =
    rawDivision.trim().toUpperCase() === 'DIVISI MIX'
      ? validDivisions[0]?.name || 'BELFOODS'
      : rawDivision || validDivisions[0]?.name || 'BELFOODS';

  return (
    <div className="npf-meta">
      <label className="npf-meta-row" htmlFor="reg-division">
        <span>DIVISI</span>
        <span aria-hidden="true">:</span>
        <select
          id="reg-division"
          name="division"
          className="npf-line"
          value={currentDivision}
          onChange={(e) => {
            const selectedDiv = validDivisions.find((d) => d.name === e.target.value);
            updateField('division', e.target.value);
            updateField('divisionName', e.target.value);
            if (selectedDiv) updateField('divisionId', selectedDiv.id);
          }}
        >
          {!validDivisions.some((div) => div.name === currentDivision) ? (
            <option value={currentDivision}>{currentDivision || 'BELFOODS'}</option>
          ) : null}
          {validDivisions.map((div) => (
            <option key={div.id} value={div.name}>
              {div.name}
            </option>
          ))}
        </select>
      </label>
      <label className="npf-meta-row" htmlFor="reg-branch">
        <span>CABANG</span>
        <span aria-hidden="true">:</span>
        <input
          id="reg-branch"
          name="branch"
          type="text"
          className="npf-line"
          value={formData.branch || ''}
          onChange={(e) => updateField('branch', e.target.value)}
          placeholder="PADALARANG"
        />
      </label>
    </div>
  );
}
