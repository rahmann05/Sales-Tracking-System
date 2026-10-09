import React from 'react';
import { codePolicy, formatCode } from '../../../../shared/coding.mjs';
import { displayValue, optionLabel } from "./AdminConfigPage.shared";
import {parameterGuidance,policyTiming,parameterHelp} from '../../../../shared/policy-guidance.mjs';
import {POLICY_SECRET_KEYS} from '../../../../shared/operational-policy.mjs';
import {PolicyChecklistEditor} from './PolicyChecklistEditor';
export function ParameterGroup({
  group,
  values,
  savedValues,
  change,
  errors,
  disabled,
  search,
  onReset,
  sources = {},
  scope = 'GLOBAL',
  onInherit
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
        const guidance=parameterGuidance(param.key,values);
        const scopeBlocked=scope!=='GLOBAL'&&(coding||POLICY_SECRET_KEYS.includes(param.key));
        const inactive = scopeBlocked || Boolean(guidance) || coding && !param.key.endsWith('_MODE') && (mode === 'MANUAL' || param.key.endsWith('_PATTERN') && mode !== 'PATTERN');
        const inputClass = 'config-input';
        const common = {
          id: param.key,
          value: values[param.key] ?? '',
          disabled: inactive || disabled,
          onChange: e => change(param.key, e.target.value),
          'aria-describedby': `${param.key}-help${errors[param.key] ? ` ${param.key}-error` : ''}`,
          'aria-invalid': Boolean(errors[param.key])
        };
        return <div key={param.key} className={`config-parameter-row ${param.key.endsWith('ATTENDANCE_MODE')?'config-mode-row':''} ${modified ? 'bg-primary/5' : ''}`}>
          <div className="min-w-0"><div className="flex flex-wrap gap-2 items-center"><label htmlFor={param.key} className="font-semibold text-sm">{param.label}</label>{modified && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Berbeda dari aturan aktif</span>}</div><p id={`${param.key}-help`} className="text-sm text-on-surface-variant mt-1 leading-relaxed">{parameterHelp(param)}</p>{(guidance||scopeBlocked)&&<p className="policy-field-hint">{scopeBlocked?'Hanya dapat diatur pada profil perusahaan.':guidance}</p>}<details className="policy-parameter-detail"><summary>Sumber & penerapan</summary><p className="text-xs text-on-surface-variant mt-2">{policyTiming(param.key)}</p><p className="text-xs text-on-surface-variant mt-2">Sumber aktif: {sources[param.key] || 'Bawaan / nilai perusahaan lama'}{scope!=='GLOBAL' && !scopeBlocked && onInherit && <button type="button" disabled={disabled} className="ml-3 underline min-h-11" onClick={()=>onInherit(param.key)}>Ikuti induk</button>}</p><p className="text-xs text-on-surface-variant mt-2 break-words">Bawaan: {displayValue(param, param.defaultValue)}{param.unit ? ` ${param.unit}` : ''}</p></details></div>
          <div className="min-w-0">{param.type==='checklist'?<PolicyChecklistEditor value={values[param.key]} id={param.key} disabled={common.disabled} onChange={value=>change(param.key,value)}/>:param.type === 'boolean' ? <label className="policy-switch"><input {...common} type="checkbox" role="switch" checked={values[param.key]==='true'} onChange={e=>change(param.key,String(e.target.checked))}/><span aria-hidden="true"/><strong>{values[param.key]==='true'?'Aktif':'Nonaktif'}</strong></label> : param.type === 'select' && param.key.endsWith('ATTENDANCE_MODE') ? <div className="policy-mode-options" role="radiogroup" aria-label={param.label}>{param.options.map(option=><label key={option} className={values[param.key]===option?'selected':''}><input id={option===param.options[0]?param.key:undefined} aria-describedby={`${param.key}-help`} type="radio" name={param.key} value={option} checked={values[param.key]===option} disabled={common.disabled} onChange={()=>change(param.key,option)}/><span>{optionLabel(param,option)}</span><small>{option==='IN_OUT'?'Bukti masuk dan keluar':option==='IN_ONLY'?'Bukti masuk, lalu hasil kegiatan':'Hasil kegiatan tanpa presensi wajib'}</small></label>)}</div> : param.type === 'select' ? <select {...common} className={inputClass}>{param.options.map(option => <option key={option} value={option}>{optionLabel(param,option)}</option>)}</select> : <div className="config-value-with-unit"><input {...common} type={POLICY_SECRET_KEYS.includes(param.key) ? 'password' : param.type === 'number' ? 'number' : 'text'} min={param.min} max={param.max} step="any" className={inputClass} />{param.unit && <span className="text-xs text-on-surface-variant">{param.unit}</span>}</div>}
          {errors[param.key] && <p id={`${param.key}-error`} className="text-sm text-rose-700 mt-2" role="alert">{errors[param.key]}</p>}{modified && <button type="button" className="text-xs underline min-h-11 text-on-surface-variant" onClick={() => change(param.key, savedValues[param.key])}>Kembalikan nilai tersimpan</button>}</div>
        </div>;
      })}
    </fieldset>
    {!search && <div className="px-5 py-3 border-t border-border-glass"><button type="button" disabled={disabled||scope!=='GLOBAL'&&coding} onClick={onReset} className="min-h-11 text-sm underline text-on-surface-variant disabled:opacity-50">Gunakan nilai bawaan kelompok ini</button></div>}
  </section>;
}
