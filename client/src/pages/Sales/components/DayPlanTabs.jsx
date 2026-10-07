import React from 'react';
import { LuCalendar } from 'react-icons/lu';
export function DayPlanTabs({days,selectedDay,onSelect,stops,todayDayName}) {
  return <nav className="day-plan-grid" aria-label="Hari rencana kunjungan">{days.map(item=>{
    const active=selectedDay===item.day;
    const count=stops.filter(stop=>(stop.dayOfWeek || todayDayName)===item.day).length;
    return <button key={item.day} type="button" aria-current={active?'date':undefined} onClick={()=>onSelect(item.day)} className={`px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 w-full ${active?'bg-primary text-on-primary':'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
      <span className="flex items-start gap-2 min-w-0"><LuCalendar aria-hidden="true" className="shrink-0 mt-1"/><span className="day-plan-copy"><strong>{item.day}</strong><span>{item.plan}</span></span></span>
      <span className="app-sequence" aria-label={`${count} toko`}>{count}</span>
    </button>;
  })}</nav>;
}
