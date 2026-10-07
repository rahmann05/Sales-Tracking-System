import React from 'react';
import { LuCheck } from "react-icons/lu";
export function RegistrationChannelSection({
  GT_SUB_CHANNELS,
  MT_SUB_CHANNELS,
  TIERS,
  formData,
  updateField
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 text-xs">
          {/* Kolom 1: Modern Trade */}
          <div className="p-3 space-y-2">
            <label onClick={() => {
          updateField('channel', 'MODERN_TRADE');
          updateField('subChannel', 'CHAIN_MINIMARKET');
        }} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.channel === 'MODERN_TRADE' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.channel === 'MODERN_TRADE' && <LuCheck className="text-xs" />}
              </div>
              <span>MODERN TRADE (MT)</span>
            </label>
            <div className="space-y-1 pl-2">
              {MT_SUB_CHANNELS.map(item => {
            const isSelected = formData.channel === 'MODERN_TRADE' && formData.subChannel === item.id;
            return <div key={item.id} onClick={() => {
              updateField('channel', 'MODERN_TRADE');
              updateField('subChannel', item.id);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-[11px] font-medium">
                    <span>{item.label}</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* Kolom 2: General Trade */}
          <div className="p-3 space-y-2">
            <label onClick={() => {
          updateField('channel', 'GENERAL_TRADE');
          updateField('subChannel', 'TOKO_RETAIL');
        }} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.channel === 'GENERAL_TRADE' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.channel === 'GENERAL_TRADE' && <LuCheck className="text-xs" />}
              </div>
              <span>GENERAL TRADE (GT)</span>
            </label>
            <div className="space-y-1 pl-2">
              {GT_SUB_CHANNELS.map(item => {
            const isSelected = formData.channel === 'GENERAL_TRADE' && formData.subChannel === item.id;
            return <div key={item.id} onClick={() => {
              updateField('channel', 'GENERAL_TRADE');
              updateField('subChannel', item.id);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-[11px] font-medium">
                    <span>{item.label}</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* Kolom 3: Tier Channel */}
          <div className="p-3 space-y-2">
            <div className="font-black border-b border-slate-300 pb-1">
              CHANEL TIER
            </div>
            <div className="space-y-2 pl-2 pt-1">
              {TIERS.map(t => {
            const isSelected = formData.channelTier === t.id;
            return <div key={t.id} onClick={() => updateField('channelTier', t.id)} className="flex items-center justify-between py-1 cursor-pointer text-xs font-bold">
                    <span>{t.label}</span>
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isSelected && <LuCheck className="text-xs" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>
        </div>
      </div>;
}
