import React from 'react';

export const OffPjpAbsenTable = ({ offPjpAbsensList }) => {
  return (
    <div className="space-y-3 pt-2">
      <h5 className="text-xs font-bold text-on-surface">Audit Log 2: Absen Toko di Luar RJP (Status Validasi SPV)</h5>
      {offPjpAbsensList.length === 0 ? (
        <p className="text-xs text-on-surface-variant italic p-3 text-center bg-surface-variant/20 rounded-xl">
          Belum ada absen toko luar RJP yang dicatat untuk tim ini.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-glass">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-variant/50 text-on-surface-variant font-semibold">
              <tr>
                <th className="p-3">WAKTU ABSEN</th>
                <th className="p-3">SALES FIELD</th>
                <th className="p-3">NAMA TOKO LUAR RJP</th>
                <th className="p-3">ALAMAT LOKASI</th>
                <th className="p-3">STATUS VALIDASI SPV</th>
                <th className="p-3">CATATAN SALES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass text-on-surface">
              {offPjpAbsensList.map((absen) => (
                <tr key={absen.id} className="hover:bg-surface-variant/20">
                  <td className="p-3 font-mono text-[11px] text-on-surface-variant">{absen.timestamp}</td>
                  <td className="p-3 font-bold">{absen.salesName}</td>
                  <td className="p-3 font-semibold text-on-surface">{absen.outletName}</td>
                  <td className="p-3 text-on-surface-variant">{absen.address}</td>
                  <td className="p-3">
                    {absen.validationStatus === 'TERVALIDASI' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">TERVALIDASI</span>
                    )}
                    {absen.validationStatus === 'TIDAK_TERVALIDASI' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">TIDAK TERVALIDASI</span>
                    )}
                    {absen.validationStatus === 'DITOLAK' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/10 text-error">DITOLAK</span>
                    )}
                  </td>
                  <td className="p-3 text-on-surface-variant italic">{absen.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
