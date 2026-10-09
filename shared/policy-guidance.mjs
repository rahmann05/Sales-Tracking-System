import {POLICY_OPTION_LABELS} from './operational-policy.mjs';
const all=['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'];
export function parameterRoles(key){
 if(/^(SALES_|ATTENDANCE_|MINIMUM_VISIT_|OFF_PJP_|VISIT_RESULT_|COLLECTION_)/.test(key))return ['SALES','SUPERVISOR'];
 if(/^(SPV_|FOLLOW_UP_)/.test(key))return ['SUPERVISOR','SALES'];
 if(/^(VEHICLE_SERVICE_|OIL_|BRAKE_)/.test(key))return ['ADMIN','SUPERVISOR','KEPALA_GUDANG'];
 if(/^(WAREHOUSE_|TRIP_|DELIVERY_|DRIVER_|PACKING_)/.test(key))return ['ADMIN','KEPALA_GUDANG','SUPIR'];
 if(/^(PJP_|CLUSTER_|TEAM_)/.test(key))return ['ADMIN','SUPERVISOR','SALES'];
 if(/^(ORDER_|REGISTRATION_|CUSTOMER_REG_|OUTLET_)/.test(key))return ['ADMIN','SUPERVISOR','SALES'];
 return all;
}
export function parameterGuidance(key,values){
 const sales=values.SALES_ATTENDANCE_MODE||'IN_OUT',driver=values.DELIVERY_ATTENDANCE_MODE||'IN_OUT';
 if(sales!=='IN_OUT'&&/^(SALES_OUT_PHOTO|SALES_MISSING_OUT_MINUTES|SALES_ALLOW_CONTINUE_WITHOUT_OUT|MINIMUM_VISIT_DURATION_MINUTES|ATTENDANCE_ENFORCE_MIN_DURATION|ATTENDANCE_ALLOW_EARLY_CHECKOUT)$/.test(key))return 'Tidak berlaku: mode kunjungan ini tidak mewajibkan absen keluar.';
 if(sales==='OPTIONAL'&&/^(SALES_REQUIRE_GPS|SALES_IN_PHOTO|ATTENDANCE_REQUIRE_PHOTO|ATTENDANCE_ENFORCE_GEOFENCE|ATTENDANCE_RADIUS_METERS|ATTENDANCE_USE_OUTLET_RADIUS)$/.test(key))return 'Tidak berlaku: kegiatan Sales tidak mewajibkan presensi. Nilai tetap disimpan untuk mode lain.';
 if(values.SPV_ATTENDANCE_MODE==='OPTIONAL'&&/^SPV_(REQUIRE_PHOTO|REQUIRE_GPS|ENFORCE_GEOFENCE)$/.test(key))return 'Tidak berlaku: kegiatan SPV tidak mewajibkan presensi.';
 if(driver==='OPTIONAL'&&/^DELIVERY_(REQUIRE_GPS|REQUIRE_GEOFENCE)$/.test(key))return 'Tidak berlaku: hasil pengiriman dicatat tanpa presensi wajib.';
 if(driver!=='IN_OUT'&&key==='DELIVERY_ALLOW_RESULT_WITHOUT_OUT')return 'Tidak berlaku: mode bukti tujuan ini tidak mewajibkan presensi keluar.';
 if(values.DELIVERY_STOP_ORDER==='SEQUENTIAL'&&key==='DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT')return 'Tidak berlaku: urutan wajib menunggu hasil seluruh tujuan sebelumnya. Nilai ini dipakai saat urutan bebas.';
 if(!(Number(values.ORDER_APPROVAL_AMOUNT_THRESHOLD)>0)&&key==='ORDER_APPROVAL_AMOUNT_MODE')return 'Tidak berlaku: batas nominal nol menonaktifkan persetujuan khusus nominal.';
 if(String(values.SALES_ALLOW_PRICE_OVERRIDE)==='false'&&/^ORDER_PRICE_OVERRIDE_/.test(key))return 'Tidak berlaku: perubahan harga katalog tidak diizinkan.';
 if((String(values.SALES_ALLOW_PRICE_OVERRIDE)==='false'||!(Number(values.ORDER_APPROVAL_AMOUNT_THRESHOLD)>0)||!values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE||values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE==='INHERIT')&&key==='ORDER_APPROVAL_CONDITION_PRIORITY')return 'Prioritas hanya dipakai jika aturan nominal dan persetujuan perubahan harga sama-sama cocok.';
 if(String(values.NOTIFY_REALTIME_ENABLED)==='false'&&/^NOTIFY_RETRY_/.test(key))return 'Tidak berlaku: siaran langsung dimatikan. Pesan yang diizinkan tetap disimpan di kotak masuk.';
 if(String(values.VEHICLE_SERVICE_ALLOW_BACKDATE)==='false'&&key==='VEHICLE_SERVICE_MAX_BACKDATE_DAYS')return 'Tidak berlaku: pencatatan servis sebelum tanggal hari ini sedang dimatikan.';
 if(String(values.WAREHOUSE_REQUIRE_CHECK)==='false'&&key==='WAREHOUSE_SEPARATE_CHECKER')return 'Tidak berlaku: tahap pemeriksaan muatan tidak diwajibkan.';
 if(String(values.ATTENDANCE_ENFORCE_MIN_DURATION)==='false'&&key==='MINIMUM_VISIT_DURATION_MINUTES')return 'Tidak berlaku: batas minimum durasi sedang dimatikan.';
 if(values.DRIVER_TRACKING_MODE==='OFF'&&/^DRIVER_TRACKING_(LIVE_SECONDS|MAX_POINTS)$/.test(key))return 'Tidak berlaku: Driver tidak membagikan lokasi GPS langsung.';
 if((values.PLACE_LOOKUP_PROVIDER==='OFF'||values.PLACE_LOOKUP_PROVIDER==='OSM')&&key==='PLACE_LOOKUP_ALLOW_FALLBACK')return 'Tidak berlaku: provider ini tidak menggunakan pencarian cadangan.';
 return '';
}
export function policyTiming(key){
 if(/^VEHICLE_SERVICE_(REMINDERS_|WARNING_)|^OIL_|^BRAKE_/.test(key))return 'Pengingat diperbarui mengikuti aturan efektif; interval khusus kendaraan didahulukan. Kilometer dan riwayat servis tidak berubah.';
 if(/^OUTLET_REVIEW_(NAME_|ADDRESS_|ALTERNATIVE_|AMBIGUITY_|SUGGESTION_|SEARCH_RADIUS_|TIMEOUT_|EVIDENCE_)/.test(key))return 'Berlaku pada pemeriksaan peta berikutnya. Ambang dan masa berlaku tersimpan bersama hasil; bukti lama tidak dihitung ulang.';
 if(/^FEATURE_|TRACKING_|^SALES_TRACKING_MODE|^DRIVER_TRACKING_MODE|^NOTIFY_|^REPORT_|^ROUTING_|^PLACE_LOOKUP_|^LIVE_TRACKING_|^SLA_|^OUTLET_MAP_|^OUTLET_REVIEW_/.test(key))return 'Berlaku segera saat versi efektif; pekerjaan terbuka tetap dapat diselesaikan.';
 if(/^CODE_|^DEFAULT_|^TAX_|^CREDIT_/.test(key))return 'Berlaku pada data atau dokumen baru.';
 return 'Berlaku saat proses baru dimulai; pekerjaan berjalan mempertahankan aturan awal.';
}
export function parameterHelp(param){
 if(param.key==='FEATURE_RETURNS_MODE')return 'Menghentikan pengiriman ulang dari barang kembali. Penerimaan dan rekonsiliasi barang trip berjalan tetap tersedia agar hasil pengiriman dapat dituntaskan.';
 if(param.description)return param.description;
 const specific={
 GPS_REQUIRE_METADATA:'Jika aktif, lokasi tanpa nilai akurasi dan waktu dari perangkat ditolak. Bukti lama tidak diisi ulang atau diubah.',
 GPS_MAX_ACCURACY_METERS:'Angka lebih kecil menuntut GPS lebih akurat. Lokasi yang melampaui batas ditolak; nilai yang tidak diketahui tidak dianggap akurat.',
 GPS_MAX_AGE_SECONDS:'Usia dihitung dari waktu pengambilan GPS perangkat sampai diterima server. Lokasi terlalu lama harus diambil ulang.',
 SALES_REQUIRE_GPS:'Saat presensi diwajibkan, Sales harus mengirim lokasi perangkat. Untuk GPS opsional, matikan juga pembatas radius.',
 SHIFT_ATTENDANCE_MODE:'Masuk saja diselesaikan sebagai kegiatan tanpa bukti keluar. Tanpa presensi wajib tidak menjadi syarat kunjungan.',
 SHIFT_LATE_TOLERANCE_MINUTES:'Mengurangi menit keterlambatan dari jam mulai kerja WIB. Tidak mengubah waktu kedatangan yang tercatat.',
 VISIT_RESULT_REQUIRE_NOTE:'Sales harus mengisi catatan hasil saat menyelesaikan kunjungan, termasuk pada mode tanpa absen keluar.',
 FOLLOW_UP_REQUIRE_REVIEW:'Aktif: hasil yang dikirim menunggu SPV/Admin. Nonaktif: tugas selesai sesuai kebijakan, tanpa approval atas nama orang lain.',
 FOLLOW_UP_REQUIRE_EVIDENCE:'Bukti penanganan diperlukan sebelum hasil tugas dapat dikirim. Instruksi tugas dan catatan hasil tetap dipertahankan.',
 FOLLOW_UP_DEFAULT_DAYS:'Tanggal awal tenggat penugasan baru. Penanggung jawab tetap dapat menetapkan tanggal yang sesuai saat menugaskan.',
 ORDER_ALLOW_AFTER_VISIT:'Order dapat dicatat pada konteks kunjungan sah yang sudah selesai. Kepemilikan Sales dan rincian produk tetap diperiksa.',
 ORDER_ALLOW_BATCH_APPROVAL:'Izinkan keputusan beberapa order sekaligus. Tahap, izin, dan penugasan setiap order tetap diperiksa sendiri.',
 ORDER_ALLOW_CANCEL_REMAINDER:'Admin dapat membatalkan jumlah yang belum dipenuhi dengan alasan. Jumlah yang sudah terkirim tetap utuh.',
 COLLECTION_AUTO_FOLLOW_UP:'Janji pembayaran eksternal membuat tugas penagihan sesuai tanggal janji. Tidak menerima uang atau membuat saldo pembayaran.',
 REGISTRATION_ALLOW_REVISION:'Pengajuan ditolak dapat diperbaiki dan diajukan ulang. Alasan penolakan dan isi sebelum perbaikan tetap tersimpan.',
 TRIP_REQUIRE_ODOMETER:'Kilometer awal dan akhir aktual wajib untuk berangkat/kembali. Jika opsional dan kosong, jarak aktual tidak dihitung.',
 TRIP_REQUIRE_DOCUMENT_RETURN:'Petugas harus mengonfirmasi dokumen kembali saat menutup trip. Tidak membuat faktur atau bukti pembayaran baru.',
 TRIP_REQUIRE_RETURN_INSPECTION:'Barang ditolak perlu pemeriksaan disposisi sebelum trip ditutup. Ini rekonsiliasi pengiriman, tanpa saldo stok.',
 TRIP_BLOCK_OPEN_ISSUES:'Trip tidak dapat ditutup selama masih ada masalah terbuka. Jika dimatikan, tugas masalah tetap tersedia untuk dituntaskan.',
 WAREHOUSE_SEPARATE_CHECKER:'Jika penyiapan dan pemeriksaan aktif, petugas pemeriksa harus berbeda dari petugas penyiapan.',
 OUTLET_DUPLICATE_POLICY:'Blokir kandidat ganda, izinkan dengan alasan pemeriksa, atau tampilkan peringatan. Identitas outlet tetap dipertahankan.',
 };
 if(specific[param.key])return specific[param.key];
 if(param.key.endsWith('APPROVAL_MODE'))return 'Pilih tanpa pemeriksaan, Admin, Supervisor, salah satu, atau Supervisor lalu Admin. Aturan melekat pada dokumen baru.';
 if(param.key==='REGISTRATION_ACTIVATOR')return 'Pihak yang mengaktifkan pengajuan menjadi master outlet. Persetujuan berjenjang selalu berakhir di Admin.';
 if(param.key.startsWith('WAREHOUSE_REQUIRE_'))return 'Jika aktif, jumlah barang aktual perlu dikonfirmasi pada tahap ini. Jika dilewati, sistem tidak mencatat pemeriksaan fiktif.';
 if(param.key.startsWith('NOTIFY_'))return 'Mengatur pemberitahuan kejadian bagi penerima dalam profil ini. Mematikan notifikasi tidak menghapus antrean pekerjaan.';
 if(param.type==='number')return `Batas untuk ${param.label.toLowerCase()}. Nilai yang dapat disimpan ${param.min}–${param.max}${param.unit?' '+param.unit:''}.`;
 if(param.type==='boolean')return `Aktifkan untuk menerapkan ${param.label.toLowerCase()} pada proses terkait. Izin dan kepemilikan data tetap diperiksa.`;
 return `Pilih cara kerja ${param.label.toLowerCase()} pada proses terkait.`;
}
export function workflowSummary(values,role){
 const label=key=>POLICY_OPTION_LABELS[values[key]]||values[key];
 const amount=Number(values.ORDER_APPROVAL_AMOUNT_THRESHOLD)>0,price=values.SALES_ALLOW_PRICE_OVERRIDE!==false&&values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE&&values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE!=='INHERIT';
 const orderStep=`Order dasar: ${label('ORDER_APPROVAL_MODE')}${amount?` · mulai Rp ${Number(values.ORDER_APPROVAL_AMOUNT_THRESHOLD).toLocaleString('id-ID')}: ${label('ORDER_APPROVAL_AMOUNT_MODE')}`:''}${price?` · perubahan harga: ${label('ORDER_PRICE_OVERRIDE_APPROVAL_MODE')}`:''}${amount&&price?` · prioritas ${values.ORDER_APPROVAL_CONDITION_PRIORITY==='AMOUNT_FIRST'?'nominal':'perubahan harga'}`:''}`;
 const features=Object.entries(values).filter(([key])=>key.startsWith('FEATURE_')&&key.endsWith('_MODE')).map(([key,mode])=>({key,mode}));
 let steps;
 if(role==='SALES')steps=[`Presensi kunjungan: ${label('SALES_ATTENDANCE_MODE')}`,values.SALES_ATTENDANCE_MODE==='OPTIONAL'?'Mulai kegiatan tanpa bukti IN':`Masuk · GPS ${values.SALES_REQUIRE_GPS?'wajib':'opsional'}`,orderStep,values.SALES_ATTENDANCE_MODE==='IN_OUT'?'Selesaikan hasil dan absen keluar':'Simpan hasil tanpa membuat bukti OUT',values.SALES_ATTENDANCE_MODE!=='IN_OUT'?'Kunjungan berikutnya dapat dimulai; hasil wajib tetap harus dilengkapi':values.SALES_ALLOW_CONTINUE_WITHOUT_OUT?'OUT terlewat → flag pemeriksaan SPV':'Kunjungan aktif harus diselesaikan sebelum lanjut'];
 else if(role==='SUPERVISOR')steps=[`Presensi supervisi: ${label('SPV_ATTENDANCE_MODE')}`,values.SPV_ATTENDANCE_MODE==='OPTIONAL'?'Kegiatan tanpa bukti presensi wajib':`Foto ${values.SPV_REQUIRE_PHOTO?'wajib':'opsional'} · GPS ${values.SPV_REQUIRE_GPS?'wajib':'opsional'}`,`Hasil tugas ${values.FOLLOW_UP_REQUIRE_REVIEW?'menunggu pemeriksaan':'selesai sesuai kebijakan'}`,`Penerbit PJP: ${label('PJP_PUBLISH_ROLE')}`];
 else if(role==='SUPIR'||role==='KEPALA_GUDANG')steps=[...Object.entries({PICK:'Penyiapan',CHECK:'Pemeriksaan muatan',LOAD:'Loading'}).map(([stage,name])=>`${name}: ${values[`WAREHOUSE_REQUIRE_${stage}`]?'wajib':'dilewati'}`),'Berangkat dengan manifest barang',`Bukti tujuan: ${label('DELIVERY_ATTENDANCE_MODE')}`,values.DELIVERY_STOP_ORDER==='SEQUENTIAL'?'Urutan tujuan wajib; tunggu hasil tujuan sebelumnya':values.DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT!==false?'Urutan bebas; hasil terlewat ditandai untuk gudang':'Urutan bebas; tujuan yang sudah dimulai harus dituntaskan',values.DELIVERY_ATTENDANCE_MODE==='IN_OUT'&&values.DELIVERY_ALLOW_RESULT_WITHOUT_OUT===true?'Catat jumlah terkirim / ditolak; jika OUT tidak tersedia, alasan wajib dan tugas pemeriksaan gudang':'Catat jumlah terkirim / ditolak',`Penutupan: kilometer aktual ${values.TRIP_REQUIRE_ODOMETER?'wajib':'opsional'} · dokumen ${values.TRIP_REQUIRE_DOCUMENT_RETURN?'wajib':'opsional'}`];
 else steps=[`Outlet: ${label('REGISTRATION_APPROVAL_MODE')} → aktivasi ${label('REGISTRATION_ACTIVATOR')}`,orderStep,`Packing: ${{MANUAL:'Input manual',ORDER:'Dari order',BOTH:'Manual atau dari order'}[values.PACKING_SOURCE_MODE]}`,`Laporan mingguan ${values.REPORT_WEEKLY_ENABLED?'aktif':'nonaktif'} · bulanan ${values.REPORT_MTD_ENABLED?'aktif':'nonaktif'}`];
 return {steps,features};
}
