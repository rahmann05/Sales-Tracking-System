import React from 'react';
export function PolicyFieldRequirements({id,param,value='',onChange,disabled}){
 const selected=value.split(',').filter(Boolean);
 return <fieldset id={id} disabled={disabled} className="grid gap-2 sm:grid-cols-2"><legend className="sr-only">{param.label}</legend>{param.options.map(key=><label key={key} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={selected.includes(key)} onChange={e=>onChange((e.target.checked?[...selected,key]:selected.filter(item=>item!==key)).join(','))}/>{param.optionLabels[key]}</label>)}</fieldset>;
}
