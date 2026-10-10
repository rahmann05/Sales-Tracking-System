import React,{useCallback,useEffect,useState} from 'react';
import {outletValidationApi} from '../../services/api';
import {OutletFieldForm} from './OutletFieldForm';
import '../../styles/pages/OutletValidation.css';
export function SalesOutletValidationForm({taskId}){
 const [task,setTask]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await outletValidationApi.fieldTask(taskId);setTask(r.data);}catch(e){setError(e.message);}finally{setLoading(false);}},[taskId]);
 useEffect(()=>{let active=true;setLoading(true);setTask(null);outletValidationApi.fieldTask(taskId).then(r=>{if(active){setTask(r.data);setError('');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[taskId]);
 return <div className="ov-workspace">{loading?<p role="status">Memuat formulir validasi ulang…</p>:error?<p role="alert" className="app-error">{error} <button type="button" className="app-button" onClick={load}>Coba lagi</button></p>:task&&<OutletFieldForm key={task.id} task={task} onSaved={async()=>{await load();window.dispatchEvent(new CustomEvent('operational-data-changed'));}}/>}</div>;
}
