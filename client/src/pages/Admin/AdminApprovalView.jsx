import { ManualSalesReview } from '../../shared/components/common/ManualSalesReview';
import React from 'react';
import { PendingOrderCard } from './components/PendingOrderCard';
import { UnlockRequestCard } from './components/UnlockRequestCard';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { LuArrowLeft, LuFileCheck, LuClock, LuRotateCw, LuUser, LuChevronDown } from "react-icons/lu";
/**
 * AdminApprovalPage Component (Container Page for Admin Order & Unlock Approvals)
 * Single Responsibility: Admin workspace for order approval and unlock requests.
 */
export function AdminApprovalView({
  approvedOrders,
  approvedOrdersBySales,
  embedded,
  filteredOrders,
  handleApproveUnlock,
  handleBackToHub,
  handleDecision,
  handleRejectUnlock,
  loadApprovalData,
  loading,
  manualPendingCount,
  orderFilter,
  orders,
  ordersBySales,
  pendingOrders,
  pendingOrdersBySales,
  pendingUnlockCount,
  salesOptions,
  selectedSales,
  setOrderFilter,
  setSelectedSales,
  unlockRequests
}) {
  return <div className={`${embedded ? 'space-y-4' : 'workspace-page space-y-6'}`}>
      {/* ── Standard PageHeader (Unified with Design System) ── */}
      {!embedded && <PageHeader badge={<span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuFileCheck className="text-sm" /> MODUL PERSETUJUAN & VALIDASI ORDER
          </span>} title="Persetujuan Order Penjualan & Buka Kunci Presensi" subtitle="Verifikasi PO penjualan sales, periksa kredit limit & stok toko, serta persetujuan pembukaan kunci (unlock) presensi outlet." stats={[{
      label: 'Order Pending',
      value: `${pendingOrders.length} Order`,
      color: pendingOrders.length > 0 ? 'rose' : 'emerald'
    }, {
      label: 'Unlock Pending',
      value: `${pendingUnlockCount} Menunggu`,
      color: pendingUnlockCount > 0 ? 'amber' : 'emerald'
    }, {
      label: 'Hasil Manual',
      value: `${manualPendingCount} Menunggu`,
      color: manualPendingCount > 0 ? 'amber' : 'emerald'
    }, {
      label: 'Order Disetujui',
      value: `${approvedOrders.length} Selesai`,
      color: 'neutral'
    }, {
      label: 'Total Order',
      value: `${orders.length} Masuk`,
      color: 'neutral'
    }]} actions={<div className="flex items-center gap-2">
            <button type="button" onClick={loadApprovalData} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-glass bg-surface hover:bg-surface-container font-bold text-xs shadow-2xs transition-all cursor-pointer text-on-surface" title="Segarkan data persetujuan">
              <LuRotateCw className={`text-sm ${loading ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
            <button type="button" onClick={handleBackToHub} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-neutral-800 font-bold text-xs shadow-xs transition-all cursor-pointer group shrink-0">
              <LuArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Menu Utama</span>
            </button>
          </div>} />}

      {!embedded && <ManualSalesReview />}

      {/* ── Section 1: Permintaan Unlock Outlet dari Sales ── */}
      {!embedded && unlockRequests.length > 0 && <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border-glass pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center text-sm">
                <LuClock />
              </div>
              <div>
                <h3 className="text-sm font-black text-on-surface uppercase tracking-tight m-0">
                  Permintaan Buka Kunci (Unlock) Presensi Outlet
                </h3>
                <p className="text-[11px] text-on-surface-variant m-0">
                  Permohonan pembukaan kunci dari Sales yang belum menyelesaikan absen toko sebelumnya
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20">
              {pendingUnlockCount} Menunggu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unlockRequests.map(req => <UnlockRequestCard key={req.id} request={req} onApprove={handleApproveUnlock} onReject={handleRejectUnlock} />)}
          </div>
        </div>}

      {/* ── Section 2: Daftar Order Penjualan ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-glass pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container text-primary border border-border-glass flex items-center justify-center text-sm">
              <LuFileCheck />
            </div>
            <div>
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tight m-0">
                Daftar Order Penjualan Sales
              </h3>
              <p className="text-[11px] text-on-surface-variant m-0">
                Konfirmasi stok penjualan, cek plafon kredit, dan proses pesanan ke pengiriman
              </p>
            </div>
          </div>

          {/* Controls: Filter per Sales & Filter Status Pills */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {salesOptions.length > 0 && <div className="relative">
                <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl border border-border-glass shadow-2xs hover:border-primary/40 transition-colors">
                  <LuUser className="text-xs text-primary shrink-0" />
                  <select value={selectedSales} onChange={e => setSelectedSales(e.target.value)} className="text-xs font-bold bg-transparent text-on-surface border-none focus:outline-none cursor-pointer pr-4 appearance-none max-w-[190px] truncate" title="Filter order per sales">
                    <option value="ALL">Semua Sales ({salesOptions.length})</option>
                    {salesOptions.map(name => <option key={name} value={name}>
                        {name}
                      </option>)}
                  </select>
                  <LuChevronDown className="text-xs text-on-surface-variant pointer-events-none absolute right-2.5" />
                </div>
              </div>}

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-border-glass">
              <button type="button" onClick={() => setOrderFilter('ALL')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${orderFilter === 'ALL' ? 'bg-surface text-on-surface shadow-2xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
                Semua ({ordersBySales.length})
              </button>
              <button type="button" onClick={() => setOrderFilter('PENDING')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${orderFilter === 'PENDING' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
                Pending ({pendingOrdersBySales.length})
              </button>
              <button type="button" onClick={() => setOrderFilter('APPROVED')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${orderFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
                Disetujui ({approvedOrdersBySales.length})
              </button>
            </div>
          </div>
        </div>

        {loading && orders.length === 0 ? <div className="p-10 text-center bg-surface rounded-2xl border border-border-glass">
            <LuRotateCw className="text-2xl text-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-on-surface-variant m-0">Memuat data order penjualan...</p>
          </div> : filteredOrders.length === 0 ? <div className="p-10 text-center bg-surface rounded-2xl border border-border-glass">
            <p className="text-xs text-on-surface-variant m-0">
              {selectedSales !== 'ALL' ? `Tidak ada order ${orderFilter === 'PENDING' ? 'pending' : ''} untuk sales "${selectedSales}".` : orderFilter === 'PENDING' ? 'Tidak ada order pending saat ini. Semua pesanan telah diproses.' : 'Belum ada data order penjualan.'}
            </p>
            {selectedSales !== 'ALL' && <button type="button" onClick={() => setSelectedSales('ALL')} className="mt-2 text-xs text-primary font-bold hover:underline cursor-pointer bg-transparent border-none">
                Reset filter sales
              </button>}
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => <PendingOrderCard key={order.id} order={order} onDecision={handleDecision} />)}
          </div>}
      </div>
    </div>;
}
