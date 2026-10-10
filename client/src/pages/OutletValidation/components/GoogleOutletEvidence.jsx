import React,{useState} from 'react';
import {point} from '../../OutletManagement/outletPresentation';
import {GoogleOutletMap} from './GoogleOutletMap';
export function GoogleOutletEvidence({run,outlet,fieldPoints=[],onRecheck,disabled}){
 const candidates=run?.providerContent?.candidates||[],[selected,setSelected]=useState('');
 const candidate=candidates.find(c=>c.placeId===(selected||run?.result?.selectedPlaceId))||candidates[0];
 if(!candidate)return <p className="ov-notice">Belum ada kandidat Google yang masih berlaku. Jalankan pemeriksaan untuk mendapatkan bukti terbaru.</p>;
 const link=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.name||'Outlet')}&query_place_id=${encodeURIComponent(candidate.placeId)}`;
 return <section className="ov-section"><div className="ov-section-heading"><h3>Kandidat Google</h3><span>{candidates.length} kandidat · satu penyedia</span></div>
  <div className="ov-candidates">{candidates.map((c,i)=><button type="button" className={`ov-candidate ${candidate.placeId===c.placeId?'is-selected':''}`} key={c.placeId} onClick={()=>setSelected(c.placeId)} aria-pressed={candidate.placeId===c.placeId}><strong>{i+1}. {c.name||'Deskripsi perlu diperbarui'}</strong><span>{c.address||'Jalankan ulang untuk memuat deskripsi Google.'}</span><small>Nama {c.nameScore??'—'}% · alamat {c.addressScore??'—'}%{c.distanceMeters!=null?` · ${c.distanceMeters.toLocaleString('id-ID')} m dari master`:''}</small>{c.conflicts?.map(s=><small key={s} className="app-error">{s}</small>)}</button>)}</div>
  <div className="ov-table-wrap"><table className="ov-table"><caption>Perbandingan data internal dan kandidat terpilih</caption><thead><tr><th>Data</th><th>Master internal</th><th>Google</th></tr></thead><tbody><tr><th>Nama</th><td>{outlet.name}</td><td>{candidate.name||'Perbarui pemeriksaan'}</td></tr><tr><th>Alamat</th><td>{outlet.address||'Belum tersedia'}</td><td>{candidate.address||'Perbarui pemeriksaan'}</td></tr><tr><th>Koordinat</th><td>{point(outlet)}</td><td>{point(candidate)} · referensi Google</td></tr><tr><th>Status usaha</th><td>{outlet.deletedAt?'Nonaktif':'Aktif'}</td><td>{candidate.businessStatus||'Belum tersedia'}</td></tr></tbody></table></div>
  <GoogleOutletMap outlet={outlet} candidate={candidate} fieldPoints={fieldPoints}/>
  <div className="ov-attribution"><img src="https://developers.google.com/static/maps/documentation/images/google_on_white.png" alt="Google" width="62" height="20"/><a href={link} target="_blank" rel="noreferrer">Buka kandidat di Google Maps ↗</a>{candidate.attributions?.map((a,i)=><span key={i}>{a.provider}</span>)}</div>
  {onRecheck&&<button type="button" className="app-button" disabled={disabled} onClick={()=>onRecheck(candidate.placeId)}>Periksa ulang kandidat ini</button>}
  <p className="ov-muted">Kandidat bukan bukti GPS lapangan. Melihat kandidat tidak mengubah hasil. Pemeriksaan ulang menggunakan bukti terbaru dan tetap menolak kandidat ambigu atau berkonflik.</p>
 </section>;
}
