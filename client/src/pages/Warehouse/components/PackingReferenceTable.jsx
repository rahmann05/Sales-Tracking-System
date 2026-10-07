import React from 'react';
import { LuBan, LuUser, LuStore, LuCheck, LuArrowRight, LuCalendar } from 'react-icons/lu';
export function PackingReferenceTable({
  allowPending,
  filteredOrders,
  handleSelectOrder,
  selectedOrderId,
  status
}) {
  return <div className="overflow-x-auto rounded-xl border border-border-glass">
          <table className="w-full text-xs text-left divide-y divide-border-glass">
            <thead className="bg-surface-container/60 text-on-surface-variant font-bold">
              <tr>
                <th className="p-3 w-40">Tanggal & Hari</th>
                <th className="p-3 w-44">Sales Person</th>
                <th className="p-3">Toko / Produk Pesanan</th>
                <th className="p-3 w-32 text-right">Nilai Order</th>
                <th className="p-3 w-36 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass bg-surface">
              {filteredOrders.map(o => {
          const canUse = status === 'APPROVED' || status === 'PENDING_APPROVAL' && allowPending;
          const isSelected = selectedOrderId === o.id;
          return <tr key={o.id} className={`hover:bg-surface-container/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="p-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-on-surface">
                        <LuCalendar className="text-xs text-primary" />
                        <span>
                          {new Date(o.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleDateString('id-ID', {
                  weekday: 'long'
                })}
                      </span>
                    </td>

                    <td className="p-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                        <LuUser className="text-xs text-primary" />
                        <span>{o.createdByUser?.name || 'Sales'}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">Tim Penjualan</span>
                    </td>

                    <td className="p-3 align-top space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <LuStore className="text-xs text-primary shrink-0" />
                        <strong className="text-on-surface text-xs font-bold">
                          {o.pjpStop?.outlet?.name || 'Outlet'}
                        </strong>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(o.items || []).slice(0, 3).map(item => <span key={item.id} className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono font-medium text-on-surface">
                            {item.product?.name || item.product?.sku}: {item.quantity} unit
                          </span>)}
                        {(o.items?.length || 0) > 3 && <span className="text-[10px] text-on-surface-variant font-bold self-center">
                            +{o.items.length - 3} lagi
                          </span>}
                      </div>
                    </td>

                    <td className="p-3 align-top text-right">
                      <span className="font-mono font-black text-on-surface block">
                        Rp {Number(o.totalValue || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        {o.paymentType || 'CASH'}
                      </span>
                    </td>

                    <td className="p-3 align-top text-center">
                      {canUse ? <button type="button" onClick={() => handleSelectOrder(o)} className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'border border-border-glass bg-surface hover:bg-surface-container text-primary'}`}>
                          {isSelected ? <>
                              <LuCheck className="text-xs" />
                              <span>Dipilih</span>
                            </> : <>
                              <span>Gunakan</span>
                              <LuArrowRight className="text-xs" />
                            </>}
                        </button> : <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-semibold italic">
                          <LuBan className="text-xs" /> Ditolak
                        </span>}
                    </td>
                  </tr>;
        })}
            </tbody>
          </table>
        </div>;
}
