import React from 'react';
export function RegistrationVisitSection({DAYS_LIST,formData,toggleDay,updateField}) {
  return <div className="sales-registration-fields">
    <label className="sales-registration-field sales-field-full">Rencana minggu kunjungan<select value={formData.visitWeekSchedule} onChange={e=>updateField('visitWeekSchedule',e.target.value)}><option value="WEEK_GANJIL">Minggu ganjil</option><option value="WEEK_GENAP">Minggu genap</option><option value="ALL_WEEK">Setiap minggu</option></select></label>
    <fieldset className="sales-day-choices sales-field-full"><legend>Hari kunjungan · pilih minimal satu</legend><div>{DAYS_LIST.map(day=><label key={day}><input type="checkbox" checked={formData.visitDays.includes(day)} onChange={()=>toggleDay(day)} /><span>{day}</span></label>)}</div></fieldset>
    <p className="sales-note sales-field-full">Rencana ini diajukan bersama data outlet untuk diperiksa sebelum masuk jadwal kunjungan.</p>
  </div>;
}
