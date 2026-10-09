import {useEffect,useRef,useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {pjpApi} from '../../../services/api';
import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
const initial=user=>({requestId:crypto.randomUUID(),name:'Rencana kunjungan',supervisorId:user.role==='SUPERVISOR'?user.id:'',startsOn:wibDateKey(),endsOn:new Date(Date.parse(wibDateKey())+27*86400000).toISOString().slice(0,10),rules:[],id:'',revision:undefined,status:'DRAFT'});
export function useVisitPlanner(){
 const {user}=useApp(),draft=useFormDraft('visit-planner',()=>initial(user));
 const [source,setSource]=useState({sales:[],outlets:[],workingDays:[]}),[team,setTeam]=useState({supervisors:[]}),[plans,setPlans]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[review,setReview]=useState(null);
 const baseline=useRef(draft.restored?'':JSON.stringify(draft.value)),flight=useRef(false);
 const dirty=draft.value.status==='DRAFT'&&JSON.stringify(draft.value)!==baseline.current;
 useUnsavedNavigation(dirty,busy);
 const reload=async()=>{setLoading(true);setError('');try{const [s,p]=await Promise.all([pjpApi.getTemplates(),pjpApi.listPlans()]);const saved=p.data.find(v=>v.id===draft.value.id);if(saved)baseline.current=JSON.stringify(saved);setSource(s.data);setTeam({supervisors:s.data.supervisors||[]});setPlans(p.data);}catch(e){setError(e.message);}finally{setLoading(false);}};
 useEffect(()=>{reload();},[]);
 const change=update=>{draft.setValue(update);setReview(null);setMessage('');};
 const field=(key,value)=>change(v=>({...v,[key]:value}));
 const choose=async id=>{if(!window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))return;setBusy(true);setError('');try{const next=id?(await pjpApi.getPlan(id)).data:initial(user);draft.setValue(next);baseline.current=JSON.stringify(next);setReview(null);setMessage('');}catch(e){setError(e.message);}finally{setBusy(false);}};
 const copyNext=()=>{if(busy||loading||!window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))return;const previous=draft.value,length=Math.max(1,Math.min(62,Math.round((Date.parse(previous.endsOn)-Date.parse(previous.startsOn))/86400000)+1));if(!Number.isFinite(length)){setError('Periksa tanggal periode sebelum menyalin rencana.');return;}const nextDay=new Date(Date.parse(previous.endsOn)+86400000).toISOString().slice(0,10),startsOn=nextDay>wibDateKey()?nextDay:wibDateKey(),next={...initial(user),name:previous.name,supervisorId:previous.supervisorId,startsOn,endsOn:new Date(Date.parse(startsOn)+(length-1)*86400000).toISOString().slice(0,10),rules:previous.rules.map(rule=>({...rule}))};draft.setValue(next);baseline.current='';setReview(null);setError('');setMessage('Draft periode berikutnya dibuat. Tanggal acuan dipertahankan agar interval F2/F4 tidak mulai ulang. Periksa penugasan dan kalender, lalu simpan.');};
 const run=async action=>{if(flight.current)return;flight.current=true;setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(e.message);}finally{flight.current=false;setBusy(false);}};
 const preview=()=>run(async()=>{setReview((await pjpApi.previewPlan(draft.value)).data);});
 const save=()=>run(async()=>{const saved=(await pjpApi.savePlan(draft.value.id,draft.value)).data;draft.setValue(saved);baseline.current=JSON.stringify(saved);setPlans(previous=>[saved,...previous.filter(p=>p.id!==saved.id)]);setMessage('Draft tersimpan. Tinjau kalender sebelum menerbitkan.');setReview(null);});
 const publish=body=>run(async()=>{if(dirty||!draft.value.id)throw new Error('Simpan draft terbaru sebelum menerbitkan.');const result=(await pjpApi.publishPlan(draft.value.id,{...body,revision:draft.value.revision})).data;draft.setValue(result.plan);baseline.current=JSON.stringify(result.plan);setPlans(previous=>[result.plan,...previous.filter(p=>p.id!==result.plan.id)]);setMessage(`${result.count} PJP diterbitkan. Sales dapat melihatnya pada tanggal penugasan.`);window.dispatchEvent(new CustomEvent('operational-data-changed'));});
 return {value:draft.value,restored:draft.restored,storageError:draft.storageError,source,team,plans,loading,busy,error,message,review,dirty,field,change,choose,copyNext,preview,save,publish,reload};
}
