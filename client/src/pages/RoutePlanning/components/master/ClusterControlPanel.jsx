import React, { useState } from 'react';
import { OutletListPanel } from './OutletListPanel';
import { RouteReferenceCard } from './RouteReferenceCard';
const steps=['Wilayah','Outlet dan rute','Penanggung jawab','Ringkasan'];

export function ClusterControlPanel({builder:b,user,allOutlets,dataLoading,dataError,onRetry,onCancel}) {
  const [query,setQuery]=useState('');
  const selectedIds=b.selectedOutlets.map(outlet=>outlet.id);
  const pool=[...new Map([...allOutlets,...b.selectedOutlets].map(outlet=>[outlet.id,outlet])).values()];
  const candidates=pool.filter(outlet=>outlet.type===b.draft.tradeType).filter(outlet=>`${outlet.name} ${outlet.outletCode || ''} ${outlet.address || ''}`.toLocaleLowerCase('id').includes(query.toLocaleLowerCase('id')));
  const disabled=b.busy||b.saving;
  return <section className="cluster-control-panel" aria-label="Buat kluster">
    <header className="cluster-panel-header"><h1>Buat kluster</h1><p>Langkah {b.step} dari 4 · {steps[b.step-1]}</p><ol className="cluster-steps" aria-label="Tahap pembuatan">{steps.map((label,index)=><li key={label} aria-current={b.step===index+1?'step':undefined}><span>{index+1}</span>{label}</li>)}</ol></header>
    <div className="cluster-panel-body app-form">
      {b.error&&<p role="alert" className="app-error">{b.error}</p>}
      {dataError&&<div role="alert" className="app-error">{dataError}<button type="button" className="app-button" onClick={onRetry}>Muat ulang outlet</button></div>}
      {b.step===1&&<>
        <p>Isi wilayah operasional. Nama kluster dapat disesuaikan sebelum disimpan.</p>
        <label className="app-field">Jenis kluster<select value={b.draft.tradeType} onChange={e=>b.field('tradeType',e.target.value)}><option value="GENERAL_TRADE">General Trade</option><option value="MODERN_TRADE">Modern Trade</option></select></label>
        <label className="app-field">Region / wilayah<input required minLength={2} maxLength={100} value={b.draft.region} onChange={e=>b.field('region',e.target.value)} placeholder="Contoh: Bandung Barat"/></label>
        <label className="app-field">Warna penanda peta<input type="color" value={b.draft.colorHex} onChange={e=>b.field('colorHex',e.target.value)}/></label>
      </>}
      {b.step===2&&<>
        <label className="app-field">Jumlah outlet terdekat<input type="number" min={1} max={100} value={b.outletCount} onChange={e=>b.setOutletCount(Number(e.target.value))} disabled={b.saving}/></label>
        <p>Klik titik peta untuk memilih outlet terdekat, atau pilih satu per satu di bawah. Perubahan jumlah otomatis memperbarui outlet dan rute dari titik pusat terakhir.</p>
        <label className="app-field">Cari outlet<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama, kode, atau alamat outlet"/></label>
        {dataLoading&&<p role="status">Memuat outlet…</p>}
        {b.busy&&<p role="status" aria-live="polite">Memperbarui pilihan outlet dan rute…</p>}
        <OutletListPanel outlets={candidates} selectedIds={selectedIds} disabled={disabled} onToggle={id=>b.toggleOutlet(pool.find(outlet=>outlet.id===id))}/>
        <p><strong>{selectedIds.length} outlet dipilih</strong>. Outlet yang sudah memiliki wilayah akan dipindahkan ketika kluster disimpan.</p>
        <button type="button" className="app-button" onClick={()=>b.generate()} disabled={disabled||!selectedIds.length}>{b.busy?'Menghitung rute…':'Hitung ulang rekomendasi rute'}</button>
        {!b.routes.length&&!b.busy&&<p>Rute referensi bersifat opsional. Susun jadwal kunjungan berikutnya melalui Master RJP.</p>}
        <div className="space-y-2">{b.routes.map((route,index)=><RouteReferenceCard key={index} route={route} index={index} isActive={index===b.activeRouteIndex} onClick={()=>b.setActiveRouteIndex(index)} outlets={pool}/>)}</div>
        <p className="text-xs text-on-surface-variant">Jarak rekomendasi merupakan estimasi antartitik. Garis peta mengikuti jalan bila layanan rute tersedia.</p>
      </>}
      {b.step===3&&<>
        <p>Pilih supervisor terlebih dahulu, kemudian sales dari timnya. Kluster dapat disimpan tanpa sales.</p>
        {b.teamError&&<div role="alert" className="app-error">{b.teamError}<button type="button" className="app-button" onClick={b.loadTeam}>Muat ulang tim</button></div>}
        {user.role==='ADMIN'&&<label className="app-field">Supervisor<select value={b.draft.supervisorId} onChange={e=>b.field('supervisorId',e.target.value)} disabled={b.teamLoading||user.role==='SUPERVISOR'}><option value="">Belum ditugaskan</option>{b.team.supervisors.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
        {user.role==='SUPERVISOR'&&<p>Penanggung jawab: <strong>{user.name}</strong></p>}
        <label className="app-field">Sales bertugas<select value={b.draft.assignedSalesId} onChange={e=>b.field('assignedSalesId',e.target.value)} disabled={b.teamLoading||!b.draft.supervisorId}><option value="">Belum ditugaskan</option>{b.team.sales.filter(person=>person.supervisorId===b.draft.supervisorId).map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        {b.teamLoading&&<p role="status">Memuat tim…</p>}
      </>}
      {b.step===4&&<>
        <label className="app-field">Nama kluster<input required minLength={2} maxLength={150} value={b.draft.name} onChange={e=>b.field('name',e.target.value)} disabled={b.saving}/></label>
        <dl className="cluster-summary"><dt>Jenis</dt><dd>{b.draft.tradeType==='MODERN_TRADE'?'Modern Trade':'General Trade'}</dd><dt>Region</dt><dd>{b.draft.region}</dd><dt>Outlet</dt><dd>{selectedIds.length} outlet</dd><dt>Rute referensi</dt><dd>{b.routes.length?`Rute ${b.activeRouteIndex+1}`:'Belum ditetapkan'}</dd><dt>Supervisor</dt><dd>{b.team.supervisors.find(person=>person.id===b.draft.supervisorId)?.name||'Belum ditugaskan'}</dd><dt>Sales</dt><dd>{b.team.sales.find(person=>person.id===b.draft.assignedSalesId)?.name||'Belum ditugaskan'}</dd></dl>
        <p>Perubahan wilayah berlaku untuk perencanaan selanjutnya. PJP dan absensi yang sudah tercatat tetap tersimpan.</p>
      </>}
    </div>
    <footer className="cluster-panel-footer"><button type="button" className="app-button" disabled={disabled} onClick={b.step===1?onCancel:()=>b.setStep(value=>value-1)}>{b.step===1?'Kembali ke daftar':'Kembali'}</button>{b.step<4?<button type="button" className="app-button app-button-primary" disabled={disabled||(b.step===3&&(b.teamLoading||Boolean(b.teamError)))} onClick={b.next}>Lanjut</button>:<button type="button" className="app-button app-button-primary" disabled={disabled} onClick={b.save}>{b.saving?'Menyimpan…':'Simpan kluster'}</button>}</footer>
  </section>;
}
