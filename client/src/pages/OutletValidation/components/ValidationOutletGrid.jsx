import React from 'react';
import {stamp,reviewLabels,resultLabels} from '../../OutletManagement/outletPresentation';
export function ValidationOutletGrid({rows,selected,onSelect,loading}) {
 return <div className="outlet-case-list" aria-label="Daftar kasus pemeriksaan" aria-busy={loading}>{rows.map(r=><button type="button" key={r.id} aria-pressed={r.id===selected} onClick={()=>onSelect(r.id)}><div><strong>{r.outlet.name}</strong><span className="outlet-badge">{reviewLabels[r.status]}</span></div><small>{r.outlet.outletCode || 'Kode belum tersedia'} · {r.outlet.cluster?.name || 'Wilayah belum tersedia'}</small><p>{r.reason}</p><span>{r.runs[0]?resultLabels[r.runs[0].result.code]:'Peta belum diperiksa'}</span><small>{r.requestedBy.name} · {stamp(r.updatedAt)}</small></button>)}{!rows.length&&!loading&&<p className="app-empty">Tidak ada kasus sesuai filter. Outlet yang belum diajukan tidak perlu diperiksa.</p>}{loading&&<p className="app-empty" role="status">Memuat kasus…</p>}</div>;
}
