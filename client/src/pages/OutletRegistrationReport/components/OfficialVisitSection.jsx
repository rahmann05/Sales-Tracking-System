import React from 'react';
/**
 * OfficialFormPdfView Component
 * Renders an exact 1-to-1 pixel-perfect reproduction of the physical
 * "FORM REGISTRASI OUTLET" (CV SINAR ANUGRAH - UNICHARM) for accurate print & PDF export.
 */
export function OfficialVisitSection({
  data,
  isChecked,
  visitDaysList
}) {
  return <div className="border-b border-black py-1.5">
          <div className="grid grid-cols-3 gap-2 text-[9.5px]">
            {/* Week Ganjil */}
            <div className="border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>WEEK GANJIL</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.visitWeekSchedule === 'WEEK_GANJIL')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map(day => <div key={day} className="flex items-center justify-between">
                    <span>{day}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.visitWeekSchedule === 'WEEK_GANJIL' && visitDaysList.includes(day))}
                    </span>
                  </div>)}
              </div>
            </div>

            {/* Week Genap */}
            <div className="border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>WEEK GENAP</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.visitWeekSchedule === 'WEEK_GENAP')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map(day => <div key={day} className="flex items-center justify-between">
                    <span>{day}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.visitWeekSchedule === 'WEEK_GENAP' && visitDaysList.includes(day))}
                    </span>
                  </div>)}
              </div>
            </div>

            {/* All Week */}
            <div className="border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>ALL WEEK</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.visitWeekSchedule === 'ALL_WEEK')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map(day => <div key={day} className="flex items-center justify-between">
                    <span>{day}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.visitWeekSchedule === 'ALL_WEEK' && visitDaysList.includes(day))}
                    </span>
                  </div>)}
              </div>
            </div>
          </div>
          <div className="text-[8px] italic text-gray-600 pt-0.5">
            * Beri Tanda V Pada Kolom Pilihan
          </div>
        </div>;
}
