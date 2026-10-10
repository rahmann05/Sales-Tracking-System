import React from 'react';
import {InvoiceReconciliationPanel} from './InvoiceReconciliationPanel';
import { LuSend, LuRotateCcw, LuTrash2, LuPencil, LuPrinter, LuTriangleAlert, LuCircleCheck, LuStore, LuFileText, LuTruck, LuClock, LuChevronDown, LuChevronUp } from 'react-icons/lu';
export function PackingListCard({
  admin,
  onChanged,
  busyAction,
  handleDeleteDraft,
  handleTransitionAction,
  isAllocated,
  isDeleteBusy,
  isDraft,
  isExpanded,
  isRecallBusy,
  isReleaseBusy,
  isReleased,
  needsCompletion,
  pl,
  setForm,
  setPrintDoc,
  settings,
  toggleExpand
}) {
  return <article key={pl.id} className={`bg-surface border rounded-2xl p-4 md:p-5 space-y-4 transition-all shadow-xs ${needsCompletion ? 'border-amber-300/80 bg-amber-50/20 dark:bg-amber-950/10' : 'border-border-glass hover:border-primary/20'}`}>
                {/* 1. Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono font-black text-base text-on-surface">
                        {pl.code} {pl.documentKind==='MANIFEST'&&<span className="text-xs">· Manifest pengiriman</span>}
                      </h2>
                      <span className="text-on-surface-variant text-sm font-semibold">·</span>
                      <strong className="text-sm font-bold text-on-surface flex items-center gap-1">
                        <LuStore className="text-xs text-primary" />
                        <span>{pl.outlet?.name || 'Toko Belum Ditugaskan'}</span>
                      </strong>

                      {/* Status Badges */}
                      {isDraft && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                          Draft Admin
                        </span>}

                      {isReleased && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <LuCircleCheck className="text-[10px]" /> Dikirim ke Gudang
                        </span>}

                      {needsCompletion && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                          <LuTriangleAlert className="text-[10px]" /> Perlu Dilengkapi
                        </span>}

                      {isAllocated && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                          <LuTruck className="text-[10px]" /> Masuk Rute
                        </span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      <span>Sumber: <strong className="text-on-surface">{pl.source}</strong></span>
                      <span>•</span>
                      <span>Revisi: <strong className="text-on-surface">{pl.revision || 1}</strong></span>
                      {pl.createdAt && <>
                          <span>•</span>
                          <span>Dibuat: {new Date(pl.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
                        </>}
                    </div>
                  </div>

                  {/* Cartons Summary Metric */}
                  <div className="text-right p-2.5 rounded-xl bg-surface-container/50 border border-border-glass text-xs space-y-0.5">
                    <div>
                      Total Muatan: <strong className="text-on-surface font-black text-sm">{pl.totalCartons || 0}</strong> Karton
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex items-center justify-end gap-2">
                      <span>Dialokasikan: <strong>{pl.allocatedCartons || 0}</strong></span>
                      <span>·</span>
                      <span>Sisa: <strong className="text-emerald-600 dark:text-emerald-400">{pl.remainingCartons ?? (pl.totalCartons || 0)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Expandable Details Trigger */}
                <div>
                  <button type="button" onClick={() => toggleExpand(pl.id)} className="w-full py-2 px-3 rounded-xl bg-surface-container/30 hover:bg-surface-container/60 border border-border-glass text-xs font-bold text-on-surface flex items-center justify-between transition-all cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <LuFileText className="text-xs text-primary" />
                      <span>Rincian Barang ({pl.items?.length || 0}), Faktur ({pl.invoices?.length || 0}), & Catatan</span>
                    </span>
                    {isExpanded ? <LuChevronUp className="text-sm" /> : <LuChevronDown className="text-sm" />}
                  </button>

                  {/* Expanded Accordion Content */}
                  {isExpanded && <div className="mt-3 p-4 rounded-xl bg-surface-container/20 border border-border-glass space-y-4 animate-fade-in text-xs">
                      <InvoiceReconciliationPanel packing={pl} admin={admin} onChanged={onChanged}/>
                      {/* Items Table */}
                      <div className="space-y-1.5">
                        <span className="font-black uppercase tracking-wider text-[10px] text-on-surface-variant block">
                          Daftar Barang Produk:
                        </span>
                        <div className="border border-border-glass rounded-xl overflow-hidden">
                          <table className="w-full text-left divide-y divide-border-glass">
                            <thead className="bg-surface-container/60 text-[11px] font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2">SKU</th>
                                <th className="p-2">Nama Barang</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2">Satuan</th>
                                <th className="p-2 text-right">Sisa Muatan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-glass bg-surface">
                              {(pl.remainingItems || pl.items || []).map((item, idx) => <tr key={item.lineId || idx} className="hover:bg-surface-container/30">
                                  <td className="p-2 font-mono font-bold text-on-surface-variant">{item.sku || '-'}</td>
                                  <td className="p-2 font-bold text-on-surface">{item.name}</td>
                                  <td className="p-2 text-right font-mono font-bold text-on-surface">{item.quantity}</td>
                                  <td className="p-2 text-on-surface-variant">{item.unit || 'unit'}</td>
                                  <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {item.remaining ?? item.quantity}
                                  </td>
                                </tr>)}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Invoices List */}
                      {pl.invoices && pl.invoices.length > 0 && <div className="space-y-1.5">
                          <span className="font-black uppercase tracking-wider text-[10px] text-on-surface-variant block">
                            Faktur Terlampir:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {pl.invoices.map(inv => <div key={inv.id} className="px-3 py-1.5 rounded-lg border border-border-glass bg-surface font-mono text-[11px]">
                                Faktur: <strong className="text-on-surface">{inv.invoiceNumber}</strong> · {inv.totalCartons} Karton
                                {inv.totalAmount ? ` · Rp ${Number(inv.totalAmount).toLocaleString('id-ID')}` : ''}
                              </div>)}
                          </div>
                        </div>}

                      {/* Notes & Override Reason */}
                      {(pl.notes || pl.overrideReason) && <div className="p-3 rounded-lg bg-surface border border-border-glass space-y-1">
                          {pl.notes && <p className="text-on-surface-variant">
                              <strong className="text-on-surface">Catatan:</strong> {pl.notes}
                            </p>}
                          {pl.overrideReason && <p className="text-amber-800 dark:text-amber-300">
                              <strong className="text-on-surface">Alasan Override:</strong> {pl.overrideReason}
                            </p>}
                        </div>}

                      {/* Audit History Log */}
                      {pl.history && pl.history.length > 0 && <div className="space-y-1">
                          <span className="font-black uppercase tracking-wider text-[10px] text-on-surface-variant block flex items-center gap-1">
                            <LuClock className="text-xs" />
                            <span>Riwayat Perubahan Dokumen:</span>
                          </span>
                          <div className="space-y-1 pl-2 border-l-2 border-border-glass">
                            {pl.history.map((h, i) => <div key={i} className="text-[11px] text-on-surface-variant">
                                <strong>{h.action}</strong> oleh {h.userId || 'User'} pada{' '}
                                {h.at ? new Date(h.at).toLocaleString('id-ID') : '-'}
                              </div>)}
                          </div>
                        </div>}
                    </div>}
                </div>

                {/* 3. Action Buttons Row (Interactive with clear feedback) */}
                <div className="pt-2 border-t border-border-glass flex flex-wrap items-center justify-between gap-2">
                  {/* Left: View / Print Document */}
                  <button type="button" onClick={() => setPrintDoc(pl)} className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                    <LuPrinter className="text-xs text-primary" />
                    <span>Cetak / Lihat Dokumen</span>
                  </button>

                  {/* Right: Administrative actions */}
                  {admin && <div className="flex flex-wrap items-center gap-2">
                      {/* DRAFT Actions */}
                      {isDraft && <>
                          <button type="button" disabled={Boolean(busyAction)} onClick={() => {
            setForm({
              document: pl
            });
            setTimeout(() => window.scrollTo({
              top: 120,
              behavior: 'smooth'
            }), 50);
          }} className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50">
                            <LuPencil className="text-xs text-primary" />
                            <span>Edit Draft</span>
                          </button>

                          <button type="button" disabled={Boolean(busyAction)} onClick={() => handleDeleteDraft(pl)} className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50" title="Hapus draft packing list ini">
                            <LuTrash2 className={`text-xs ${isDeleteBusy ? 'animate-spin' : ''}`} />
                            <span>{isDeleteBusy ? 'Menghapus…' : 'Hapus'}</span>
                          </button>

                          <button type="button" disabled={Boolean(busyAction)} onClick={() => handleTransitionAction(pl, 'RELEASE')} className="px-4 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50">
                            <LuSend className={`text-xs ${isReleaseBusy ? 'animate-spin' : ''}`} />
                            <span>{isReleaseBusy ? 'Mengirim…' : 'Kirim ke Gudang'}</span>
                          </button>
                        </>}

                      {/* RELEASED Actions */}
                      {isReleased && !isAllocated && settings?.PACKING_ALLOW_REVISION && <button type="button" disabled={Boolean(busyAction)} onClick={() => handleTransitionAction(pl, 'RECALL')} className="px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-50 text-xs font-bold text-amber-800 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50">
                          <LuRotateCcw className={`text-xs ${isRecallBusy ? 'animate-spin' : ''}`} />
                          <span>{isRecallBusy ? 'Menarik…' : 'Tarik untuk Revisi'}</span>
                        </button>}

                      {isReleased && isAllocated && <span className="text-[11px] text-on-surface-variant font-medium italic">
                          Sudah dialokasikan ke rute pengiriman
                        </span>}
                    </div>}
                </div>
              </article>;
}
