import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {outletValidationApi} from '../../../services/api';
import {confirmWorkspaceNavigation} from '../../../shared/utils/confirmWorkspaceNavigation';
import {useDebounce} from '../../../shared/hooks/useDebounce';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import {ValidationSummary} from './ValidationSummary';
import {ValidationFilters} from './ValidationFilters';
import {ValidationOutletGrid} from './ValidationOutletGrid';
import {OutletValidationDetail} from './OutletValidationDetail';
import {ValidationOutletPicker} from './ValidationOutletPicker';
export function OutletValidationPanel() {
 const featurePolicy=useFeaturePolicy('OUTLET_REVIEW');
 const [status,setStatus]=useWorkspaceState('outletReviewStatus','OPEN'),[search,setSearch]=useWorkspaceState('outletReviewSearch',''),[selected,setSelected]=useWorkspaceState('outletReview',''),[page,setPage]=useState(1),[rows,setRows]=useState([]),[pagination,setPagination]=useState({total:0,totalPages:1}),[summary,setSummary]=useState({}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[detail,setDetail]=useState(null),[detailError,setDetailError]=useState(''),[detailLoading,setDetailLoading]=useState(false),[picker,setPicker]=useState(false);
 const debounced=useDebounce(search,250),listVersion=useRef(0),detailVersion=useRef(0);
 const load=useCallback(async()=>{const v=++listVersion.current;setLoading(true);setError('');try{const [list,totals]=await Promise.all([outletValidationApi.reviews({status,search:debounced,page}),outletValidationApi.getSummary()]);if(v===listVersion.current){setRows(list.data);setPagination(list.pagination);setSummary(totals.data);}}catch(e){if(v===listVersion.current){setError(e.message);setRows([]);}}finally{if(v===listVersion.current)setLoading(false);}},[status,debounced,page]);
 const loadDetail=useCallback(async()=>{if(!selected){setDetail(null);return;}const v=++detailVersion.current;setDetailLoading(true);setDetailError('');try{const r=await outletValidationApi.review(selected);if(v===detailVersion.current)setDetail(r.data);}catch(e){if(v===detailVersion.current){setDetailError(e.message);setDetail(null);}}finally{if(v===detailVersion.current)setDetailLoading(false);}},[selected]);
 useEffect(()=>{load();return()=>{listVersion.current++;};},[load]);useEffect(()=>{loadDetail();return()=>{detailVersion.current++;};},[loadDetail]);
 const select=value=>{if(confirmWorkspaceNavigation())setSelected(value);};
 const refresh=async()=>{await Promise.all([load(),loadDetail()]);};
 const changeStatus=value=>{setStatus(value);setPage(1);};
 return <div className="outlet-review-workspace"><div className="outlet-review-intro"><p>Hanya outlet yang diajukan masuk antrean ini. Outlet aktif tetap dapat dipakai tanpa pemeriksaan peta.</p><button type="button" className="app-button app-button-primary" disabled={!featurePolicy.canStart} title={featurePolicy.reason} onClick={()=>setPicker(true)}>Pilih outlet untuk diperiksa</button></div><ValidationSummary summary={summary} status={status} onSelect={changeStatus}/>
  <div className={`outlet-review-layout ${selected?'has-detail':''}`}><section className="outlet-panel"><ValidationFilters search={search} onSearch={v=>{setSearch(v,{replace:true});setPage(1);}} onRefresh={load} loading={loading} total={pagination.total}/>{error&&<p className="app-error" role="alert">{error}</p>}<ValidationOutletGrid rows={rows} selected={selected} onSelect={select} loading={loading}/><div className="outlet-pagination"><button type="button" className="app-button" disabled={loading||page<=1} onClick={()=>setPage(p=>p-1)}>Sebelumnya</button><span>{page} / {pagination.totalPages}</span><button type="button" className="app-button" disabled={loading||page>=pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Berikutnya</button></div></section>
   {selected?(detailLoading&&!detail?<section className="outlet-panel app-empty" role="status">Memuat kasus…</section>:detailError?<section className="outlet-panel"><p className="app-error" role="alert">{detailError}</p><button type="button" className="app-button" onClick={loadDetail}>Coba lagi</button></section>:detail&&<OutletValidationDetail key={detail.id} review={detail} onRefresh={refresh} onClose={()=>select('')}/>):<section className="outlet-panel outlet-review-placeholder"><h2>Pilih kasus untuk meninjau bukti</h2><p>Periksa data master, bandingkan hasil peta, lalu pertahankan atau koreksi data dengan alasan yang jelas.</p></section>}
  </div>{picker&&<ValidationOutletPicker onClose={()=>{setPicker(false);load();}} onSaved={async reviews=>{setPicker(false);changeStatus('OPEN');if(reviews[0])setSelected(reviews[0].id);await load();}}/>}
 </div>;
}
