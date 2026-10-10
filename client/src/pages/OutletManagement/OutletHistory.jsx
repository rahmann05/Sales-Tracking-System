import React from 'react';

import {stamp,point,resultLabels,reviewLabels} from './outletPresentation';

const fields={name:'Nama outlet',address:'Alamat',latitude:'Latitude',longitude:'Longitude',clusterId:'Wilayah',ownerName:'Pemilik',phone:'Telepon',outletCode:'Kode outlet',channel:'Channel',subChannel:'Jenis outlet',radiusMeters:'Radius presensi',taxType:'Status pajak',taxNumber:'NIK / NPWP',taxName:'Nama dokumen',taxAddress:'Alamat dokumen',deletedAt:'Waktu penonaktifan',registrationId:'Referensi pengajuan',itineraryCode:'Interval kunjungan'};
const decisions={KEEP:'Data dipertahankan',CORRECTED:'Data dikoreksi',WAITING_FIELD:'Pengecekan lapangan diminta',DIGITAL_KEEP:'Identitas dikonfirmasi melalui Google',ADMIN_DIGITAL_KEEP:'Kandidat Google diterima dengan pertimbangan Admin',FIELD_KEEP:'Bukti lapangan diterima',INTERNAL_KEEP:'Dipertahankan berdasarkan bukti internal',CANCEL:'Ditutup tanpa verifikasi'};

export function OutletHistory({outlet}) {

 return <section className="outlet-history"><h3>Riwayat perubahan data</h3><p className="outlet-muted">Menampilkan hingga 50 perubahan terbaru dan 20 kasus terbaru; setiap kasus memuat hingga 10 pemeriksaan terakhir.</p>{!outlet.changes?.length&&<p className="outlet-muted">Belum ada perubahan tercatat pada metode baru.</p>}{outlet.changes?.map(c=><article key={c.id}><strong>{c.reason}</strong><small>{c.actor.name} · {stamp(c.createdAt)} · {c.source}</small><dl>{Object.keys(c.after).map(k=><React.Fragment key={k}><dt>{fields[k] || k}</dt><dd>{String(c.before[k] ?? 'Kosong')} → {String(c.after[k] ?? 'Kosong')}</dd></React.Fragment>)}</dl></article>)}

  {outlet.validationDetails?.coordinateHistory?.length>0&&<details><summary>Riwayat koordinat metode lama</summary>{outlet.validationDetails.coordinateHistory.map((h,i)=><article key={i}><strong>{h.reason}</strong><p>{point(h.previous || h)} → {point(h.next || h)}</p><small>{stamp(h.at)} · {h.actorId || 'Pelaku belum tercatat'}</small></article>)}</details>}

  <h3>Kasus validasi outlet</h3>{!outlet.reviews?.length&&<p className="outlet-muted">Tidak ada kasus pemeriksaan. Fitur ini opsional.</p>}{outlet.reviews?.map(r=><article key={r.id}><strong>{r.reason}</strong><small>{reviewLabels[r.status]} · {r.requestedBy.name} · {stamp(r.createdAt)}</small>{(r.decision?.history || (r.decision?[r.decision]:[])).map((d,i)=><div key={i}><p>{decisions[d.action]||d.action}: {d.reason||d.note}</p>{(d.reference||d.evidence)&&<p>{d.reference||d.evidence}</p>}<small>{d.actor.name} · {stamp(d.at)}</small></div>)}{r.runs?.map(run=><details key={run.id}><summary>{resultLabels[run.result.code]} · {stamp(run.createdAt)}</summary><p>Oleh {run.actor.name}. Titik yang diperiksa: {point(run.snapshot)}.</p>{(run.result.reasons||run.result.warnings)?.map((w,i)=><p key={i}>{w}</p>)}</details>)}</article>)}

 </section>;

}

