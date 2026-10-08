import React from 'react';
export function RegistrationTerritorySection({clusters,formData,updateField}) {
  const selected=clusters.find(item=>item.id===formData.clusterId)||clusters.find(item=>item.name===formData.area);
  return <div className="sales-registration-fields">
    <label className="sales-registration-field sales-field-full">Area / cluster<select value={selected?.id||''} onChange={e=>{const item=clusters.find(row=>row.id===e.target.value);updateField('clusterId',item?.id||'');updateField('area',item?.name||'');}}><option value="">{clusters.length?'Pilih area / cluster':'Belum ada cluster yang tersedia'}</option>{clusters.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="sales-registration-field">Kecamatan<input value={formData.subAreaKecamatan} onChange={e=>updateField('subAreaKecamatan',e.target.value)} /></label>
    <label className="sales-registration-field">Kelurahan<input value={formData.kelurahan} onChange={e=>updateField('kelurahan',e.target.value)} /></label>
  </div>;
}
