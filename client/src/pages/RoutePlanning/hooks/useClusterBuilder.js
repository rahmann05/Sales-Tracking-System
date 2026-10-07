import { useCallback, useEffect, useRef, useState } from 'react';
import { clustersApi, teamsApi } from '../../../services/api';

// Owns the draft and API operations; map rendering is handled separately.
export function useClusterBuilder({user,onSaved}) {
  const [step,setStep]=useState(1);
  const [draft,setDraft]=useState({name:'',region:'',tradeType:'GENERAL_TRADE',colorHex:'#3b82f6',supervisorId:user.role==='SUPERVISOR'?user.id:'',assignedSalesId:''});
  const [team,setTeam]=useState({sales:[],supervisors:[]});
  const [teamLoading,setTeamLoading]=useState(true);
  const [teamError,setTeamError]=useState('');
  const [outletCount,setOutletCountState]=useState(10);
  const [selectedOutlets,setSelectedOutlets]=useState([]);
  const [centerPoint,setCenterPoint]=useState(null);
  const [routes,setRoutes]=useState([]);
  const [activeRouteIndex,setActiveRouteIndex]=useState(0);
  const [busy,setBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const countTimer=useRef(null);
  const operation=useRef(0),alive=useRef(true),savingRef=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;operation.current++;clearTimeout(countTimer.current);};},[]);
  const loadTeam=useCallback(async()=>{
    setTeamLoading(true);setTeamError('');
    try{const result=await teamsApi.getAll();if(alive.current)setTeam(result.data);}
    catch(err){if(alive.current)setTeamError(err.message);}
    finally{if(alive.current)setTeamLoading(false);}
  },[]);
  useEffect(()=>{loadTeam();},[loadTeam]);
  const field=(key,value)=>{if(key==='tradeType'){clearTimeout(countTimer.current);operation.current++;setBusy(false);setSelectedOutlets([]);setRoutes([]);setCenterPoint(null);}setDraft(previous=>({...previous,[key]:value,...(key==='supervisorId'?{assignedSalesId:''}:{})}));};
  const replaceSelection=useCallback(outlets=>{
    clearTimeout(countTimer.current);operation.current++;setBusy(false);setSelectedOutlets(outlets);setRoutes([]);setActiveRouteIndex(0);setError('');
  },[]);
  const toggleOutlet=useCallback(outlet=>{
    if(outlet.type!==draft.tradeType){setError('Pilih outlet dengan jenis perdagangan yang sama.');return;}
    if(!selectedOutlets.some(item=>item.id===outlet.id)&&selectedOutlets.length>=100){setError('Maksimal 100 outlet per kluster baru.');return;}
    replaceSelection(selectedOutlets.some(item=>item.id===outlet.id)?selectedOutlets.filter(item=>item.id!==outlet.id):[...selectedOutlets,outlet]);
  },[replaceSelection,selectedOutlets,draft.tradeType]);
  const generate=useCallback(async(outlets=selectedOutlets)=>{
    if(!outlets.length){setError('Pilih minimal satu outlet sebelum membuat rute.');return;}
    const current=++operation.current;setBusy(true);setError('');setRoutes([]);
    try{const result=await clustersApi.generateRoutes(outlets.map(item=>item.id));if(alive.current&&current===operation.current){setRoutes(result.data || []);setActiveRouteIndex(0);if(!result.data?.length)setError('Rute belum tersedia. Coba hitung ulang.');}}
    catch(err){if(alive.current&&current===operation.current)setError(err.message);}
    finally{if(alive.current&&current===operation.current)setBusy(false);}
  },[selectedOutlets]);
  const selectCenter=useCallback(async(coords,requestedCount=outletCount)=>{
    if(savingRef.current)return;
    clearTimeout(countTimer.current);
    if(!Number.isInteger(requestedCount)||requestedCount<1||requestedCount>100){setError('Jumlah outlet harus antara 1 dan 100.');return;}
    const current=++operation.current;setCenterPoint(coords);setBusy(true);setError('');setRoutes([]);setSelectedOutlets([]);
    try{
      const result=await clustersApi.getNearestOutlets(coords.lat,coords.lng,requestedCount,draft.tradeType);
      if(!alive.current||current!==operation.current)return;
      const outlets=result.data || [];setSelectedOutlets(outlets);
      if(!outlets.length){setError('Tidak ada outlet dalam akses Anda. Pilih outlet dari daftar atau periksa wilayah tim.');return;}
      await generate(outlets);
    }catch(err){if(alive.current&&current===operation.current)setError(err.message);}
    finally{if(alive.current&&current===operation.current)setBusy(false);}
  },[outletCount,generate,draft.tradeType]);
  const setOutletCount=useCallback(value=>{
    if(savingRef.current)return;
    setOutletCountState(value);clearTimeout(countTimer.current);
    if(!centerPoint)return;
    operation.current++;setRoutes([]);setSelectedOutlets([]);setActiveRouteIndex(0);
    if(!Number.isInteger(value)||value<1||value>100){setBusy(false);setError('Jumlah outlet harus antara 1 dan 100.');return;}
    setBusy(true);setError('');
    // Small delay groups rapid keystrokes; only the latest amount may populate the draft.
    countTimer.current=setTimeout(()=>selectCenter(centerPoint,value),250);
  },[centerPoint,selectCenter]);
  const next=()=>{
    if(busy||saving)return;
    if(step===1&&draft.region.trim().length<2){setError('Isi region minimal dua karakter.');return;}
    if(step===2&&!selectedOutlets.length){setError('Pilih minimal satu outlet.');return;}
    setError('');
    if(step===3&&!draft.name.trim())field('name',`Kluster ${draft.region.trim()}`);
    setStep(value=>Math.min(value+1,4));
  };
  const save=async()=>{
    if(savingRef.current||busy)return;
    if(draft.name.trim().length<2||draft.region.trim().length<2||!selectedOutlets.length){setError('Lengkapi nama, region, dan minimal satu outlet.');return;}
    if(teamLoading||teamError){setError('Muat kembali daftar penanggung jawab sebelum menyimpan.');return;}
    savingRef.current=true;setSaving(true);setError('');
    try{
      const {tradeType,...payload}=draft;
      if(selectedOutlets.some(outlet=>outlet.type!==tradeType))throw new Error('Kluster tidak boleh mencampur jenis toko.');
      await clustersApi.createFull({...payload,name:draft.name.trim(),region:draft.region.trim(),supervisorId:draft.supervisorId||null,assignedSalesId:draft.assignedSalesId||null,centerLat:centerPoint?.lat??null,centerLng:centerPoint?.lng??null,outletIds:selectedOutlets.map(item=>item.id),routes:routes.map((route,index)=>({...route,routeIndex:index,isActive:index===activeRouteIndex}))});
      if(alive.current)onSaved();
    }catch(err){if(alive.current)setError(err.message);}
    finally{savingRef.current=false;if(alive.current)setSaving(false);}
  };
  return {step,setStep,draft,field,team,teamLoading,teamError,loadTeam,outletCount,setOutletCount,selectedOutlets,centerPoint,routes,activeRouteIndex,setActiveRouteIndex,busy,saving,error,toggleOutlet,selectCenter,generate,next,save};
}
