import React from 'react';
export function RegistrationVisitSection({DAYS_LIST,formData,toggleDay,updateField}) {
  return <div className="sales-registration-fields">
    <label className="sales-registration-field sales-field-full">Usulan interval kunjungan<select value={formData.visitIntervalWeeks || 1} onChange={e=>updateField('visitIntervalWeeks',Number(e.target.value))}><option value="1">F1 · setiap 1 minggu</option><option value="2">F2 · setiap 2 minggu</option><option value="4">F4 · setiap 4 minggu</option></select></label>
    <fieldset className="sales-day-choices sales-field-full"><legend>Hari kunjungan · pilih minimal satu</legend><div>{DAYS_LIST.map(day=><label key={day}><input type="checkbox" checked={formData.visitDays.includes(day)} onChange={()=>toggleDay(day)} /><span>{day}</span></label>)}</div></fieldset>
    <p className="sales-note sales-field-full">Ini usulan Sales. Supervisor menetapkan tanggal awal di planner lalu menerbitkan PJP; aktivasi outlet tidak membuat jadwal otomatis.</p>
  </div>;
}
