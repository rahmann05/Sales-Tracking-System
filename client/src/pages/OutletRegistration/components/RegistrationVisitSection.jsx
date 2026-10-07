import React from 'react';
import { LuCheck } from "react-icons/lu";
export function RegistrationVisitSection({
  DAYS_LIST,
  formData,
  toggleDay,
  updateField
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="p-2 bg-surface-container-low text-xs font-black flex items-center justify-between">
          <span>KUNJUNGAN (CALL PLAN PJP)</span>
          <span className="text-[10px] text-on-surface-variant font-normal italic">
            * Beri Tanda V Pada Kolom Pilihan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 text-xs">
          {/* Week Ganjil */}
          <div className="p-3 space-y-2">
            <label onClick={() => updateField('visitWeekSchedule', 'WEEK_GANJIL')} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.visitWeekSchedule === 'WEEK_GANJIL' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.visitWeekSchedule === 'WEEK_GANJIL' && <LuCheck className="text-xs" />}
              </div>
              <span>WEEK GANJIL</span>
            </label>
            <div className="space-y-1 pl-2">
              {DAYS_LIST.map(day => {
            const isDayChecked = formData.visitWeekSchedule === 'WEEK_GANJIL' && formData.visitDays.includes(day);
            return <div key={day} onClick={() => {
              updateField('visitWeekSchedule', 'WEEK_GANJIL');
              toggleDay(day);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-xs">
                    <span>{day}</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isDayChecked ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isDayChecked && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* Week Genap */}
          <div className="p-3 space-y-2">
            <label onClick={() => updateField('visitWeekSchedule', 'WEEK_GENAP')} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.visitWeekSchedule === 'WEEK_GENAP' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.visitWeekSchedule === 'WEEK_GENAP' && <LuCheck className="text-xs" />}
              </div>
              <span>WEEK GENAP</span>
            </label>
            <div className="space-y-1 pl-2">
              {DAYS_LIST.map(day => {
            const isDayChecked = formData.visitWeekSchedule === 'WEEK_GENAP' && formData.visitDays.includes(day);
            return <div key={day} onClick={() => {
              updateField('visitWeekSchedule', 'WEEK_GENAP');
              toggleDay(day);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-xs">
                    <span>{day}</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isDayChecked ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isDayChecked && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* All Week */}
          <div className="p-3 space-y-2">
            <label onClick={() => updateField('visitWeekSchedule', 'ALL_WEEK')} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.visitWeekSchedule === 'ALL_WEEK' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.visitWeekSchedule === 'ALL_WEEK' && <LuCheck className="text-xs" />}
              </div>
              <span>ALL WEEK</span>
            </label>
            <div className="space-y-1 pl-2">
              {DAYS_LIST.map(day => {
            const isDayChecked = formData.visitWeekSchedule === 'ALL_WEEK' && formData.visitDays.includes(day);
            return <div key={day} onClick={() => {
              updateField('visitWeekSchedule', 'ALL_WEEK');
              toggleDay(day);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-xs">
                    <span>{day}</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isDayChecked ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isDayChecked && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>
        </div>
      </div>;
}
