import { OfficialIdentitySection } from './OfficialIdentitySection';
import { OfficialTaxSection } from './OfficialTaxSection';
import { OfficialChannelSection } from './OfficialChannelSection';
import { OfficialVisitSection } from './OfficialVisitSection';
import React from 'react';
import { LuPrinter, LuX } from "react-icons/lu";

/**
 * OfficialFormPdfView Component
 * Renders an exact 1-to-1 pixel-perfect reproduction of the physical
 * "FORM REGISTRASI OUTLET" (CV SINAR ANUGRAH - UNICHARM) for accurate print & PDF export.
 */
export const OfficialFormPdfView = ({
  data,
  onClose
}) => {
  if (!data) return null;
  const isChecked = condition => condition ? '✓' : '';
  const visitDaysList = (data.visitDays || '').toUpperCase().split(',');
  const handlePrint = () => {
    window.print();
  };
  return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Top Action Bar (hidden on print) */}
      <div className="fixed top-3 right-4 z-60 flex items-center gap-2 no-print bg-surface p-2 rounded-xl shadow-xl border border-border-glass">
        <button type="button" onClick={handlePrint} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all">
          <LuPrinter className="text-sm" /> Cetak / Unduh PDF
        </button>
        <button type="button" onClick={onClose} className="px-3 py-2 bg-surface-container text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all">
          <LuX className="text-sm" /> Tutup
        </button>
      </div>

      {/* Printable Sheet (Standard A4 Paper Box) */}
      <div id="official-form-printable" className="bg-white text-black font-sans p-6 sm:p-8 max-w-[820px] w-full shadow-2xl rounded-sm my-auto text-[11px] leading-tight border border-gray-400 print:border-none print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full" style={{
      fontFamily: "'Arial', sans-serif"
    }}>
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-2">
          <div>
            <div className="text-xs font-black tracking-tight text-gray-900">
              CV SINAR ANUGRAH
            </div>
            <div className="text-[9px] font-bold text-gray-700 tracking-wider">
              FMCG DISTRIBUTOR
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-base font-black uppercase tracking-wider text-black m-0">
              FORM REGISTRASI OUTLET
            </h2>
            {data.registrationCode && <p className="text-[10px] font-mono text-black">NOO: {data.registrationCode}</p>}
            <div className="text-[10px] font-extrabold text-gray-700 tracking-wider">
              {data.division === 'BELFOODS' ? 'DIVISI BELFOODS (BFI)' : `DIVISI ${data.division || 'BELFOODS'}`}
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            {data.division === 'BELFOODS' ? <>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block"></span>
                  <span className="text-sm font-black text-red-700 tracking-tighter">
                    BELFOODS
                  </span>
                </div>
                <div className="text-[8px] text-red-800 font-bold">PT BELFOODS INDONESIA (BFI)</div>
              </> : data.division === 'UNICHARM' ? <>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block"></span>
                  <span className="text-sm font-black text-blue-900 tracking-tighter">
                    unicharm
                  </span>
                </div>
                <div className="text-[8px] text-blue-800 font-bold">ユニ・チャーム</div>
              </> : <>
                <div className="text-xs font-black text-gray-800 tracking-tight">GENERAL FMCG</div>
                <div className="text-[8px] text-gray-600 font-bold">DISTRIBUSI</div>
              </>}
          </div>
        </div>

        {/* Header Metadata */}
        <div className="grid grid-cols-2 gap-4 py-1 border-b border-black text-[10px] font-bold">
          <div className="flex items-center gap-2">
            <span className="w-20">DIVISI</span>
            <span>:</span>
            <span className="uppercase font-black text-xs text-blue-900">
              {data.division || 'BELFOODS'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20">CABANG</span>
            <span>:</span>
            <span className="uppercase font-black">{data.branch || 'PADALARANG'}</span>
          </div>
        </div>

        {/* Section 1: Data Identitas Outlet */}
        <OfficialIdentitySection data={data} isChecked={isChecked} />

        {/* Section 2: Jenis Pajak */}
        <OfficialTaxSection data={data} isChecked={isChecked} />

        {/* Section 3: Area */}
        <div className="border-b border-black py-1.5 space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-28 font-bold">AREA</span>
            <span>:</span>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                CIMAHI{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.area === 'CIMAHI')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                KAB. BANDUNG BARAT{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.area === 'KAB_BANDUNG_BARAT')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                KAB. BANDUNG{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.area === 'KAB_BANDUNG')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                KOTA BANDUNG{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.area === 'KOTA_BANDUNG')}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pl-30">
            <div className="flex items-center gap-2">
              <span className="font-bold">SUB AREA / KEC</span>
              <span>:</span>
              <span className="uppercase">{data.subAreaKecamatan || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">KELURAHAN</span>
              <span>:</span>
              <span className="uppercase">{data.kelurahan || '-'}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Channel & Sub Channel */}
        <OfficialChannelSection data={data} isChecked={isChecked} />

        {/* Section 5: Payment */}
        <div className="border-b border-black py-1.5">
          <div className="grid grid-cols-12 gap-2 text-[9.5px]">
            {/* TOP Column */}
            <div className="col-span-4 border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>TERM OF PAYMENT (TOP)</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.paymentType === 'TOP')}
                </span>
              </div>
              <div className="space-y-0.5">
                {[7, 14, 30].map(d => <div key={d} className="flex items-center justify-between">
                    <span>{d} HARI</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.paymentType === 'TOP' && data.termOfPaymentDays === d)}
                    </span>
                  </div>)}
              </div>
            </div>

            {/* Cash Column */}
            <div className="col-span-4 border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>CASH PAYMENT</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.paymentType === 'CASH')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['TUNAI', 'GIRO', 'CEK'].map(m => <div key={m} className="flex items-center justify-between">
                    <span>{m}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.paymentType === 'CASH' && data.cashMethod === m)}
                    </span>
                  </div>)}
              </div>
            </div>

            {/* Transfer Bank */}
            <div className="col-span-4 border border-black p-1.5 text-[9px]">
              <div className="font-bold border-b border-black pb-0.5 mb-1">
                KHUSUS PEMBAYARAN TRANSFER
              </div>
              <div className="space-y-0.5 pt-0.5 font-semibold">
                <div>NO REKENING : 7774628887</div>
                <div>BANK BCA</div>
                <div>CV SINAR ANUGRAH</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Kunjungan (PJP) */}
        <OfficialVisitSection data={data} isChecked={isChecked} visitDaysList={visitDaysList} />

        {/* Section 7: Mapping Lokasi & Verifikasi Titik Outlet */}
        <div className="border-b border-black py-1.5">
          <div className="flex items-center justify-between font-bold text-[10px] mb-0.5">
            <span>Mapping Lokasi & Verifikasi Titik Outlet :</span>
            {data.photoId && <span className="font-mono text-[9px] font-bold text-gray-800">
                Ref. ID Foto: {data.photoId}
              </span>}
          </div>
          <div className="border border-black p-2 text-[9.5px] bg-gray-50/50 space-y-1">
            <div className="font-medium text-black">
              Patokan / Mapping Lokasi: <strong>{data.mappingLocation || 'Ruko / Bangunan depan jalan utama.'}</strong>
            </div>
            <div className="text-gray-700 font-mono text-[8.5px] flex items-center justify-between">
              <span>Koordinat GPS: {data.latitude || 0}, {data.longitude || 0}</span>
              <span>Wilayah: {data.area} ({data.subAreaKecamatan || data.kelurahan || '-'})</span>
              <span className="italic text-gray-600">Dokumentasi Foto Tersimpan di Database Digital</span>
            </div>
          </div>
        </div>

        {/* Section 8: 4-Column Signature Approval Block */}
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
                {/* 1. Mengetahui Outlet */}
                <td className="border border-black p-2 h-20 align-bottom text-left">
                  <div className="border-t border-dotted border-gray-400 pt-1">
                    <div>
                      Nama: <strong>{data.outletKnownBy || data.ownerName || '________________'}</strong>
                    </div>
                    <div>Jabatan: Pemilik / Staf Toko</div>
                  </div>
                </td>

                {/* 2. Mengajukan (Salesman) */}
                <td className="border border-black p-2 h-20 align-bottom text-left">
                  <div className="border-t border-dotted border-gray-400 pt-1">
                    <div>
                      Nama: <strong>{data.salesmanName || '________________'}</strong>
                    </div>
                    <div>Jabatan: Salesman</div>
                  </div>
                </td>

                {/* 3. Menyetujui (SPV) */}
                <td className="border border-black p-2 h-20 align-bottom text-left">
                  <div className="border-t border-dotted border-gray-400 pt-1 space-y-0.5">
                    <div>
                      Nama: <strong>{data.spvName || '________________'}</strong>
                    </div>
                    <div className="text-[8.5px]">Jabatan : SPV</div>
                  </div>
                </td>

                {/* 4. Input Ke System (Admin) */}
                <td className="border border-black p-2 h-20 align-bottom text-left">
                  <div className="border-t border-dotted border-gray-400 pt-1">
                    <div>
                      Nama: <strong>{data.adminName || '________________'}</strong>
                    </div>
                    <div>Jabatan : Admin</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
