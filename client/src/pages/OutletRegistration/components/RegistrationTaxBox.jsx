import React from 'react';
import {
  ID_NIK_HTML_PATTERN,
  ID_NPWP_HTML_PATTERN,
  sanitizeNikInput,
  sanitizeNpwpInput,
} from '../../../../../shared/indonesia-identity.mjs';
import { NooField } from './NooField';
import { NooTick } from './NooTick';

/**
 * Satu kotak jenis pajak pada formulir: PKP (NPWP) atau NON PKP (KTP). Hanya kotak yang
 * dicentang yang dapat diisi; kotak lain tampil kosong dan terkunci, seperti pada kertas.
 */
export function RegistrationTaxBox({
  active,
  isPkp,
  title,
  labels,
  note,
  req,
  formData,
  taxError,
  setTaxTouched,
  updateField,
  onSelect,
}) {
  const value = (key) => (active ? formData[key] || '' : '');
  return (
    <div className="npf-box" data-active={active}>
      <NooTick name="taxType" spread strong label={title} checked={active} onChange={onSelect} />
      <NooField
        label={labels[0]}
        required={active && req.has('taxNumber')}
        hint={active ? (isPkp ? '15–16 digit' : '16 digit angka') : undefined}
        error={active ? taxError : undefined}
      >
        <input
          id={active ? 'reg-tax-number' : undefined}
          name={active ? 'taxNumber' : undefined}
          className="npf-line"
          disabled={!active}
          required={active && req.has('taxNumber')}
          inputMode={isPkp ? 'text' : 'numeric'}
          minLength={isPkp ? 15 : 16}
          maxLength={isPkp ? 20 : 16}
          pattern={isPkp ? ID_NPWP_HTML_PATTERN : ID_NIK_HTML_PATTERN}
          title={
            isPkp
              ? 'Nomor NPWP 15 atau 16 digit (contoh: 01.234.567.8-901.000)'
              : 'NIK harus tepat 16 digit angka'
          }
          placeholder={active ? (isPkp ? '01.234.567.8-901.000' : '3201xxxxxxxxxxxx') : ''}
          value={value('taxNumber')}
          onChange={(e) =>
            updateField(
              'taxNumber',
              isPkp ? sanitizeNpwpInput(e.target.value) : sanitizeNikInput(e.target.value)
            )
          }
          onBlur={() => setTaxTouched(true)}
          aria-invalid={active && taxError ? 'true' : undefined}
          autoComplete="off"
        />
      </NooField>
      <NooField label={labels[1]} required={active && req.has('taxName')}>
        <input
          id={active ? 'reg-tax-name' : undefined}
          name={active ? 'taxName' : undefined}
          className="npf-line"
          disabled={!active}
          required={active && req.has('taxName')}
          maxLength={200}
          value={value('taxName')}
          onChange={(e) => updateField('taxName', e.target.value)}
        />
      </NooField>
      <NooField label={labels[2]} required={active && req.has('taxAddress')}>
        <textarea
          id={active ? 'reg-tax-address' : undefined}
          name={active ? 'taxAddress' : undefined}
          className="npf-line"
          rows={2}
          disabled={!active}
          required={active && req.has('taxAddress')}
          maxLength={500}
          value={value('taxAddress')}
          onChange={(e) => updateField('taxAddress', e.target.value)}
        />
      </NooField>
      {note && <small className="npf-hint">{note}</small>}
    </div>
  );
}
