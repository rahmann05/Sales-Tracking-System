import {useCallback,useMemo,useState} from 'react';
// Published defaults can arrive after the page mounts. Explicit user choices,
// including empty values, always win until the page is opened again.
export function useConfiguredFilters(defaults){
 const [choices,setChoices]=useState({});
 const serialized=JSON.stringify(defaults);
 const filters=useMemo(()=>({...JSON.parse(serialized),...choices}),[serialized,choices]);
 const update=useCallback((field,value)=>setChoices(previous=>({...previous,[field]:value})),[]);
 return [filters,update];
}
