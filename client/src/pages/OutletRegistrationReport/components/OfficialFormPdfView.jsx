import React from 'react';
import { LuPrinter, LuX, LuDownload } from 'react-icons/lu';

/**
 * OfficialFormPdfView Component
 * Renders an exact 1-to-1 pixel-perfect reproduction of the physical
 * "FORM REGISTRASI OUTLET" (CV SINAR ANUGRAH - UNICHARM) for accurate print & PDF export.
 */
export const OfficialFormPdfView = ({ data, onClose }) => {
  if (!data) return null;

  const isChecked = (condition) => (condition ? '✓' : '');

  const visitDaysList = (data.visitDays || '').toUpperCase().split(',');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Top Action Bar (hidden on print) */}
      <div className="fixed top-3 right-4 z-60 flex items-center gap-2 no-print bg-surface p-2 rounded-xl shadow-xl border border-border-glass">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all"
        >
          <LuPrinter className="text-sm" /> Cetak / Unduh PDF
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 bg-surface-container text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all"
        >
          <LuX className="text-sm" /> Tutup
        </button>
      </div>

      {/* Printable Sheet (Standard A4 Paper Box) */}
      <div
        id="official-form-printable"
        className="bg-white text-black font-sans p-6 sm:p-8 max-w-[820px] w-full shadow-2xl rounded-sm my-auto text-[11px] leading-tight border border-gray-400 print:border-none print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full"
        style={{ fontFamily: "'Arial', sans-serif" }}
      >
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
            <div className="text-[10px] font-extrabold text-gray-700 tracking-wider">
              {data.division === 'BELFOODS'
                ? 'DIVISI BELFOODS (BFI)'
                : `DIVISI ${data.division || 'BELFOODS'}`}
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            {data.division === 'BELFOODS' ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block"></span>
                  <span className="text-sm font-black text-red-700 tracking-tighter">
                    BELFOODS
                  </span>
                </div>
                <div className="text-[8px] text-red-800 font-bold">PT BELFOODS INDONESIA (BFI)</div>
              </>
            ) : data.division === 'UNICHARM' ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block"></span>
                  <span className="text-sm font-black text-blue-900 tracking-tighter">
                    unicharm
                  </span>
                </div>
                <div className="text-[8px] text-blue-800 font-bold">ユニ・チャーム</div>
              </>
            ) : (
              <>
                <div className="text-xs font-black text-gray-800 tracking-tight">GENERAL FMCG</div>
                <div className="text-[8px] text-gray-600 font-bold">DISTRIBUSI</div>
              </>
            )}
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
        <div className="border-b border-black py-1.5 space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="w-28 font-bold">NAMA OUTLET</span>
              <span>:</span>
              <span className="font-black text-xs uppercase">{data.name}</span>
            </div>
            <div className="flex items-center gap-2 border border-black px-3 py-1 bg-gray-50">
              <span className="font-bold text-[10px]">KODE OUTLET :</span>
              <span className="font-mono font-black text-xs text-blue-900">
                {data.customerCode || '________________'}
              </span>
              <span className="text-[8px] italic text-gray-600">(*diisi Admin)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-28 font-bold">ALAMAT OUTLET</span>
            <span>:</span>
            <span className="uppercase flex-1">{data.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-28 font-bold">NO TELP</span>
            <span>:</span>
            <span className="font-mono">{data.phone || '-'}</span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="w-28 font-bold">LOKASI</span>
            <span>:</span>
            <div className="flex items-center gap-4 flex-wrap text-[10px]">
              <span className="flex items-center gap-1">
                DALAM PASAR{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'DALAM_PASAR')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                PINGGIR JALAN{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'PINGGIR_JALAN')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                DALAM GANG{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'DALAM_GANG')}
                </span>
              </span>
              <span className="flex items-center gap-1">
                KOMPLEK / PERUMAHAN{' '}
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.locationType === 'KOMPLEK_PERUMAHAN')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Jenis Pajak */}
        <div className="border-b border-black py-1.5">
          <div className="flex items-start gap-2">
            <span className="w-28 font-bold pt-1">JENIS PAJAK</span>
            <span>:</span>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {/* Box PKP */}
              <div className="border border-black p-1.5 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[10px]">
                  <span>PKP</span>
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                    {isChecked(data.taxType === 'PKP')}
                  </span>
                </div>
                <div className="text-[9px] space-y-0.5 pt-0.5">
                  <div className="flex gap-1">
                    <span className="w-20">NO. NPWP</span>
                    <span>:</span>
                    <span className="font-mono">
                      {data.taxType === 'PKP' ? data.taxNumber || '-' : '-'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-20">NAMA NPWP</span>
                    <span>:</span>
                    <span>{data.taxType === 'PKP' ? data.taxName || '-' : '-'}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-20">ALAMAT NPWP</span>
                    <span>:</span>
                    <span>{data.taxType === 'PKP' ? data.taxAddress || '-' : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Box NON PKP */}
              <div className="border border-black p-1.5 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[10px]">
                  <span>NON PKP</span>
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                    {isChecked(data.taxType === 'NON_PKP')}
                  </span>
                </div>
                <div className="text-[9px] space-y-0.5 pt-0.5">
                  <div className="flex gap-1">
                    <span className="w-16">NIK</span>
                    <span>:</span>
                    <span className="font-mono">
                      {data.taxType === 'NON_PKP' ? data.taxNumber || '-' : '-'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-16">NAMA</span>
                    <span>:</span>
                    <span>{data.taxType === 'NON_PKP' ? data.taxName || '-' : '-'}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-16">ALAMAT</span>
                    <span>:</span>
                    <span>{data.taxType === 'NON_PKP' ? data.taxAddress || '-' : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[8px] italic text-gray-600 pl-30 pt-0.5">
            * Lampirkan Copy NPWP / SPPKP / KTP
          </div>
        </div>

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
        <div className="border-b border-black py-1.5">
          <div className="grid grid-cols-12 gap-2 text-[9.5px]">
            {/* MT Column */}
            <div className="col-span-5 border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>MODERN TRADE (MT)</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.channel === 'MODERN_TRADE')}
                </span>
              </div>
              <div className="space-y-0.5">
                {[
                  { id: 'HYPERMARKET', label: 'HYPERMARKET' },
                  { id: 'DRUGSTORE', label: 'DRUGSTORE' },
                  { id: 'NAT_SUPERMARKET', label: 'NAT SUPERMARKET' },
                  { id: 'LOKAL_SUPERMARKET', label: 'LOKAL SUPERMARKET' },
                  { id: 'CHAIN_MINIMARKET', label: 'CHAIN MINIMARKET' },
                  { id: 'LOKAL_MINIMARKET', label: 'LOKAL MINIMARKET' },
                  { id: 'PERKULAKAN', label: 'PERKULAKAN' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.subChannel === item.id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GT Column */}
            <div className="col-span-5 border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>GENERAL TRADE (GT)</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.channel === 'GENERAL_TRADE')}
                </span>
              </div>
              <div className="space-y-0.5">
                {[
                  { id: 'KOPERASI', label: 'KOPERASI' },
                  { id: 'BIDAN', label: 'BIDAN' },
                  { id: 'OUTLET_MOTORIS', label: 'OUTLET MOTORIS' },
                  { id: 'APOTIK', label: 'APOTIK' },
                  { id: 'GROSIR', label: 'GROSIR' },
                  { id: 'TOKO_RETAIL', label: 'TOKO / RETAIL' },
                  { id: 'BABY_SHOP', label: 'BABY SHOP / TOKO SUSU' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.subChannel === item.id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Column */}
            <div className="col-span-2 border border-black p-1.5">
              <div className="font-bold border-b border-black pb-0.5 mb-1 text-center">
                CHANEL
              </div>
              <div className="space-y-1 pt-1">
                {['BRONZE_A', 'BRONZE_B', 'BRONZE_C'].map((tier) => (
                  <div key={tier} className="flex items-center justify-between text-[9px]">
                    <span>{tier.replace('_', ' ')}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.channelTier === tier)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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
                {[7, 14, 30].map((d) => (
                  <div key={d} className="flex items-center justify-between">
                    <span>{d} HARI</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.paymentType === 'TOP' && data.termOfPaymentDays === d)}
                    </span>
                  </div>
                ))}
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
                {['TUNAI', 'GIRO', 'CEK'].map((m) => (
                  <div key={m} className="flex items-center justify-between">
                    <span>{m}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(data.paymentType === 'CASH' && data.cashMethod === m)}
                    </span>
                  </div>
                ))}
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
        <div className="border-b border-black py-1.5">
          <div className="grid grid-cols-3 gap-2 text-[9.5px]">
            {/* Week Ganjil */}
            <div className="border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>WEEK GANJIL</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.visitWeekSchedule === 'WEEK_GANJIL')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <span>{day}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(
                        data.visitWeekSchedule === 'WEEK_GANJIL' && visitDaysList.includes(day)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Week Genap */}
            <div className="border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>WEEK GENAP</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.visitWeekSchedule === 'WEEK_GENAP')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <span>{day}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(
                        data.visitWeekSchedule === 'WEEK_GENAP' && visitDaysList.includes(day)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Week */}
            <div className="border border-black p-1.5">
              <div className="flex items-center justify-between font-bold border-b border-black pb-0.5 mb-1">
                <span>ALL WEEK</span>
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[10px]">
                  {isChecked(data.visitWeekSchedule === 'ALL_WEEK')}
                </span>
              </div>
              <div className="space-y-0.5">
                {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <span>{day}</span>
                    <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold text-[9px]">
                      {isChecked(
                        data.visitWeekSchedule === 'ALL_WEEK' && visitDaysList.includes(day)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[8px] italic text-gray-600 pt-0.5">
            * Beri Tanda V Pada Kolom Pilihan
          </div>
        </div>

        {/* Section 7: Mapping Lokasi & Verifikasi Titik Outlet */}
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

                {/* 3. Menyetujui (SPV & Ops Manager) */}
                <td className="border border-black p-2 h-20 align-bottom text-left">
                  <div className="border-t border-dotted border-gray-400 pt-1 space-y-0.5">
                    <div>
                      Nama: <strong>{data.spvName || '________________'}</strong>
                    </div>
                    <div className="text-[8.5px]">Jabatan : SPV</div>
                    <div>
                      Nama: <strong>{data.opsManagerName || '________________'}</strong>
                    </div>
                    <div className="text-[8.5px]">Jabatan : Ops. Manager</div>
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
    </div>
  );
};
