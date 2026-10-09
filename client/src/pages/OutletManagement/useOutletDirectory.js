import {useCallback,useEffect,useRef,useState} from 'react';
import {outletsApi,clustersApi} from '../../services/api';
import {useDebounce} from '../../shared/hooks/useDebounce';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
export function useOutletDirectory(prefix='outlet') {
 const [search,setSearch]=useWorkspaceState(prefix+'Search',''),[cluster,setCluster]=useWorkspaceState(prefix+'Cluster',''),[status,setStatus]=useWorkspaceState(prefix+'Status','ACTIVE'),[page,setPage]=useWorkspaceState(prefix+'Page','1');
 const [data,setData]=useState([]),[pagination,setPagination]=useState({total:0,totalPages:1}),[clusters,setClusters]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[clusterError,setClusterError]=useState('');
 const debounced=useDebounce(search,250),version=useRef(0);
 const load=useCallback(async()=>{
  const request=++version.current;setLoading(true);setError('');
  try {const res=await outletsApi.directory({search:debounced,clusterId:cluster||undefined,status,page,limit:25});if(request===version.current){setData(res.data);setPagination(res.pagination);if(Number(page)>res.pagination.totalPages)setPage(String(res.pagination.totalPages),{replace:true});}}
  catch(e){if(request===version.current){setError(e.message);setData([]);}}
  finally{if(request===version.current)setLoading(false);}
 },[debounced,cluster,status,page,setPage]);
 useEffect(()=>{load();return()=>{version.current++;};},[load]);
 useEffect(()=>{let live=true;clustersApi.getAll().then(r=>{if(live)setClusters(r.data||[]);}).catch(e=>{if(live)setClusterError(e.message);});return()=>{live=false;};},[]);
 const filter=(setter,value)=>{setter(value,{replace:true});setPage('1',{replace:true});};
 return {data,pagination,clusters,loading,error,clusterError,load,search,setSearch:v=>filter(setSearch,v),cluster,setCluster:v=>filter(setCluster,v),status,setStatus:v=>filter(setStatus,v),page:Number(page)||1,setPage:v=>setPage(String(v),{replace:true})};
}
