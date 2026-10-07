import React from 'react';
import { codePolicy, formatCode } from '../../../../shared/coding.mjs';
import { displayValue, optionLabels } from "./AdminConfigPage.shared";
export function ParameterGroup({
  group,
  values,
  savedValues,
  change,
  errors,
  disabled,
  search,
  onReset
}) {
  const coding = group.groupKey.startsWith('CODING_');
  const mode = coding ? values[`CODE_${group.groupKey.slice(7)}_MODE`] : '';
  let preview = '';
  if (coding) {
    try {
      const policy = codePolicy(group.groupKey.slice(7), values);
      preview = mode === 'MANUAL' ? 'Kode diinput manual saat membuat data.' : formatCode(policy, policy.start);
    } catch (err) {
      preview = err.message;
    }
  }
  const displayedParams = group.params.filter(param => !coding || search || errors[param.key] || param.key.endsWith('_MODE') || mode !== 'MANUAL' && (!param.key.endsWith('_PATTERN') || mode === 'PATTERN'));
  return <section className="config-parameter-group bg-surface border border-border-glass rounded-2xl overflow-hidden">
    <div className="config-group-heading"><div><h3>{group.groupLabel.replace('Pengkodean: ', '')}</h3><p>{group.groupDescription}</p></div><span>{displayedParams.length} parameter{coding ? ' aktif' : ''}</span></div>
    {coding && <div className="config-code-preview"><p className="text-xs font-semibold text-on-surface-variant">{mode === 'MANUAL' ? 'OTOMATIS OFF' : 'PRATINJAU FORMAT KODE'}</p><p className="font-mono text-sm font-semibold mt-2 break-all">{preview}</p>{mode !== 'MANUAL' && <p className="text-xs text-on-surface-variant mt-2">Contoh memakai nomor awal, bukan nomor berikutnya. Urutan aktual ditentukan saat data disimpan.</p>}</div>}
    <fieldset disabled={disabled} className="divide-y divide-border-glass">
      <legend className="config-visually-hidden">{group.groupLabel}</legend>
      {displayedParams.map(param => {
        const modified = values[param.key] !== savedValues[param.key];
        const inactive = coding && !param.key.endsWith('_MODE') && (mode === 'MANUAL' || param.key.endsWith('_PATTERN') && mode !== 'PATTERN');
        const inputClass = 'config-input';
        const common = {
          id: param.key,
          value: values[param.key] ?? '',
          disabled: inactive || disabled,
          onChange: e => change(param.key, e.target.value),
          'aria-describedby': `${param.key}-help${errors[param.key] ? ` ${param.key}-error` : ''}`,
          'aria-invalid': Boolean(errors[param.key])
        };
        return <div key={param.key} className={`config-parameter-row ${modified ? 'bg-primary/5' : ''}`}>
          <div className="min-w-0"><div className="flex flex-wrap gap-2 items-center"><label htmlFor={param.key} className="font-semibold text-sm">{param.label}</label>{modified && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Belum disimpan</span>}</div><p id={`${param.key}-help`} className="text-sm text-on-surface-variant mt-1 leading-relaxed">{param.description}{inactive ? ' Tidak digunakan pada mode yang dipilih.' : ''}</p><p className="text-xs text-on-surface-variant mt-2 break-words">Bawaan: {displayValue(param, param.defaultValue)}{param.unit ? ` ${param.unit}` : ''}</p></div>
          <div className="min-w-0">{param.type === 'boolean' ? <select {...common} className={inputClass}><option value="true">Aktif / diizinkan</option><option value="false">Nonaktif / tidak diizinkan</option></select> : param.type === 'select' ? <select {...common} className={inputClass}>{param.options.map(option => <option key={option} value={option}>{optionLabels[option] || option}</option>)}</select> : <div className="config-value-with-unit"><input {...common} type={param.type === 'number' ? 'number' : 'text'} min={param.min} max={param.max} step="any" className={inputClass} />{param.unit && <span className="text-xs text-on-surface-variant">{param.unit}</span>}</div>}
          {errors[param.key] && <p id={`${param.key}-error`} className="text-sm text-rose-700 mt-2" role="alert">{errors[param.key]}</p>}{modified && <button type="button" className="text-xs underline min-h-11 text-on-surface-variant" onClick={() => change(param.key, savedValues[param.key])}>Kembalikan nilai tersimpan</button>}</div>
        </div>;
      })}
    </fieldset>
    {!search && <div className="px-5 py-3 border-t border-border-glass"><button type="button" disabled={disabled} onClick={onReset} className="min-h-11 text-sm underline text-on-surface-variant disabled:opacity-50">Gunakan nilai bawaan kelompok ini</button></div>}
  </section>;
}
