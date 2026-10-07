import { useState, useCallback, useEffect, useRef } from 'react';
import { pjpApi } from '../../../services/api';
const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
export const useSupervisorRollingMatrix = () => {
  const [source, setSource] = useState({sales:[],outlets:[]});
  const [weekType,setWeekType] = useState('WEEK_1');
  const [error,setError] = useState('');
  const [loading,setLoading]=useState(true);
  const revision=useRef(0);
  const initializedWeek=useRef(false);
  const [busy,setBusy] = useState(false);
  const [selectedCell,setSelectedCell] = useState(null);
  const [isReassignModalOpen,setIsReassignModalOpen] = useState(false);
  const [isAutoRollingModalOpen,setIsAutoRollingModalOpen] = useState(false);
  const reload = useCallback(async () => {
    const current=++revision.current;setLoading(true);setError('');
    try{const res=await pjpApi.getTemplates();if(current===revision.current){setSource(res.data);if(!initializedWeek.current){setWeekType(res.data.currentWeekType || 'WEEK_1');initializedWeek.current=true;}}}
    catch(e){if(current===revision.current)setError(e.message);throw e;}
    finally{if(current===revision.current)setLoading(false);}
  },[]);
  useEffect(() => {reload().catch(()=>{});return()=>{revision.current++;};},[reload]);
  const days = (source.workingDays || [1,2,3,4,5,6]).map(index => DAYS[index]);
  const matrixRows = source.sales.map(s => ({salesId:s.id,salesName:s.name,spvName:s.supervisor?.name||'Belum ditugaskan',primaryCluster:s.cluster?.name||'—',
    schedule:Object.fromEntries(DAYS.map((day,dayOfWeek)=>{
      const exact=s.pjpTemplates.find(t=>t.dayOfWeek===dayOfWeek&&t.weekType===weekType);
      const t=exact||(weekType!=='ALL'?s.pjpTemplates.find(t=>t.dayOfWeek===dayOfWeek&&t.weekType==='ALL'):null);
      return [day,{clusterName:t ? (t.stops.length ? 'Jadwal toko' : 'Tanpa kunjungan') : 'Belum ada template',outletsCount:t?.stops.length||0,subDistrict:t?.stops.map(x=>x.outlet.name).join(', ')||'—',outletIds:t?.stops.map(x=>x.outletId)||[],configured:Boolean(t)}];
    }))}));
  const openReassignModal = (salesId,day,currentData) => {setSelectedCell({salesId,day,currentData,weekType,outlets:source.outlets.filter(o=>o.cluster?.supervisorId===source.sales.find(s=>s.id===salesId)?.supervisorId)});setIsReassignModalOpen(true);};
  const handleSaveDayReassignment = async ({salesId,day,outletIds}) => {
    await pjpApi.saveTemplates([{userId:salesId,dayOfWeek:DAYS.indexOf(day),weekType,outletIds}]);
    await reload();setIsReassignModalOpen(false);
  };
  const handleExecuteAutoRolling = async () => {
    setBusy(true);setError('');
    try {
      if(matrixRows.length<2) throw new Error('Rotasi memerlukan minimal dua sales');
      if(matrixRows.some(r=>days.some(day=>!r.schedule[day].configured))) throw new Error('Lengkapi template semua hari kerja dan sales sebelum rotasi');
      if (new Set(source.sales.map(s=>s.supervisorId)).size > 1) throw new Error('Rotasi dilakukan dalam satu tim supervisor. Gunakan penyuntingan per sales untuk beberapa tim.');
      const entries=matrixRows.flatMap((r,i)=>days.map(day=>({userId:r.salesId,dayOfWeek:DAYS.indexOf(day),weekType,outletIds:matrixRows[(i+matrixRows.length-1)%matrixRows.length].schedule[day].outletIds})));
      await pjpApi.saveTemplates(entries);await reload();setIsAutoRollingModalOpen(false);
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  };
  return {reload,loading,weekMode:source.weekMode,matrixRows,days,weekType,setWeekType,error,busy,selectedCell,isReassignModalOpen,setIsReassignModalOpen,isAutoRollingModalOpen,setIsAutoRollingModalOpen,openReassignModal,handleSaveDayReassignment,handleExecuteAutoRolling};
};
