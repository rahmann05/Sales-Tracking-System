import React from 'react';
import { NooField } from './NooField';
import { NooTick } from './NooTick';

/** Blok AREA formulir kertas: pilihan area/cluster bertanda V, lalu kota, SUB AREA / KEC, KELURAHAN. */
export function RegistrationTerritorySection({
  clusters,
  formData,
  requiredFields = [],
  updateField,
}) {
  const req = new Set(requiredFields);
  const selected =
    clusters.find((item) => item.id === formData.clusterId) ||
    clusters.find((item) => item.name === formData.area);

  return (
    <section id="registration-plan" className="npf-block">
      <fieldset className="npf-ticks">
        <legend className="sr-only">Area / cluster</legend>
        <span className="npf-gutter">
          AREA :
          {req.has('area') ? (
            <span className="npf-req" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </span>
        {clusters.length === 0 ? (
          <span className="npf-status">Belum ada cluster tersedia</span>
        ) : null}
        {clusters.map((item) => (
          <NooTick
            key={item.id}
            name="clusterId"
            label={String(item.name).toUpperCase()}
            required={req.has('area')}
            checked={selected?.id === item.id}
            onChange={() => {
              updateField('clusterId', item.id);
              updateField('area', item.name);
            }}
          />
        ))}
      </fieldset>
      <NooField label="Kota / kabupaten" required={req.has('city')}>
        <input
          id="reg-city"
          name="city"
          className="npf-line"
          required={req.has('city')}
          maxLength={120}
          value={formData.city || ''}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="Kota Bandung / Kab. Bandung Barat"
        />
      </NooField>
      <NooField label="Sub area / kec" required={req.has('subAreaKecamatan')}>
        <input
          id="reg-kecamatan"
          name="subAreaKecamatan"
          className="npf-line"
          required={req.has('subAreaKecamatan')}
          maxLength={120}
          value={formData.subAreaKecamatan || ''}
          onChange={(e) => updateField('subAreaKecamatan', e.target.value)}
          placeholder="Nama kecamatan"
        />
      </NooField>
      <NooField label="Kelurahan" required={req.has('kelurahan')}>
        <input
          id="reg-kelurahan"
          name="kelurahan"
          className="npf-line"
          required={req.has('kelurahan')}
          maxLength={120}
          value={formData.kelurahan || ''}
          onChange={(e) => updateField('kelurahan', e.target.value)}
          placeholder="Nama kelurahan / desa"
        />
      </NooField>
    </section>
  );
}
