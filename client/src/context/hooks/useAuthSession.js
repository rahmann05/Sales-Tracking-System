import { useState, useEffect, useRef, useCallback } from 'react';
import { authApi, getAuthToken } from '../../services/api';
const ROLE_LABELS={SALES:'Sales',SUPERVISOR:'Supervisor',ADMIN:'Admin',KEPALA_GUDANG:'Kepala Gudang',SUPIR:'Supir'};
const normalize=user=>user?{...user,roleLabel:user.roleLabel || ROLE_LABELS[user.role] || user.role}:null;
export function useAuthSession(resetDomainState) {
  // Stored profile is a cache, never proof that a session is still authorized.
  const [user,setUser]=useState(null);
  const [sessionLoading,setSessionLoading]=useState(()=>Boolean(getAuthToken()));
  const [sessionError,setSessionError]=useState('');
  const version=useRef(0);
  const resetRef=useRef(resetDomainState);resetRef.current=resetDomainState;
  const setUserFromAuth=useCallback(()=>{version.current++;setUser(normalize(authApi.getStoredUser()));setSessionLoading(false);setSessionError('');},[]);
  useEffect(()=>{
    let active=true,busy=false;
    const reset=event=>{version.current++;setUser(null);setSessionLoading(false);setSessionError(event.type==='auth:expired'?'Sesi berakhir. Silakan masuk kembali.':'');resetRef.current?.();};
    const restore=async()=>{
      if(busy || !getAuthToken())return;
      busy=true;const current=version.current;
      try {const res=await authApi.me();if(active&&current===version.current){const next=normalize(res.data);localStorage.setItem('authUser',JSON.stringify(next));setUser(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);setSessionError('');}}
      catch(error){if(active&&current===version.current)setSessionError(error.message);}
      finally {busy=false;if(active&&current===version.current)setSessionLoading(false);}
    };
    window.addEventListener('auth:expired',reset);window.addEventListener('auth:logout',reset);window.addEventListener('auth:login',setUserFromAuth);window.addEventListener('focus',restore);
    restore();const timer=setInterval(restore,60000);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('auth:expired',reset);window.removeEventListener('auth:logout',reset);window.removeEventListener('auth:login',setUserFromAuth);window.removeEventListener('focus',restore);};
  },[setUserFromAuth]);
  return {user,setUser,setUserFromAuth,sessionLoading,sessionError};
}
