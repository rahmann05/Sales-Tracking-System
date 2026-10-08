import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import React,{useState,useEffect,useRef} from 'react';
import {LuSearch,LuRefreshCw,LuX} from 'react-icons/lu';
import {PendingOrderCard} from './PendingOrderCard';
import {UnlockRequestCard} from './UnlockRequestCard';
import {ManualSalesReview} from '../../../shared/components/common/ManualSalesReview';
import {AdminOrderTable} from './AdminOrderTable';
export function AdminOrderWorkspace({orders,filteredOrders,pendingOrders,approvedOrders,orderFilter,setOrderFilter,selectedSales,setSelectedSales,salesOptions,loading,loadApprovalData,handleDecision,pendingUnlockCount,manualPendingCount,unlockRequests,handleApproveUnlock,handleRejectUnlock,loadError,ordersOnly=false,hideHeading=false}){
  const [section,setSection]=useState('orders');
  const [search,setSearch]=useWorkspaceState('orderSearch',''),[selectedId,setSelectedId]=useWorkspaceState('orderDetail','');
  const [page,setPage]=useState(1);
  const query=search.trim().toLocaleLowerCase('id-ID');
  const visible=filteredOrders.filter(order=>`${order.code||''} ${order.outletName} ${order.salesName}`.toLocaleLowerCase('id-ID').includes(query));
  const currentPage=Math.min(page,Math.max(1,Math.ceil(visible.length/15)));
  const selected=visible.find(order=>order.id===selectedId);
  const detailRef=useRef(null);
  useEffect(()=>{if(selected?.id){detailRef.current?.focus({preventScroll:true});if(window.matchMedia('(max-width:1199px)').matches)detailRef.current?.scrollIntoView({block:'start'});else detailRef.current?.closest('main')?.scrollTo({top:0});}},[selected?.id]);
  const changeFilter=value=>{setOrderFilter(value);setPage(1);};
  return <div className="workspace-page admin-order-workspace">
    {!hideHeading&&<header className="admin-page-heading"><div><p className="admin-eyebrow">Order / Pemeriksaan</p><h1>Order & persetujuan</h1><p>Periksa pesanan dan tetapkan keputusan sebelum diproses ke packing.</p></div><button className="admin-button" type="button" disabled={loading} onClick={loadApprovalData}><LuRefreshCw/>{loading?'Memuat…':'Perbarui'}</button></header>}
    {loadError&&<p className="admin-feedback error" role="alert">{loadError} Data terakhir tetap ditampilkan.</p>}
    {!ordersOnly&&<nav className="admin-local-tabs" aria-label="Jenis pemeriksaan">{[['orders','Order',pendingOrders.length],['unlock','Izin presensi outlet',pendingUnlockCount],['manual','Presensi manual',manualPendingCount]].map(([id,label,count])=><button type="button" key={id} aria-pressed={section===id} onClick={()=>setSection(id)}>{label}<span>{count}</span></button>)}</nav>}
    {section==='orders'&&<>
      <div className="admin-inline-metrics"><span><strong>{orders.length}</strong> total order</span><span><strong>{pendingOrders.length}</strong> menunggu keputusan</span><span><strong>{approvedOrders.length}</strong> disetujui</span></div>
      <div className="admin-toolbar"><label className="admin-search"><LuSearch aria-hidden="true"/><input type="search" aria-label="Cari order" placeholder="Cari nomor, outlet, atau sales…" value={search} onChange={event=>{setSearch(event.target.value,{replace:true});setPage(1);}}/></label><label className="admin-select-label">Sales<select aria-label="Filter sales" value={selectedSales} onChange={event=>{setSelectedSales(event.target.value);setPage(1);}}><option value="ALL">Semua sales</option>{salesOptions.map(name=><option key={name}>{name}</option>)}</select></label><label className="admin-select-label">Status<select aria-label="Filter status order" value={orderFilter} onChange={event=>changeFilter(event.target.value)}><option value="ALL">Semua status</option><option value="PENDING">Menunggu</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option></select></label></div>
      <div className={`admin-order-layout ${selected?'has-selection':''}`}>
        <section className="admin-panel admin-order-list" aria-label="Daftar order"><AdminOrderTable orders={visible.slice((currentPage-1)*15,currentPage*15)} selectedId={selectedId} onSelect={setSelectedId} loading={loading}/><footer className="admin-pagination"><span>{visible.length} order · Halaman {currentPage} / {Math.max(1,Math.ceil(visible.length/15))}</span><div><button type="button" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Sebelumnya</button><button type="button" disabled={currentPage*15>=visible.length} onClick={()=>setPage(currentPage+1)}>Berikutnya</button></div></footer></section>
        {selected&&<aside className="admin-panel admin-order-detail" aria-label="Detail order"><div className="admin-panel-heading"><h2 ref={detailRef} tabIndex={-1}>Detail order</h2><button type="button" aria-label="Tutup detail order" onClick={()=>setSelectedId('')}><LuX/></button></div><PendingOrderCard key={selected.id} order={selected} onDecision={handleDecision}/></aside>}
      </div>
    </>}
    {section==='unlock'&&<section className="admin-review-queue"><div><h2>Izin presensi outlet</h2><p>Pengecualian untuk sales yang belum menuntaskan presensi sebelumnya.</p></div>{unlockRequests.length?unlockRequests.map(request=><UnlockRequestCard key={request.id} request={request} onApprove={handleApproveUnlock} onReject={handleRejectUnlock}/>):<p className="admin-empty">Tidak ada permintaan izin presensi.</p>}</section>}
    {section==='manual'&&<section className="admin-panel admin-manual-review"><h2>Pemeriksaan presensi manual</h2><ManualSalesReview/></section>}
  </div>;
}
