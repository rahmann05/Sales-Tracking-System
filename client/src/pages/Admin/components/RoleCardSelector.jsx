import React, {useId} from 'react';
export function RoleCardSelector({roles,selectedRole,onSelectRole}) {
  const id=useId(),selected=roles.find(role=>role.code===selectedRole);
  return <div className="admin-role-picker">
    <label htmlFor={id}>Peran pengguna</label>
    <select id={id} value={selectedRole} onChange={event=>onSelectRole(event.target.value)} aria-describedby={`${id}-hint`}>
      {roles.map(role=><option key={role.code} value={role.code}>{role.name}</option>)}
    </select>
    <p id={`${id}-hint`}>{selected?.description || 'Izin awal mengikuti template peran yang dipilih.'}</p>
  </div>;
}
