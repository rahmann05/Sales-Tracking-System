import React from 'react';
import { LuCheck } from "react-icons/lu";
export function RegistrationTerritorySection({
  clusters,
  formData,
  updateField
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="p-2.5 flex flex-wrap items-center gap-3">
          <span className="w-28 text-xs font-black shrink-0">AREA / CLUSTER :</span>
          <div className="flex flex-wrap items-center gap-4">
            {clusters.length > 0 ? clusters.map(cluster => {
          const isChecked = formData.clusterId === cluster.id || formData.area === cluster.name;
          return <label key={cluster.id} onClick={() => {
            updateField('clusterId', cluster.id);
            updateField('area', cluster.name);
          }} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isChecked ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                    {isChecked && <LuCheck className="text-xs" />}
                  </div>
                  <span>{cluster.name}</span>
                </label>;
        }) : <span className="text-xs text-on-surface-variant italic">Memuat cluster...</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 p-2.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-28 text-xs font-black shrink-0">SUB AREA / KEC :</span>
            <input type="text" value={formData.subAreaKecamatan} onChange={e => updateField('subAreaKecamatan', e.target.value)} className="w-full px-2 py-1 text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="Contoh: Padalarang" />
          </div>
          <div className="flex items-center gap-2 sm:pl-2">
            <span className="w-28 text-xs font-black shrink-0">KELURAHAN :</span>
            <input type="text" value={formData.kelurahan} onChange={e => updateField('kelurahan', e.target.value)} className="w-full px-2 py-1 text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="Contoh: Laksanamekar" />
          </div>
        </div>
      </div>;
}
