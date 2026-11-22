import React from 'react';

/**
 * OfficialSignatureSection Component
 * Single Responsibility: Render Section 7-8 location mapping summary and 4-column signature approval table.
 */
export const OfficialSignatureSection = ({ data }) => (
  <>
    <div className="border-b border-black py-1.5">
      <div className="flex items-center justify-between font-bold text-[10px] mb-0.5">
        <span>Mapping Lokasi & Verifikasi Titik Outlet :</span>
        {data.photoId && (
          <span className="font-mono text-[9px] font-bold text-gray-800">
            Ref. ID Foto: {data.photoId}
          </span>
        )}
      </div>
      <div className="border border-black p-2 text-[9.5px] bg-gray-50/50 space-y-1">
        <div className="font-medium text-black">
          Patokan / Mapping Lokasi:{' '}
          <strong>{data.mappingLocation || 'Ruko / Bangunan depan jalan utama.'}</strong>
        </div>
        <div className="text-gray-700 font-mono text-[8.5px] flex items-center justify-between">
          <span>
            Koordinat GPS: {data.latitude || 0}, {data.longitude || 0}
          </span>
          <span>
            Wilayah: {data.area} ({data.subAreaKecamatan || data.kelurahan || '-'})
          </span>
          <span className="italic text-gray-600">
            Dokumentasi Foto Tersimpan di Database Digital
          </span>
        </div>
      </div>
    </div>

    <div className="pt-2">
      <table className="w-full border-collapse border border-black text-center text-[9.5px]">
        <thead>
          <tr className="bg-gray-100 font-bold">
            <th className="border border-black py-1 px-2 w-1/4">Mengetahui Outlet</th>
            <th className="border border-black py-1 px-2 w-1/4">Mengajukan</th>
            <th className="border border-black py-1 px-2 w-1/4">Menyetujui</th>
            <th className="border border-black py-1 px-2 w-1/4">Input Ke System</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {[
              { name: data.outletKnownBy || data.ownerName, title: 'Pemilik / Staf Toko' },
              { name: data.salesmanName, title: 'Salesman' },
              { name: data.spvName, title: 'SPV' },
              { name: data.adminName, title: 'Admin' },
            ].map((s, idx) => (
              <td key={idx} className="border border-black p-2 h-20 align-bottom text-left">
                <div className="border-t border-dotted border-gray-400 pt-1">
                  <div>
                    Nama: <strong>{s.name || '________________'}</strong>
                  </div>
                  <div>Jabatan: {s.title}</div>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  </>
);
