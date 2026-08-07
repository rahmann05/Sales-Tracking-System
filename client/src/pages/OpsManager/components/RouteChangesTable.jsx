import React from 'react';

export const RouteChangesTable = ({ incidentsList }) => {
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED_DIRECT_REROUTE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Reroute Langsung SPV</span>;
      case 'RESOLVED_OFFPJP_APPROVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-secondary border border-secondary/40">Toko Luar RJP (SPV Approved)</span>;
      case 'RESOLVED_REROUTE_APPROVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/10 text-tertiary">Reroute (Manager Approved)</span>;
      case 'RESOLVED_SKIP':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">Skip Toko</span>;
      case 'PENDING_SPV':
      case 'PENDING_SPV_OFFPJP':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/10 text-tertiary">Menunggu SPV</span>;
      case 'RESOLVED_REROUTE_PENDING_OPS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">Menunggu Approval Ops</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant">{status}</span>;
    }
  };

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-bold text-on-surface">Audit Log 1: Perubahan Rute & Toko Tutup</h5>
      {incidentsList.length === 0 ? (
        <p className="text-xs text-on-surface-variant italic p-3 text-center bg-surface-variant/20 rounded-xl">
          Belum ada permohonan perubahan rute untuk tim supervisor ini hari ini.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-glass">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-variant/50 text-on-surface-variant font-semibold">
              <tr>
                <th className="p-3">WAKTU</th>
                <th className="p-3">SALES FIELD</th>
                <th className="p-3">TOKO ASAL / PENGAJUAN</th>
                <th className="p-3">TOKO PENGGANTI</th>
                <th className="p-3">STATUS Tindakan SPV</th>
                <th className="p-3">ALASAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass text-on-surface">
              {incidentsList.map((item) => (
                <tr key={item.id} className="hover:bg-surface-variant/20">
                  <td className="p-3 font-mono text-[11px] text-on-surface-variant">{item.reportedAt || 'Hari Ini'}</td>
                  <td className="p-3 font-bold">{item.salesName || 'Sales Field'}</td>
                  <td className="p-3 font-medium">{item.outletName}</td>
                  <td className="p-3 text-emerald-600 font-semibold">{item.newOutletName || item.address || '-'}</td>
                  <td className="p-3">{renderStatusBadge(item.status)}</td>
                  <td className="p-3 text-on-surface-variant italic">{item.rerouteReason || item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
