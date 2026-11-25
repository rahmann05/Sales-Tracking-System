import React from 'react';
import { useApp } from '../../../context/AppContext';
import { allowedVisitIntervals } from '../../../../../shared/pjp-planning.mjs';
import { NooField } from './NooField';
import { NooTick } from './NooTick';

const SCHEDULES = [
  ['WEEK_GANJIL', 'WEEK GANJIL'],
  ['WEEK_GENAP', 'WEEK GENAP'],
  ['ALL_WEEK', 'ALL WEEK'],
];

/** Blok KUNJUNGAN formulir kertas: hari kunjungan per kolom minggu, plus usulan interval PJP. */
export function RegistrationVisitSection({
  DAYS_LIST,
  formData,
  requiredFields = [],
  toggleDay,
  updateField,
}) {
  const { settings } = useApp();
  const intervals = allowedVisitIntervals(settings);
  const interval = Number(formData.visitIntervalWeeks || 1);
  const schedule = formData.visitWeekSchedule || 'ALL_WEEK';
  const days = Array.isArray(formData.visitDays) ? formData.visitDays : [];
  const daysRequired = requiredFields.includes('visitDays');

  // Memilih hari pada kolom minggu lain mengganti jadwal dan memulai pilihan hari dari awal.
  const pick = (key, day) => {
    if (schedule === key) {
      toggleDay(day);
      return;
    }
    updateField('visitWeekSchedule', key);
    updateField('visitDays', [day]);
  };

  return (
    <section id="registration-visit" className="npf-block">
      <div className="npf-row npf-cols-visit">
        <div className="npf-gutter">
          KUNJUNGAN :
          {daysRequired ? (
            <span className="npf-req" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </div>
        {SCHEDULES.map(([key, title]) => (
          <div
            key={key}
            className="npf-box"
            role="group"
            aria-label={title}
            data-active={schedule === key}
          >
            <span className="npf-heading">{title}</span>
            {DAYS_LIST.map((day) => (
              <NooTick
                key={day}
                type="checkbox"
                name={`visit-${key}`}
                spread
                label={day}
                checked={schedule === key && days.includes(day)}
                onChange={() => pick(key, day)}
              />
            ))}
          </div>
        ))}
      </div>
      <NooField label="Usulan interval PJP">
        <select
          id="reg-visit-interval"
          name="visitIntervalWeeks"
          className="npf-line"
          value={interval}
          onChange={(e) => updateField('visitIntervalWeeks', Number(e.target.value))}
        >
          {!intervals.includes(interval) ? (
            <option value={interval} disabled>
              F{interval} dinonaktifkan
            </option>
          ) : null}
          {intervals.map((n) => (
            <option key={n} value={n}>
              F{n} · tiap {n} minggu
            </option>
          ))}
        </select>
      </NooField>
    </section>
  );
}
