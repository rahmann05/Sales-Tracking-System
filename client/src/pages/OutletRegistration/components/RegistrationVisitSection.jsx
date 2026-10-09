import React from 'react';
import {useApp} from '../../../context/AppContext';
import {allowedVisitIntervals} from '../../../../../shared/pjp-planning.mjs';
export function RegistrationVisitSection({DAYS_LIST,formData,toggleDay,updateField}) {
  const {settings}=useApp(),intervals=allowedVisitIntervals(settings),interval=Number(formData.visitIntervalWeeks||1);
  return <div className="sales-registration-fields">
    <label className="sales-registration-field sales-field-full">Usulan interval kunjungan<select value={interval} onChange={e=>updateField('visitIntervalWeeks',Number(e.target.value))}>{!intervals.includes(interval)&&<option value={interval} disabled>F{interval} dinonaktifkan · pilih interval</option>}{intervals.map(n=><option key={n} value={n}>F{n} · setiap {n} minggu</option>)}</select></label>
    <fieldset className="sales-day-choices sales-field-full"><legend>Hari kunjungan · pilih minimal satu</legend><div>{DAYS_LIST.map(day=><label key={day}><input type="checkbox" checked={formData.visitDays.includes(day)} onChange={()=>toggleDay(day)} /><span>{day}</span></label>)}</div></fieldset>
    <p className="sales-note sales-field-full">Ini usulan Sales. Supervisor menetapkan tanggal awal di planner lalu menerbitkan PJP; aktivasi outlet tidak membuat jadwal otomatis.</p>
  </div>;
}
