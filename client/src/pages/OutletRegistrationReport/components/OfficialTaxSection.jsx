import React from 'react';
/**
 * OfficialFormPdfView Component
 * Renders an exact 1-to-1 pixel-perfect reproduction of the physical
 * "FORM REGISTRASI OUTLET" (CV SINAR ANUGRAH - UNICHARM) for accurate print & PDF export.
 */
export function OfficialTaxSection({
  data,
  isChecked
}) {
  return <div className="border-b border-black py-1.5">
          <div className="flex items-start gap-2">
            <span className="w-28 font-bold pt-1">JENIS PAJAK</span>
            <span>:</span>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {/* Box PKP */}
              <div className="border border-black p-1.5 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[10px]">
                  <span>PKP</span>
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                    {isChecked(data.taxType === 'PKP')}
                  </span>
                </div>
                <div className="text-[9px] space-y-0.5 pt-0.5">
                  <div className="flex gap-1">
                    <span className="w-20">NO. NPWP</span>
                    <span>:</span>
                    <span className="font-mono">
                      {data.taxType === 'PKP' ? data.taxNumber || '-' : '-'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-20">NAMA NPWP</span>
                    <span>:</span>
                    <span>{data.taxType === 'PKP' ? data.taxName || '-' : '-'}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-20">ALAMAT NPWP</span>
                    <span>:</span>
                    <span>{data.taxType === 'PKP' ? data.taxAddress || '-' : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Box NON PKP */}
              <div className="border border-black p-1.5 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[10px]">
                  <span>NON PKP</span>
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                    {isChecked(data.taxType === 'NON_PKP')}
                  </span>
                </div>
                <div className="text-[9px] space-y-0.5 pt-0.5">
                  <div className="flex gap-1">
                    <span className="w-16">NIK</span>
                    <span>:</span>
                    <span className="font-mono">
                      {data.taxType === 'NON_PKP' ? data.taxNumber || '-' : '-'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-16">NAMA</span>
                    <span>:</span>
                    <span>{data.taxType === 'NON_PKP' ? data.taxName || '-' : '-'}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-16">ALAMAT</span>
                    <span>:</span>
                    <span>{data.taxType === 'NON_PKP' ? data.taxAddress || '-' : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[8px] italic text-gray-600 pl-30 pt-0.5">
            * Lampirkan Copy NPWP / SPPKP / KTP
          </div>
        </div>;
}
