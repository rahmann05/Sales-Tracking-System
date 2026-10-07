import React from 'react';
/**
 * OfficialFormPdfView Component
 * Renders an exact 1-to-1 pixel-perfect reproduction of the physical
 * "FORM REGISTRASI OUTLET" (CV SINAR ANUGRAH - UNICHARM) for accurate print & PDF export.
 */
export function OfficialIdentitySection({
  data,
  isChecked
}) {
  return <div className="border-b border-black py-1.5 space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="w-28 font-bold">NAMA OUTLET</span>
              <span>:</span>
              <span className="font-black text-xs uppercase">{data.name}</span>
            </div>
            <div className="flex items-center gap-2 border border-black px-3 py-1 bg-gray-50">
              <span className="font-bold text-[10px]">KODE OUTLET :</span>
              <span className="font-mono font-black text-xs text-blue-900">
                {data.customerCode || '________________'}
              </span>
              <span className="text-[8px] italic text-gray-600">(*diisi Admin)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-28 font-bold">ALAMAT OUTLET</span>
            <span>:</span>
            <span className="uppercase flex-1">{data.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-28 font-bold">NO TELP</span>
            <span>:</span>
            <span className="font-mono">{data.phone || '-'}</span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="w-28 font-bold">LOKASI</span>
            <span>:</span>
            <div className="flex items-center gap-4 flex-wrap text-[10px]">
              <span className="flex items-center gap-1">
                DALAM PASAR{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'DALAM_PASAR')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                PINGGIR JALAN{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'PINGGIR_JALAN')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                DALAM GANG{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'DALAM_GANG')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                KOMPLEK / PERUMAHAN{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'KOMPLEK_PERUMAHAN')}
                </span>
              </span>
            </div>
          </div>
        </div>;
}
