import React, { useState } from 'react';
import { LuCamera, LuCheck } from 'react-icons/lu';
import {
  sanitizeNikInput,
  sanitizeNpwpInput,
  validateIndonesianTaxNumber,
} from '../../../../../shared/indonesia-identity.mjs';
import { RegistrationTaxBox } from './RegistrationTaxBox';

/** Blok JENIS PAJAK formulir kertas, dengan tempat foto NPWP/KTP di bawahnya. */
export function RegistrationTaxSection({
  cardTypeLabel,
  formData,
  requiredFields = [],
  setIsKtpCameraOpen,
  settings,
  updateField,
}) {
  const [taxTouched, setTaxTouched] = useState(false);
  const req = new Set(requiredFields);
  const isPkp = formData.taxType === 'PKP';
  const taxError = taxTouched
    ? validateIndonesianTaxNumber(formData.taxType, formData.taxNumber)
    : null;
  const taxDocRequired = settings.CUSTOMER_REG_REQUIRE_TAX_DOCUMENT !== false;

  const select = (nextType) => {
    updateField('taxType', nextType);
    updateField(
      'taxNumber',
      nextType === 'PKP'
        ? sanitizeNpwpInput(formData.taxNumber)
        : sanitizeNikInput(formData.taxNumber)
    );
  };
  const shared = { req, formData, taxError, setTaxTouched, updateField };

  return (
    <section id="registration-tax" className="npf-block">
      <div className="npf-row npf-cols-tax">
        <div className="npf-gutter">JENIS PAJAK :</div>
        <RegistrationTaxBox
          {...shared}
          active={isPkp}
          isPkp
          title="PKP"
          labels={['No. NPWP', 'Nama NPWP', 'Alamat NPWP']}
          note="* Lampirkan copy NPWP / SPPKP / KTP"
          onSelect={() => select('PKP')}
        />
        <RegistrationTaxBox
          {...shared}
          active={!isPkp}
          isPkp={false}
          title="NON PKP"
          labels={['NIK', 'Nama', 'Alamat']}
          onSelect={() => select('NON_PKP')}
        />
      </div>
      <div className="npf-docphoto">
        <span>
          Lampiran foto {cardTypeLabel}
          {taxDocRequired ? (
            <span className="npf-req" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
          <p>
            {formData.taxDocumentUrl
              ? 'Dokumen terlampir.'
              : taxDocRequired
                ? 'Wajib dilampirkan; sumber foto mengikuti pengaturan.'
                : 'Opsional, sesuai kebutuhan pengajuan.'}
          </p>
        </span>
        <button
          type="button"
          className="npf-btn npf-btn--mini"
          onClick={() => setIsKtpCameraOpen(true)}
        >
          {formData.taxDocumentUrl ? (
            <>
              <LuCheck aria-hidden="true" /> Foto {cardTypeLabel} terlampir · Ganti
            </>
          ) : (
            <>
              <LuCamera aria-hidden="true" /> Ambil foto {cardTypeLabel}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
