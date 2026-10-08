import React, {useId,useMemo,useState} from 'react';
import {LuSearch,LuRotateCcw,LuChevronDown} from 'react-icons/lu';
import {ALL_PERMISSIONS,PERMISSION_CATEGORIES} from '../../../constants/permissions';

export function PermissionsCustomizer({permissions,onTogglePermission,onBulkSet,onResetToTemplate,selectedRoleName='',isModified=false}) {
  const [query,setQuery]=useState(''),id=useId();
  const activeCount=Object.values(permissions || {}).filter(Boolean).length;
  const groups=useMemo(()=>PERMISSION_CATEGORIES.map(category=>({category,items:ALL_PERMISSIONS.filter(permission=>permission.categoryId===category.id && `${permission.label} ${permission.desc} ${permission.key}`.toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.items.length),[query]);
  const bulk=value=>onBulkSet(Object.fromEntries(ALL_PERMISSIONS.map(permission=>[permission.key,value])));
  return <section className="admin-permissions" aria-label="Pengaturan izin fitur">
    <div className="admin-permissions-heading"><h3>Izin fitur</h3><span>{activeCount} dari {ALL_PERMISSIONS.length} aktif</span></div>
    <p className={isModified?'admin-permissions-modified':''}>{isModified?'Disesuaikan dari':'Mengikuti'} template {selectedRoleName}.</p>
    <div className="admin-permission-tools">
      <button type="button" onClick={onResetToTemplate}><LuRotateCcw aria-hidden="true"/>Reset template</button>
      <button type="button" onClick={()=>bulk(true)}>Pilih semua</button>
      <button type="button" onClick={()=>bulk(false)}>Kosongkan</button>
    </div>
    <label className="admin-permission-search" htmlFor={id}><span className="sr-only">Cari izin fitur</span><LuSearch aria-hidden="true"/><input id={id} type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cari izin fitur…"/></label>
    <div className="admin-permission-groups">
      {groups.map(({category,items})=><details key={category.id} open={Boolean(query)||undefined}>
        <summary><span>{category.name}</span><span className="admin-permission-count">{items.filter(item=>permissions?.[item.key]).length}/{items.length}</span><LuChevronDown aria-hidden="true"/></summary>
        <div>{items.map(permission=><label key={permission.key} className="admin-permission-row"><span><strong>{permission.label}</strong><span>{permission.desc}</span></span><input type="checkbox" checked={Boolean(permissions?.[permission.key])} onChange={()=>onTogglePermission(permission.key)} aria-label={permission.label}/></label>)}</div>
      </details>)}
      {!groups.length&&<p role="status">Tidak ada izin yang cocok dengan pencarian.</p>}
    </div>
  </section>;
}
