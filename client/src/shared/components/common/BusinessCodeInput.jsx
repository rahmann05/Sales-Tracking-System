import React from 'react';
import { useApp } from '../../../context/AppContext';
import { CODE_ENTITIES, manualCodeRequired } from '../../../../../shared/coding.mjs';
import '../../../styles/common/BusinessCodeInput.css';

export function BusinessCodeInput({
  entity,
  value = '',
  onChange,
  existing = false,
  optional = false,
  disabled = false,
}) {
  const { settings } = useApp();
  const label = CODE_ENTITIES.find((e) => e.key === entity)?.label || 'Kode';
  const manual = manualCodeRequired(entity, settings);

  // Server-assigned and existing codes are shown, never typed.
  if (existing || !manual)
    return (
      <div className="app-field business-code">
        <span className="business-code-label">{label}</span>
        <p className="business-code-value" data-pending={!existing}>
          {existing ? value || '—' : 'Ditetapkan otomatis saat disimpan'}
        </p>
        {!existing && (
          <span className="business-code-hint">
            Kode mengikuti pengaturan sistem dan diberikan oleh server saat penyimpanan.
          </span>
        )}
      </div>
    );

  return (
    <label className="app-field business-code">
      <span className="business-code-label">{label}</span>
      <input
        className="form-input w-full"
        type="text"
        maxLength={128}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={!optional}
        disabled={disabled}
        aria-required={!optional}
        placeholder={
          optional ? `Masukkan ${label.toLowerCase()}` : `Wajib diisi: ${label.toLowerCase()}`
        }
      />
      <span className="business-code-hint">
        {optional
          ? 'Pengkodean manual aktif.'
          : 'Pengkodean manual aktif: kode harus diisi sebelum disimpan.'}
      </span>
    </label>
  );
}
