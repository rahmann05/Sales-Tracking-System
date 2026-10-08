import {useCallback,useEffect,useRef,useState} from 'react';
import {absensiApi,outletsApi,routeChangesApi,collectPages} from '../../../services/api';
import {mapServerRouteChange,mapServerUnlockRequest} from '../../../utils/incidentMapper';
const list=response=>{const rows=Array.isArray(response?.data)?response.data:response?.data?.data||response?.data?.items;if(!Array.isArray(rows))throw new Error('Respons antrean belum dapat dibaca. Silakan perbarui.');return rows;};
export function useSupervisorQueue(section){
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const revision=useRef(0);
  const reload=useCallback(async()=>{
    const current=++revision.current;setLoading(true);setError('');setData(null);
    try{
      let rows=[];
      if(section==='unlock')rows=list(await collectPages(outletsApi.getUnlockRequests)).map(mapServerUnlockRequest);
      if(section==='closed')rows=list(await collectPages(routeChangesApi.getAll)).map(mapServerRouteChange);
      if(section==='offpjp')rows=list(await collectPages(absensiApi.getOffPjpList)).map(item=>({...item,queueKind:'attendance',salesName:item.user?.name||'',timestamp:item.createdAt?new Date(item.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':'Belum tersedia'}));
      if(current===revision.current)setData(rows);
    }catch(e){if(current===revision.current)setError(e.message);}finally{if(current===revision.current)setLoading(false);}
  },[section]);
  useEffect(()=>{reload();window.addEventListener('focus',reload);window.addEventListener('operational-data-changed',reload);return()=>{revision.current++;window.removeEventListener('focus',reload);window.removeEventListener('operational-data-changed',reload);};},[reload]);
  return {data,error,loading,reload};
}
