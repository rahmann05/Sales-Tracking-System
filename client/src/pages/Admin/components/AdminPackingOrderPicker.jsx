import React,{useEffect,useState} from 'react';
import {LuSearch} from 'react-icons/lu';
import {ordersApi} from '../../../services/api';
const hasUnpackedItems=order=>!order.fulfillmentLines||order.fulfillmentLines.some(item=>Number(item.unpacked)>0);

export function AdminPackingOrderPicker({allowPending,onSelect}) {
  const [status,setStatus]=useState('APPROVED'),[page,setPage]=useState(1),[search,setSearch]=useState('');
  const [result,setResult]=useState({data:[],pagination:{}}),[loading,setLoading]=useState(true),[error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');setResult({data:[],pagination:{}});
    ordersApi.getAllOrders({status,page,limit:20}).then(response=>{if(active)setResult(response.data||{data:[],pagination:{}});})
      .catch(reason=>{if(active)setError(reason.message||'Daftar order gagal dimuat.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[status,page]);
  const query=search.trim().toLocaleLowerCase('id-ID');
  const visible=result.data.filter(order=>`${order.code||''} ${order.customerSnapshot?.name||order.pjpStop?.outlet?.name||''} ${order.createdByUser?.name||''} ${(order.items||[]).map(item=>item.product?.name||item.productName||'').join(' ')}`.toLocaleLowerCase('id-ID').includes(query));
  const pagination=result.pagination||{};
  const hasNext=pagination.hasNextPage??page<(pagination.totalPages||1);
  return <section className="admin-order-picker">
    <div className="admin-toolbar"><label className="admin-search"><LuSearch aria-hidden="true"/><input type="search" aria-label="Cari order pada halaman sumber packing" placeholder="Cari nomor, outlet, sales, atau barang…" value={search} onChange={event=>setSearch(event.target.value)}/></label><label className="admin-select-label">Status<select value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}><option value="APPROVED">Disetujui</option>{allowPending&&<option value="PENDING_APPROVAL">Menunggu persetujuan</option>}</select></label></div>
    <p className="admin-footnote">Pencarian berlaku pada halaman ini. {status==='PENDING_APPROVAL'?'Pemakaian order yang belum disetujui memerlukan alasan pengambilalihan Admin.':'Order disetujui yang masih memiliki barang belum dipacking dapat dipilih.'}</p>
    {error&&<p role="alert" className="admin-feedback error">{error}</p>}
    <div className="admin-panel admin-table-scroll"><table className="admin-data-table"><caption className="sr-only">Pilih order sebagai sumber packing list</caption><thead><tr><th>Order / outlet</th><th>Sales</th><th>Nilai order</th><th>Tindakan</th></tr></thead><tbody>{visible.map(order=><tr key={order.id}><td><strong>{order.code||'Order lama'}</strong><span className="block">{order.customerSnapshot?.name||order.pjpStop?.outlet?.name||'Outlet belum tercatat'}</span><small>{order.createdAt?new Date(order.createdAt).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'}):'Tanggal belum tercatat'}</small></td><td>{order.createdByUser?.name||'—'}</td><td>Rp {Number(order.totalValue||0).toLocaleString('id-ID')}</td><td><button type="button" className="admin-button primary" disabled={!hasUnpackedItems(order)} onClick={()=>onSelect(order)}>{hasUnpackedItems(order)?'Pilih order':'Tidak ada sisa'}</button></td></tr>)}</tbody></table>{!visible.length&&<p className="admin-empty" role="status">{loading?'Memuat order…':error?'Daftar order belum tersedia.':'Tidak ada order dalam pilihan ini.'}</p>}</div>
    <footer className="admin-pagination"><span>Halaman {page} · {visible.length} order ditampilkan</span><div><button type="button" disabled={page===1||loading} onClick={()=>setPage(page-1)}>Sebelumnya</button><button type="button" disabled={!hasNext||loading} onClick={()=>setPage(page+1)}>Berikutnya</button></div></footer>
  </section>;
}
