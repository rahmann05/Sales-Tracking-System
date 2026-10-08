import {useCallback,useEffect,useRef,useState} from 'react';
import {ordersApi,collectPages} from '../../../services/api';
export function useSalesOrders(){
  const [orders,setOrders]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const flight=useRef(0);
  const reload=useCallback(async()=>{const seq=++flight.current;setLoading(true);try{const res=await collectPages(ordersApi.getAllOrders);if(seq===flight.current){setOrders(res.data);setError('');}}catch(e){if(seq===flight.current){setOrders([]);setError(e.message);}}finally{if(seq===flight.current)setLoading(false);}},[]);
  useEffect(()=>{reload();const tick=setInterval(reload,60000);window.addEventListener('focus',reload);window.addEventListener('operational-data-changed',reload);return()=>{flight.current++;clearInterval(tick);window.removeEventListener('focus',reload);window.removeEventListener('operational-data-changed',reload);};},[reload]);
  return {orders,loading,error,reload};
}
