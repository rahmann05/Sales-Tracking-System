import React from 'react';
import {useApp} from '../../../context/AppContext';
export const AuditFollowUpFields=({value,onChange})=>{
 const {teamMembers:users}=useApp();
 return <fieldset className="space-y-2"><legend>Tindak lanjut (opsional)</legend><label className="block">Temuan / tindakan<textarea value={value?.note||''} onChange={e=>onChange({...value,note:e.target.value})} className="block w-full p-2 border rounded-xl"/></label><label className="block">Penanggung jawab<select value={value?.ownerId||''} onChange={e=>onChange({...value,ownerId:e.target.value})} className="block w-full p-2 border rounded-xl"><option value="">Pilih sales</option>{(users||[]).filter(u=>u.role==='SALES').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label className="block">Tenggat<input type="date" value={value?.dueDate||''} onChange={e=>onChange({...value,dueDate:e.target.value})} className="block w-full p-2 border rounded-xl"/></label></fieldset>;
};
