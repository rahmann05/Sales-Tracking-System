import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { collectPages, outletsApi, clustersApi, usersApi } from '../services/api';
import { io } from 'socket.io-client';

const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const {user}=useApp();
  const [outlets,setOutlets]=useState([]);
  const [clusters,setClusters]=useState([]);
  const [salesUsers,setSalesUsers]=useState([]);
  const [dataVersion,setDataVersion]=useState(0);
  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState('');
  const hasFetchedRef=React.useRef(false);
  const flightRef=React.useRef(null);
  const userRef=React.useRef(user?.id);
  if(userRef.current!==user?.id){hasFetchedRef.current=false;userRef.current=user?.id;}
  const fetchAllData=useCallback(async()=>{
    if(!user?.id)return;
    if(flightRef.current?.userId===user.id)return flightRef.current.promise;
    const current=user.id;setIsLoading(true);setError('');
    const promise=(async()=>{
      try {
        const [outletResult,clusterResult,salesResult]=await Promise.all([
          collectPages(outletsApi.getAll),clustersApi.getAll(),
          ['ADMIN','SUPERVISOR'].includes(user.role)?collectPages(usersApi.getAll,{role:'SALES'}):Promise.resolve({data:[]}),
        ]);
        if(userRef.current!==current)return;
        setOutlets(outletResult.data);setClusters(clusterResult.data || []);setSalesUsers(salesResult.data);
        hasFetchedRef.current=true;setDataVersion(version=>version+1);
      } catch(err) {if(userRef.current===current)setError(err.message);}
      finally {if(userRef.current===current)setIsLoading(false);if(flightRef.current?.promise===promise)flightRef.current=null;}
    })();
    flightRef.current={userId:current,promise};return promise;
  },[user?.id,user?.role]);
  const ensureDataLoaded=useCallback(()=>{
    if(!hasFetchedRef.current)fetchAllData();
  },[fetchAllData]);
  useEffect(()=>{setOutlets([]);setClusters([]);setSalesUsers([]);if(!user?.id)setIsLoading(false);setError('');},[user?.id]);
  useEffect(()=>{
    if(!user?.id)return;
    const socket=io({auth:{token:localStorage.getItem('token')},transports:['polling','websocket'],reconnectionAttempts:2,reconnectionDelay:8000,timeout:10000});
    socket.on('cache:invalidate',()=>{if(hasFetchedRef.current)fetchAllData();});
    socket.io.on('reconnect_attempt',()=>{socket.auth={token:localStorage.getItem('token')};});
    return()=>{socket.io.removeAllListeners('reconnect_attempt');socket.removeAllListeners();socket.disconnect();};
  },[user?.id,fetchAllData]);
  const invalidate=useCallback(()=>{hasFetchedRef.current=false;fetchAllData();},[fetchAllData]);

  const contextValue = useMemo(() => ({
    outlets,
    clusters,
    salesUsers,
    dataVersion,
    isLoading, error,
    invalidate,
    ensureDataLoaded,
    refetchAll: fetchAllData,
  }), [outlets, clusters, salesUsers, dataVersion, isLoading, error, invalidate, ensureDataLoaded, fetchAllData]);

  return (
    <MapDataContext.Provider value={contextValue}>
      {children}
    </MapDataContext.Provider>
  );
};

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (!context) {
    throw new Error('useMapData must be used within MapDataProvider');
  }
  const { ensureDataLoaded } = context;
  useEffect(() => {
    ensureDataLoaded();
  }, [ensureDataLoaded]);
  return context;
};
