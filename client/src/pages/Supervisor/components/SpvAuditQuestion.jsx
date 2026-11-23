import React from 'react';
import { auditFailed } from '../../../../../shared/supervision-checklist.mjs';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';

export function SpvAuditQuestion({
  item,
  value,
  evidence = {},
  onChange,
  onEvidence,
  policyValues = null,
}) {
  const type = item.type || 'BOOLEAN',
    id = `audit-${item.key}`,
    failed = auditFailed(item, value);
  return (
    <fieldset className="grid gap-3 p-4 rounded-xl bg-surface-variant/30 border border-border-glass text-sm">
      <legend className="font-semibold px-1">
        {item.label}
        {item.required ? ' · wajib' : ''}
      </legend>
      <label htmlFor={id} className="sr-only">
        {item.label}
      </label>
      {type === 'TEXT' ? (
        <textarea
          id={id}
          className="config-input"
          rows={3}
          maxLength={4000}
          required={Boolean(item.required)}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : type === 'NUMBER' ? (
        <input
          id={id}
          className="config-input min-h-11"
          type="number"
          step="any"
          min={item.min}
          max={item.max}
          required={Boolean(item.required)}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      ) : type === 'BOOLEAN' || (Array.isArray(item.options) && item.options.length <= 5) ? (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={item.label}>
          {(type === 'BOOLEAN'
            ? [
                { key: 'true', label: 'Ya', val: true },
                { key: 'false', label: 'Tidak', val: false },
              ]
            : item.options.map((option) => ({ key: option, label: option, val: option }))
          ).map((choice) => {
            const checked = value === choice.val;
            return (
              <label
                key={choice.key}
                className={`min-h-11 px-4 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border-glass bg-surface hover:bg-surface-variant/40'
                }`}
              >
                <input
                  type="radio"
                  name={id}
                  checked={checked}
                  required={Boolean(item.required)}
                  onChange={() => onChange(choice.val)}
                />
                <span>{choice.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <select
          id={id}
          className="config-input min-h-11"
          required={Boolean(item.required)}
          value={value == null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">Belum diisi</option>
          {(item.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      {type === 'NUMBER' && (item.min !== undefined || item.max !== undefined) && (
        <p className="text-xs text-on-surface-variant">
          Rentang: {item.min ?? 'tanpa minimum'} — {item.max ?? 'tanpa maksimum'}
        </p>
      )}
      {failed && (
        <>
          <p className="text-sm font-medium text-amber-700">Kondisi perlu perbaikan</p>
          <label className="grid gap-2">
            Alasan / penjelasan{item.requireFailureReason ? ' · wajib' : ' · opsional'}
            <textarea
              className="config-input"
              rows={2}
              maxLength={2000}
              required={Boolean(item.requireFailureReason)}
              value={evidence.reason || ''}
              onChange={(e) => onEvidence({ ...evidence, reason: e.target.value })}
            />
          </label>
          {item.requireFailurePhoto && (
            <DeviceCameraCapture
              policyValues={policyValues}
              requireGps={false}
              photoRequired
              capturedPhoto={evidence.photoUrl}
              onCapture={(photoUrl) => onEvidence({ ...evidence, photoUrl })}
              onRetake={() => onEvidence({ ...evidence, photoUrl: undefined })}
            />
          )}
        </>
      )}
      {!failed && (evidence.reason || evidence.photoUrl) && (
        <p className="text-xs text-on-surface-variant">
          Bukti sebelumnya tetap disertakan pada catatan audit.
        </p>
      )}
    </fieldset>
  );
}
