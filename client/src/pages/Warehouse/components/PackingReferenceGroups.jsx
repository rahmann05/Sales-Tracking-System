import React from 'react';
import { LuBan, LuUser, LuStore, LuCheck, LuArrowRight, LuCalendar } from 'react-icons/lu';
export function PackingReferenceGroups({
  allowPending,
  handleSelectOrder,
  segmentedData,
  selectedOrderId,
  status,
  todayStr
}) {
  return <div className="space-y-6">
          {segmentedData.map(dayGroup => <div key={dayGroup.rawDate} className="rounded-2xl border-2 border-primary/20 bg-surface shadow-xs overflow-hidden">
              {/* Level 1: Header Tanggal / Hari */}
              <div className="bg-primary text-on-primary px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-white/10 text-white">
                    <LuCalendar className="text-base" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm tracking-tight text-white capitalize">
                      {dayGroup.formattedDate}
                    </h3>
                    <span className="text-[11px] text-white/80 font-mono">
                      {dayGroup.rawDate} {dayGroup.rawDate === todayStr ? '• HARI INI' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {dayGroup.salesGroups.length} Sales Bertugas
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {dayGroup.totalDayOrders} Pesanan
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">
                    Total: Rp {dayGroup.totalDayValue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Level 2: Segmentasi Per Sales di Hari Ini */}
              <div className="p-4 space-y-4 bg-surface-container/20">
                {dayGroup.salesGroups.map(salesGroup => <div key={salesGroup.salesId} className="rounded-xl border border-border-glass bg-surface shadow-xs overflow-hidden">
                    {/* Header Sales Person */}
                    <div className="px-4 py-2.5 bg-surface-container/60 border-b border-border-glass flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          <LuUser className="text-sm" />
                        </div>
                        <div>
                          <strong className="text-xs font-black text-on-surface block">
                            Sales: {salesGroup.salesName}
                          </strong>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            Penanggung Jawab Kunjungan & Order
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-surface text-on-surface font-semibold border border-border-glass text-[11px]">
                          {salesGroup.orders.length} Toko Memesan
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-surface text-on-surface font-mono font-bold border border-border-glass text-[11px]">
                          Subtotal: Rp {salesGroup.totalSalesValue.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Level 3: Rincian Order Toko dari Sales Tersebut */}
                    <div className="divide-y divide-border-glass">
                      {salesGroup.orders.map(o => {
              const canUse = status === 'APPROVED' || status === 'PENDING_APPROVAL' && allowPending;
              const isSelected = selectedOrderId === o.id;
              return <div key={o.id} className={`p-3.5 flex flex-wrap items-start justify-between gap-3 hover:bg-surface-container/30 transition-all ${isSelected ? 'bg-primary/5' : ''}`}>
                            {/* Info Toko & Barang */}
                            <div className="space-y-1.5 flex-1 min-w-[260px]">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded bg-surface-container text-primary">
                                  <LuStore className="text-xs" />
                                </span>
                                <strong className="text-xs font-black text-on-surface">
                                  {o.pjpStop?.outlet?.name || 'Toko'}
                                </strong>
                                {o.pjpStop?.outlet?.outletCode && <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface-variant">
                                    {o.pjpStop.outlet.outletCode}
                                  </span>}
                              </div>

                              <p className="text-[11px] text-on-surface-variant pl-6 line-clamp-1">
                                {o.pjpStop?.outlet?.address || 'Alamat toko belum terdata'}
                              </p>

                              {/* Products Preview */}
                              <div className="pl-6 pt-1 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] font-bold text-on-surface-variant">
                                  {o.items?.length || 0} Produk:
                                </span>
                                {(o.items || []).map(item => <span key={item.id} className="px-2 py-0.5 rounded-md bg-surface-container/80 text-[10px] font-mono text-on-surface border border-border-glass/60">
                                    {item.product?.name || item.product?.sku}: <strong>{item.quantity} unit</strong>
                                  </span>)}
                              </div>
                            </div>

                            {/* Nilai Order & Tombol Aksi */}
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <span className="text-xs font-mono font-black text-on-surface block">
                                  Rp {Number(o.totalValue || 0).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-medium">
                                  {o.paymentType || 'CASH'}
                                </span>
                              </div>

                              <div>
                                {canUse ? <button type="button" onClick={() => handleSelectOrder(o)} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${isSelected ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
                                    {isSelected ? <>
                                        <LuCheck className="text-xs" />
                                        <span>Dipilih</span>
                                      </> : <>
                                        <span>Gunakan Referensi</span>
                                        <LuArrowRight className="text-xs" />
                                      </>}
                                  </button> : <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-semibold italic">
                                    <LuBan className="text-xs" /> Tidak dapat digunakan
                                  </span>}
                              </div>
                            </div>
                          </div>;
            })}
                    </div>
                  </div>)}
              </div>
            </div>)}
        </div>;
}
