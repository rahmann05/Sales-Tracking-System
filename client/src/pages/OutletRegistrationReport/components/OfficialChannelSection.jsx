import React from 'react';
/**
 * OfficialFormPdfView Component
 * Renders an exact 1-to-1 pixel-perfect reproduction of the physical
 * "FORM REGISTRASI OUTLET" (CV SINAR ANUGRAH - UNICHARM) for accurate print & PDF export.
 */
export function OfficialChannelSection({
  data,
  isChecked
}) {
  return <div className="border-b border-black py-1.5">
          <div className="grid grid-cols-12 gap-2 text-[9.5px]">
            {/* MT Column */}
            <div className="col-span-5 border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>MODERN TRADE (MT)</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.channel === 'MODERN_TRADE')}
                </span>
              </div>
              <div className="space-y-0.5">
                {[{
            id: 'HYPERMARKET',
            label: 'HYPERMARKET'
          }, {
            id: 'DRUGSTORE',
            label: 'DRUGSTORE'
          }, {
            id: 'NAT_SUPERMARKET',
            label: 'NAT SUPERMARKET'
          }, {
            id: 'LOKAL_SUPERMARKET',
            label: 'LOKAL SUPERMARKET'
          }, {
            id: 'CHAIN_MINIMARKET',
            label: 'CHAIN MINIMARKET'
          }, {
            id: 'LOKAL_MINIMARKET',
            label: 'LOKAL MINIMARKET'
          }, {
            id: 'PERKULAKAN',
            label: 'PERKULAKAN'
          }].map(item => <div key={item.id} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.subChannel === item.id)}
                    </span>
                  </div>)}
              </div>
            </div>

            {/* GT Column */}
            <div className="col-span-5 border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>GENERAL TRADE (GT)</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.channel === 'GENERAL_TRADE')}
                </span>
              </div>
              <div className="space-y-0.5">
                {[{
            id: 'KOPERASI',
            label: 'KOPERASI'
          }, {
            id: 'BIDAN',
            label: 'BIDAN'
          }, {
            id: 'OUTLET_MOTORIS',
            label: 'OUTLET MOTORIS'
          }, {
            id: 'APOTIK',
            label: 'APOTIK'
          }, {
            id: 'GROSIR',
            label: 'GROSIR'
          }, {
            id: 'TOKO_RETAIL',
            label: 'TOKO / RETAIL'
          }, {
            id: 'BABY_SHOP',
            label: 'BABY SHOP / TOKO SUSU'
          }].map(item => <div key={item.id} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.subChannel === item.id)}
                    </span>
                  </div>)}
              </div>
            </div>

            {/* Tier Column */}
            <div className="col-span-2 border border-black p-1.5">
              <div className="font-bold border-b border-black pb-0.5 mb-1 text-center">
                CHANEL
              </div>
              <div className="space-y-1 pt-1">
                {['BRONZE_A', 'BRONZE_B', 'BRONZE_C'].map(tier => <div key={tier} className="flex items-center justify-between text-[9px]">
                    <span>{tier.replace('_', ' ')}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.channelTier === tier)}
                    </span>
                  </div>)}
              </div>
            </div>
          </div>
        </div>;
}
