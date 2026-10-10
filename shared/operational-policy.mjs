import {DEFAULT_AUDIT_ITEMS} from './supervision-checklist.mjs';
import {DEFAULT_EARLY_REASONS} from './visit-reasons.mjs';
import {DEFAULT_SERVICE_CATALOG} from './reference-catalog.mjs';
import {CAMERA_INPUT_LABELS} from './camera-input-policy.mjs';
import {REGISTRATION_FIELDS} from './registration-fields.mjs';
import {ROUTE_DECISION_MODES} from './route-change-workflow.mjs';
import {REPORT_PRESENTATION} from './report-presentation.mjs';
import {OUTLET_COMPARISON_DEFAULTS as comparison} from './outlet-evidence-policy.mjs';
export const POLICY_ROLES=['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'];
export const DRIVER_EVIDENCE_KEYS=['EVIDENCE_IMAGE_MAX_KB','EVIDENCE_IMAGE_FORMATS','EVIDENCE_ALLOW_REMOTE_IMAGES','CAMERA_INPUT_MODE','DELIVERY_ATTENDANCE_MODE','DELIVERY_STOP_ORDER','DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT','DELIVERY_ALLOW_RESULT_WITHOUT_OUT','DELIVERY_REQUIRE_GPS','DELIVERY_REQUIRE_PHOTO','DELIVERY_RECIPIENT_MODE','DELIVERY_SIGNATURE_MODE','DELIVERY_REQUIRE_GEOFENCE','GPS_REQUIRE_METADATA','GPS_MAX_ACCURACY_METERS','GPS_MAX_AGE_SECONDS'];
const bool=(key,label,defaultValue=true,description='',extra={})=>({key,label,type:'boolean',defaultValue,description,...extra});
const num=(key,label,defaultValue,min,max,unit,description='')=>({key,label,type:'number',defaultValue,min,max,unit,description});
const select=(key,label,defaultValue,options,description='',extra={})=>({key,label,type:'select',defaultValue,options,description,...extra});
const group=(groupKey,groupLabel,groupDescription,params)=>({groupKey,groupLabel,groupDescription,groupIcon:'LuSlidersHorizontal',groupColor:'blue',params});
export const BUSINESS_FEATURES=[
 ['SALES_VISITS','Kunjungan Sales','Lapangan'],['OFF_PJP','Kunjungan luar PJP','Lapangan'],['SPV_VISITS','Supervisi lapangan','Lapangan'],
 ['SHIFT','Presensi shift','Lapangan'],['FOLLOW_UP','Tindak lanjut','Pemantauan'],['REROUTE','Skip dan reroute','Lapangan'],['UNLOCK','Pengecualian presensi','Lapangan'],
 ['PJP','Perencanaan PJP','Wilayah'],['CLUSTERS','Pengelolaan wilayah','Wilayah'],['TEAMS','Penugasan tim','Wilayah'],
 ['REGISTRATION','Registrasi outlet','Outlet'],['OUTLET_MASTER','Master outlet','Outlet'],['OUTLET_REVIEW','Pemeriksaan outlet opsional','Outlet'],
 ['ORDERS','Order','Transaksi'],['PRODUCTS','Katalog produk','Transaksi'],['COLLECTION','Catatan penagihan eksternal','Transaksi'],
 ['PACKING','Packing dan manifest','Pengiriman'],['DELIVERY','Trip pengiriman','Pengiriman'],['RETURNS','Pengiriman ulang barang kembali','Pengiriman'],['VEHICLES','Kendaraan dan servis','Pengiriman'],
 ['REPORTS','Laporan operasional','Pemantauan'],['EXPORT','Ekspor dan cetak','Pemantauan'],['NOTIFICATIONS','Notifikasi','Pemantauan'],['MAPS','Peta operasional','Integrasi'],
].map(([id,label,domain])=>({id,label,domain,key:`FEATURE_${id}_MODE`}));
export const OPERATIONAL_CONFIG_GROUPS=[
 group('CLOSED_OUTLET_POLICY','Laporan toko tutup','Tahapan keputusan dibekukan ketika Sales melapor; perubahan pengaturan tidak memindahkan pengajuan berjalan.',[
  select('CLOSED_OUTLET_DECISION_MODE','Pemeriksa laporan toko tutup','INHERIT',Object.keys(ROUTE_DECISION_MODES),'Dua tahap berlaku pada skip maupun penggantian toko. Mode kompatibilitas mempertahankan aturan lama: skip satu tahap, reroute mengikuti sakelar persetujuan Admin.',{optionLabels:ROUTE_DECISION_MODES}),
  bool('CLOSED_OUTLET_REQUIRE_PHOTO','Wajib foto toko tutup',false),
  bool('CLOSED_OUTLET_REQUIRE_REASON','Wajib alasan toko tutup',false),
 ]),
 group('ASSIGNMENT_POLICY','Penugasan bertanggal','Penjadwalan memakai kewenangan proses yang sudah dimiliki; tidak memberikan izin role tambahan.',[
  bool('ASSIGNMENT_SCHEDULE_ENABLED','Izinkan jadwal penugasan baru',true,'Nonaktif menghentikan pembuatan jadwal baru; jadwal tersimpan dan pemulihan delegasi tetap diproses agar tugas tidak terbengkalai.'),
 ]),
 group('EVIDENCE_INPUT','Pengambilan foto','Cara pengguna memilih foto pada formulir kamera bersama. Kewajiban foto dan GPS tetap diatur per proses; pengaturan ini bukan pembuktian keaslian kamera.',[
  num('EVIDENCE_IMAGE_MAX_KB','Batas ukuran setiap foto bukti',2000,50,2000,'KB','Batas server pada bukti baru. Lampiran hasil kunjungan tetap memiliki batas tambahan sekitar 500 KB dan 3 gambar. Bukti tersimpan tidak dihapus.'),
  {key:'EVIDENCE_IMAGE_FORMATS',label:'Format foto bukti',type:'text',defaultValue:'JPEG,PNG,WEBP',description:'Daftar unik JPEG,PNG,WEBP dipisahkan koma. Header berkas diperiksa, bukan hanya ekstensi. Beberapa lampiran proses mendukung JPEG/PNG saja.'},
  bool('EVIDENCE_ALLOW_REMOTE_IMAGES','Izinkan URL foto HTTP/HTTPS',true,'Kompatibilitas referensi gambar lama/layanan penyimpanan. Server tidak mengambil atau memverifikasi isi URL; batas format/ukuran berlaku pada gambar yang dikirim langsung. Nonaktif hanya menerima gambar langsung untuk bukti baru.'),
  select('CAMERA_INPUT_MODE','Sumber foto formulir','CAMERA',Object.keys(CAMERA_INPUT_LABELS),'Berlaku pada presensi Sales, SPV, Driver, shift dan validasi lapangan. Kamera bawaan merupakan permintaan ke perangkat; browser dapat tetap menawarkan pemilih berkas.',{optionLabels:CAMERA_INPUT_LABELS}),
 ]),
 group('FEATURES','Ketersediaan fitur','Aktif menerima pekerjaan baru. Jeda menghentikan pekerjaan baru sambil menyelesaikan pekerjaan terbuka. Nonaktif tetap mempertahankan histori yang dapat dibaca sesuai izin.',BUSINESS_FEATURES.map(f=>select(f.key,f.label,'ACTIVE',['ACTIVE','PAUSED','OFF'],'Pengaturan berlaku pada menu, tindakan server, dan proses otomatis.'))),
 group('UNLOCK_WORKFLOW','Pengecualian kunjungan','Izin terbatas pada pemohon dan outlet; tidak menggantikan foto, GPS, urutan atau hasil kunjungan.',[
  bool('UNLOCK_ALLOW_GEOFENCE','Izinkan permohonan pengecualian radius',true),
  bool('UNLOCK_ALLOW_LOCKED_OUTLET','Izinkan permohonan masuk outlet terkunci',true),
  select('UNLOCK_REVIEWER_ROLE','Pemeriksa pengecualian','BOTH',['ADMIN','SUPERVISOR','BOTH'],'Mengikuti scope Sales dan izin pemeriksa; tidak dapat menyetujui sendiri.'),
  num('UNLOCK_MAX_REQUESTS_PER_WINDOW','Batas pengajuan per Sales',0,0,100,'pengajuan','Nol tanpa batas. Semua status termasuk ditolak dihitung agar permintaan berulang tetap terkendali.'),
  num('UNLOCK_REQUEST_WINDOW_HOURS','Rentang pembatas pengajuan',24,1,720,'jam','Jendela bergulir sejak waktu server, bukan tanggal ponsel.'),
  num('UNLOCK_MAX_VISITS_PER_APPROVAL','Batas kunjungan per izin disetujui',0,0,100,'kunjungan','Nol tanpa batas selama izin berlaku. Masuk dan keluar pada stop yang sama dihitung satu kunjungan; hanya pengecualian yang benar-benar diperlukan dihitung. Dibekukan saat pengajuan.'),
 ]),
 group('VISIT_WORKFLOW','Alur kunjungan Sales','Kegiatan bisnis, hasil kunjungan, dan bukti presensi memiliki status terpisah.',[
  {key:'ATTENDANCE_EARLY_REASON_OPTIONS',label:'Pilihan alasan checkout lebih awal',type:'reference',defaultValue:DEFAULT_EARLY_REASONS,description:'Satu alasan per baris, 1–30 pilihan. Daftar dibekukan saat kunjungan dimulai; perubahan tidak mengganti alasan historis.'},
  bool('ATTENDANCE_EARLY_ALLOW_CUSTOM_REASON','Izinkan alasan checkout bebas',true,'Jika nonaktif, alasan wajib salah satu pilihan pada snapshot kunjungan. Tidak mengizinkan checkout dini bila aturan checkout dini nonaktif.'),
  select('SALES_ATTENDANCE_MODE','Mode presensi kunjungan','IN_OUT',['IN_OUT','IN_ONLY','OPTIONAL'],'Masuk–keluar; masuk saja; atau kegiatan tanpa presensi wajib.'),
  bool('SALES_ALLOW_CONTINUE_WITHOUT_OUT','Boleh lanjut ketika absen keluar terlewat',false,'Kunjungan sebelumnya masuk pemeriksaan SPV. Tidak dibuatkan bukti keluar otomatis.'),
  bool('SALES_REQUIRE_VISIT_RESULT','Wajib hasil kunjungan',false,'Hasil dapat dicatat terpisah dari presensi.'),
  bool('SALES_REQUIRE_GPS','Wajib GPS pada presensi',true),
  select('SALES_IN_PHOTO','Foto masuk','INHERIT',['INHERIT','REQUIRED','OPTIONAL'],'Mengikuti aturan foto lama atau aturan khusus masuk.'),
  select('SALES_OUT_PHOTO','Foto keluar','INHERIT',['INHERIT','REQUIRED','OPTIONAL'],'Mengikuti aturan foto lama atau aturan khusus keluar.'),
  num('SALES_MISSING_OUT_MINUTES','Flag presensi belum ditutup setelah',720,5,4320,'menit','Juga diperiksa saat pindah outlet atau menutup shift.'),
  bool('GPS_REQUIRE_METADATA','Wajib metadata akurasi dan waktu GPS',false),
  num('GPS_MAX_ACCURACY_METERS','Batas akurasi GPS untuk bukti',100000,5,100000,'meter'),
  num('GPS_MAX_AGE_SECONDS','Umur maksimal bukti GPS',120,10,1800,'detik'),
  bool('VISIT_RESULT_REQUIRE_NOTE','Wajib catatan hasil',false),
  select('VISIT_RESULT_OFFER_MODE','Rincian penawaran kunjungan','OPTIONAL',['DISABLED','OPTIONAL','REQUIRED']),
  select('VISIT_RESULT_OBSTACLE_MODE','Kendala kunjungan','OPTIONAL',['DISABLED','OPTIONAL','REQUIRED'],'Jika wajib dan tidak ada kendala, tulis “Tidak ada kendala”.'),
  select('VISIT_RESULT_ATTACHMENT_MODE','Lampiran hasil kunjungan','OPTIONAL',['DISABLED','OPTIONAL','REQUIRED'],'Foto pendukung terpisah dari foto presensi. Maksimal 3 gambar JPEG/PNG, masing-masing sekitar 500 KB.'),
 ]),
 group('SHIFT_WORKFLOW','Shift dan kehadiran','Aturan dapat diwariskan atau ditetapkan melalui profil role/tim.',[
  select('SHIFT_ATTENDANCE_MODE','Mode shift','IN_OUT',['IN_OUT','IN_ONLY','OPTIONAL']),
  {key:'SHIFT_END_TIME',label:'Jam selesai shift (WIB)',type:'text',defaultValue:'17:00',description:'Jika sama atau lebih awal dari jam masuk, jadwal selesai berada pada tanggal berikutnya. Tidak mengakhiri shift atau trip otomatis.'},
  {key:'SHIFT_WORKING_DAYS',label:'Hari kerja shift',type:'text',defaultValue:'1,2,3,4,5,6',description:'0 Minggu sampai 6 Sabtu, dipisahkan koma. Terpisah dari kalender PJP.'},
  select('SHIFT_NON_WORKDAY_POLICY','Mulai shift di luar hari kerja','ALLOW',['ALLOW','REASON','BLOCK'],'Hari mengikuti tanggal kerja WIB, termasuk untuk shift malam.',{optionLabels:{ALLOW:'Izinkan',REASON:'Izinkan dengan alasan',BLOCK:'Blokir shift baru'}}),
  select('SHIFT_EARLY_FINISH_POLICY','Selesai sebelum jadwal','ALLOW',['ALLOW','REASON','BLOCK'],'Berlaku pada penyelesaian shift, tanpa membuat waktu keluar otomatis.',{optionLabels:{ALLOW:'Izinkan',REASON:'Izinkan dengan alasan',BLOCK:'Tunggu jadwal selesai'}}),
  num('SHIFT_END_OVERRUN_MINUTES','Flag shift belum ditutup setelah jadwal selesai',0,0,1440,'menit','Nol mematikan flag jadwal. Driver yang masih menjalankan trip tetap dapat melanjutkan pekerjaan.'),
  select('SHIFT_IN_PHOTO','Foto masuk shift','OPTIONAL',['REQUIRED','OPTIONAL']),
  select('SHIFT_OUT_PHOTO','Foto keluar shift','OPTIONAL',['REQUIRED','OPTIONAL'],'Hanya berlaku pada mode masuk–keluar.'),
  bool('SHIFT_REQUIRE_GPS','Wajib GPS shift',false,'Khusus bukti masuk/keluar shift, tanpa radius outlet. Tidak berlaku pada kegiatan tanpa presensi wajib.'),
  bool('SHIFT_GPS_REQUIRE_METADATA','Wajib akurasi dan waktu GPS shift',false),
  num('SHIFT_GPS_MAX_ACCURACY_METERS','Batas akurasi GPS shift',100000,5,100000,'meter'),
  num('SHIFT_GPS_MAX_AGE_SECONDS','Umur maksimal GPS shift',120,10,1800,'detik'),
  bool('SHIFT_ALLOW_CONTINUE_UNCLOSED','Boleh mulai shift baru saat shift lama belum ditutup',false,'Shift sebelumnya ditandai untuk pemeriksaan.'),
  num('SHIFT_LATE_TOLERANCE_MINUTES','Toleransi keterlambatan',0,0,240,'menit'),
  bool('SHIFT_ALLOW_OPEN_VISITS','Boleh menutup shift dengan kunjungan belum selesai',false,'Kegiatan belum lengkap tetap masuk antrean perhatian.'),
  {key:'SHIFT_DAY_CUTOFF_TIME',label:'Pergantian tanggal kerja shift (WIB)',type:'text',defaultValue:'00:00',description:'Masuk sebelum jam ini memakai tanggal kerja sebelumnya. Cocok untuk shift malam; maksimal sama dengan jam mulai kerja. Tanggal kunjungan tetap mengikuti tanggal kalender.'},
  select('SHIFT_OVERNIGHT_POLICY','Shift melewati tengah malam','ALLOW',['ALLOW','FLAG'],'Izinkan penyelesaian shift atau tandai untuk pemeriksaan. Tidak menghalangi Driver yang masih menjalankan trip.',{optionLabels:{ALLOW:'Izinkan',FLAG:'Izinkan dengan flag pemeriksaan'}}),
  num('SHIFT_MAX_DURATION_HOURS','Flag shift berlangsung lebih dari',0,0,168,'jam','Nol mematikan batas. Penyelesaian tetap tersedia; durasi panjang masuk antrean pemeriksaan tanpa mengubah bukti.'),
  select('SHIFT_CORRECTION_MODE','Koreksi administratif waktu shift','OFF',['OFF','ADMIN','DUAL'],'Waktu server asli tetap. Koreksi tercatat terpisah dengan alasan, revisi dan keputusan; tidak membuat OUT atau menutup shift yang belum selesai.',{optionLabels:{OFF:'Tidak digunakan',ADMIN:'Keputusan Admin berizin',DUAL:'Usulan dan pemeriksaan Admin berbeda'}}),
  num('SHIFT_CORRECTION_MAX_AGE_DAYS','Batas tanggal lampau koreksi',30,0,365,'hari','Nol hanya mengizinkan koreksi tanggal hari ini (WIB).'),
  num('SHIFT_CORRECTION_MAX_DURATION_HOURS','Durasi maksimal dalam koreksi',48,1,168,'jam'),
 ]),
 group('SUPERVISION','Supervisi dan tugas','Bukti dan pemeriksaan hasil SPV terpisah dari aturan Sales.',[
  select('SPV_ATTENDANCE_MODE','Mode kunjungan SPV','IN_OUT',['IN_OUT','IN_ONLY','OPTIONAL']),
  bool('SPV_REQUIRE_PHOTO','Wajib foto kunjungan SPV'),bool('SPV_REQUIRE_GPS','Wajib GPS kunjungan SPV'),bool('SPV_ENFORCE_GEOFENCE','Batasi kunjungan SPV dengan radius'),
  bool('SPV_ALLOW_JOINT_VISIT','Izinkan pendampingan Sales'),bool('SPV_ALLOW_PRIORITY_AUDIT','Izinkan audit prioritas'),bool('SPV_ALLOW_OFF_PJP','Izinkan kunjungan SPV luar PJP'),
  bool('FOLLOW_UP_REQUIRE_REVIEW','Hasil tugas perlu pemeriksaan'),bool('FOLLOW_UP_REQUIRE_EVIDENCE','Wajib bukti hasil tugas'),
  num('FOLLOW_UP_DEFAULT_DAYS','Tenggat awal tugas',1,0,90,'hari'),
  {key:'SPV_AUDIT_ITEMS',label:'Pertanyaan audit supervisi',type:'checklist',defaultValue:DEFAULT_AUDIT_ITEMS,description:'Atur jawaban ya/tidak, teks, angka atau pilihan; kondisi gagal, alasan dan foto. Kunjungan yang telah dimulai tetap memakai daftar awal; perubahan label tidak mengganti kode historis.'},
 ]),
 group('PLANNING_POLICY','Aturan wilayah dan PJP','F1/F2/F4 tetap berarti interval setiap 1/2/4 minggu.',[
  bool('CLUSTER_SINGLE_CHANNEL','Satu cluster hanya satu channel'),
  num('PJP_MAX_PLAN_DAYS','Periode maksimal rencana',62,1,366,'hari'),
  num('PJP_MAX_VISITS_PER_DAY','Batas kunjungan per Sales per hari',50,1,500,'outlet'),
  select('PJP_OVERLOAD_POLICY','Ketika beban harian melampaui batas','WARN',['WARN','BLOCK']),
  bool('PJP_ALLOW_FREQUENCY_OVERRIDE','Izinkan perubahan interval dengan alasan'),
  bool('PJP_ALLOW_OWNER_OVERRIDE','Izinkan Sales pengganti dengan alasan'),
  bool('PJP_ALLOW_TEMPORARY_SUBSTITUTION','Izinkan Sales pengganti dalam rentang tanggal',false,'Per outlet dalam draft planner. Interval tetap mengikuti acuan asli, dan Sales utama kembali setelah periode berakhir. PJP terbit tidak dipindahkan otomatis; gunakan perubahan rute terkontrol.'),
  select('PJP_PUBLISH_ROLE','Pihak yang menerbitkan PJP','BOTH',['ADMIN','SUPERVISOR','BOTH']),
  bool('PJP_ALLOW_CANCEL_PUBLISHED','Pembatalan PJP terbit tanpa aktivitas',true,'Hanya agenda hari ini/masa depan yang belum memiliki presensi, hasil, order atau perubahan rute. Agenda beraktivitas tetap disimpan; alasan dan identitas agenda batal masuk riwayat.'),
  bool('PJP_ALLOW_SCHEDULED_PUBLISH','Izinkan penerbitan PJP terjadwal',true,'Jadwal diperiksa ulang sebelum terbit. Perubahan tim, kalender, aturan atau izin yang memengaruhi hasil memerlukan peninjauan ulang. Pembatalan jadwal tetap tersedia ketika fitur dijeda.'),
  select('PJP_ALLOWED_INTERVALS','Interval kunjungan yang diizinkan','1,2,4',['1','2','4','1,2','1,4','2,4','1,2,4'],'Pilihan untuk rencana dan outlet baru. Kode F1/F2/F4 lama tetap berarti interval minggu.'),
  select('PJP_DEFAULT_INTERVAL','Interval awal outlet baru','1',['1','2','4'],'Harus termasuk interval yang diizinkan. Tidak mengubah jadwal yang sudah diterbitkan.'),
  select('PJP_CALENDAR_SOURCE','Kalender perencanaan','WEEKDAYS',['WEEKDAYS','REPORT_CALENDAR'],'Hari kerja mingguan atau kalender bulanan Admin beserta tanggal libur/kerja khusus. Kalender bulanan yang belum diisi memblokir penerbitan.'),
  select('PJP_HOLIDAY_POLICY','Kunjungan jatuh pada hari libur','SKIP',['SKIP','BLOCK'],'Lewati dengan peringatan atau blokir agar tanggal acuan diperbaiki. Interval tidak digeser atau dimulai ulang secara otomatis.'),
  bool('OFF_PJP_REQUIRE_REVIEW','Kunjungan luar PJP perlu pemeriksaan'),
  bool('OFF_PJP_REQUIRE_PHOTO','Wajib foto luar PJP'),bool('OFF_PJP_REQUIRE_GPS','Wajib GPS luar PJP'),
 ]),
 group('REGISTRATION_WORKFLOW','Alur outlet baru','Pemeriksaan lokasi opsional tidak menjadi gerbang registrasi.',[
  bool('OUTLET_DEFERRED_CHANGE_ENABLED','Izinkan perubahan master tertunda',true,'Usulan menunggu waktu efektif dan pekerjaan aktif selesai. Perubahan master sesudah usulan dibuat membuat usulan gagal agar tidak menimpa data baru. Usulan tersimpan tetap diselesaikan saat opsi dimatikan.'),
  select('REGISTRATION_APPROVAL_MODE','Pemeriksaan pengajuan','BOTH',['NONE','ADMIN','SUPERVISOR','BOTH','SEQUENTIAL']),
  select('REGISTRATION_ACTIVATOR','Pihak yang mengaktifkan outlet','BOTH',['ADMIN','SUPERVISOR','BOTH']),
  bool('REGISTRATION_ALLOW_REVISION','Izinkan perbaikan pengajuan ditolak'),
  num('REGISTRATION_MAX_REVISIONS','Batas pengajuan ulang',0,0,100,'kali','Nol tanpa batas. Menghitung revisi berhasil, bukan percobaan atau pengiriman ulang yang identik.'),
  num('REGISTRATION_REVISION_DAYS','Batas waktu perbaikan sejak penolakan',0,0,365,'hari','Nol tanpa batas. Satu hari berarti 24 jam sejak penolakan terakhir. Mengikuti aturan saat pengajuan dibuat.'),
  bool('REGISTRATION_REQUIRE_LOCATION','Wajib koordinat saat pengajuan',true,'Jika opsional, kedua koordinat boleh kosong. Tidak memakai titik kantor atau nol sebagai pengganti.'),
  {key:'REGISTRATION_SUBMIT_REQUIRED_FIELDS',label:'Data tambahan wajib saat pengajuan',type:'field-requirements',defaultValue:'',options:Object.keys(REGISTRATION_FIELDS),optionLabels:REGISTRATION_FIELDS,description:'Kosong berarti seluruh data tambahan opsional. Nama, alamat dan konsistensi identitas tetap diperiksa sebagai identitas inti.'},
  {key:'REGISTRATION_ACTIVATION_REQUIRED_FIELDS',label:'Data tambahan wajib saat aktivasi',type:'field-requirements',defaultValue:'',options:Object.keys(REGISTRATION_FIELDS),optionLabels:REGISTRATION_FIELDS,description:'Admin/aktivator dapat melengkapi data saat mengaktifkan outlet; perubahan dicatat dengan petugas dan nilai sebelumnya. Mengikuti snapshot pengajuan.'},
  bool('REGISTRATION_ACTIVATION_REQUIRE_LOCATION','Wajib koordinat sebelum aktivasi',true,'Dapat berbeda dari pengajuan. Tanpa titik, kemampuan rute/radius ditandai belum tersedia; validasi outlet tetap opsional.'),
  select('OUTLET_DUPLICATE_POLICY','Kemungkinan outlet ganda','REASON',['BLOCK','REASON','WARN']),
  num('OUTLET_DUPLICATE_RADIUS_METERS','Jarak pemeriksaan duplikasi',100,5,1000,'meter'),
  num('OUTLET_DUPLICATE_NAME_PERCENT','Kemiripan nama kandidat duplikasi',80,50,100,'%'),
 ]),
 group('ORDER_WORKFLOW','Alur order dan catatan eksternal','Harga, pemeriksaan order, dan pencatatan pembayaran di luar aplikasi.',[
  bool('ORDER_ALLOW_OUTSIDE_PJP','Izinkan order tanpa kunjungan PJP',false,'Sales memilih outlet aktif dalam penugasannya. Order tidak menciptakan PJP, presensi atau kunjungan aktual.'),
  bool('ORDER_OUTSIDE_PJP_REQUIRE_REASON','Wajib alasan order tanpa PJP',true,'Alasan disimpan pada order. Tidak mengubah syarat presensi untuk order yang dibuat melalui kunjungan.'),
  select('ORDER_APPROVAL_MODE','Persetujuan order','BOTH',['NONE','ADMIN','SUPERVISOR','BOTH','SEQUENTIAL']),
  num('ORDER_APPROVAL_AMOUNT_THRESHOLD','Batas nominal untuk persetujuan khusus',0,0,1000000000000,'Rp','Nol menonaktifkan aturan nominal. Berlaku jika total akhir order sama dengan atau melebihi batas, setelah perhitungan pajak.'),
  select('ORDER_APPROVAL_AMOUNT_MODE','Persetujuan order pada batas nominal','ADMIN',['NONE','ADMIN','SUPERVISOR','BOTH','SEQUENTIAL'],'Menggantikan persetujuan dasar pada order yang memenuhi batas nominal.'),
  select('ORDER_PRICE_OVERRIDE_APPROVAL_MODE','Persetujuan saat harga katalog diubah','INHERIT',['INHERIT','NONE','ADMIN','SUPERVISOR','BOTH','SEQUENTIAL'],'Hanya berlaku jika perubahan harga memang diizinkan. Mengikuti aturan umum tetap mengizinkan aturan nominal.'),
  select('ORDER_APPROVAL_CONDITION_PRIORITY','Prioritas saat kedua kondisi order terpenuhi','PRICE_FIRST',['PRICE_FIRST','AMOUNT_FIRST'],'Satu alur dipilih dan dibekukan ketika order dibuat; prioritas dinyatakan eksplisit.',{optionLabels:{PRICE_FIRST:'Utamakan perubahan harga',AMOUNT_FIRST:'Utamakan batas nominal'}}),
  bool('ORDER_PRICE_OVERRIDE_REQUIRE_REASON','Wajib alasan perubahan harga katalog',false,'Tidak mengaktifkan izin perubahan harga. Alasan dan harga katalog tersimpan bersama keputusan order.'),
  bool('ORDER_PRICE_OVERRIDE_LIMIT_ENABLED','Batasi perubahan harga dengan persentase',false,'Tidak memberikan izin mengubah harga. Batas diperiksa terhadap harga katalog saat order baru diterima; order tersimpan tetap memakai harga awal.'),
  num('ORDER_PRICE_OVERRIDE_MAX_DISCOUNT_PERCENT','Penurunan harga maksimum',100,0,100,'%','Berlaku per produk ketika batas perubahan harga aktif. Nol berarti harga tidak boleh diturunkan.'),
  num('ORDER_PRICE_OVERRIDE_MAX_MARKUP_PERCENT','Kenaikan harga maksimum',100,0,1000,'%','Berlaku per produk ketika batas perubahan harga aktif. Nol berarti harga tidak boleh dinaikkan.'),
  select('ORDER_TAX_ROUNDING_MODE','Pembulatan nilai pajak order','NEAREST',['NEAREST','DOWN','UP'],'Pajak dibulatkan ke rupiah. Total harga sebelum pajak tetap sesuai baris produk. Faktur dari order mewarisi aturan yang disimpan pada order.',{optionLabels:{NEAREST:'Rupiah terdekat',DOWN:'Bulatkan ke bawah',UP:'Bulatkan ke atas'}}),
  bool('ORDER_REQUIRE_CHECKIN','Order mengikuti kewajiban masuk kunjungan',true,'Pada mode tanpa presensi wajib, bukti IN tidak dipaksakan.'),
  bool('ORDER_ALLOW_AFTER_VISIT','Izinkan order setelah kegiatan selesai',false),
  bool('ORDER_ALLOW_BATCH_APPROVAL','Izinkan persetujuan massal'),
  bool('ORDER_ALLOW_CANCEL_REMAINDER','Izinkan pembatalan sisa order'),
  bool('COLLECTION_AUTO_FOLLOW_UP','Buat tugas untuk janji pembayaran'),
 ]),
 group('OUTLET_REVIEW_POLICY','Validasi outlet · alur dan tanggung jawab','Validasi opsional terpisah dari registrasi. Perubahan master memerlukan keputusan pemeriksa berizin.',[
  bool('OUTLET_REVIEW_AUTO_CLOSE','Selesaikan otomatis master yang sudah selaras',false,'Hanya ketika identitas dan lokasi kuat, tidak ambigu dan tidak ada perubahan master. Tidak menerapkan koreksi otomatis.'),
  bool('OUTLET_MAP_COMPARISON_ENABLED','Izinkan perbandingan bukti Google Maps outlet',true,'Nonaktif menghentikan panggilan Google untuk pemeriksaan. Kasus tetap dapat diselesaikan berdasarkan bukti lapangan; registrasi tidak bergantung pada fitur ini.'),
  select('OUTLET_REVIEW_DEFAULT_OWNER','PIC awal kasus pemeriksaan','ADMIN_QUEUE',['ADMIN_QUEUE','REQUESTER','TEAM_SUPERVISOR']),
  num('OUTLET_REVIEW_SLA_HOURS','Tenggat awal pemeriksaan outlet',0,0,720,'jam','Nol tanpa tenggat otomatis. Kalender SLA dibekukan pada kasus baru.'),
  num('OUTLET_REVIEW_BATCH_LIMIT','Batas outlet sekali pemeriksaan',30,1,100,'outlet'),
 ]),
 group('OUTLET_REVIEW_SEARCH','Validasi outlet · pencarian Google','Pencarian nama/alamat tidak bergantung pada titik lama. Perluasan dan detail tunduk pada batas panggilan.',[
  num('OUTLET_REVIEW_MAX_CALLS','Batas panggilan per outlet',6,2,12,'panggilan'),
  num('OUTLET_REVIEW_MAX_CANDIDATES','Kandidat maksimum yang ditinjau',5,2,10,'kandidat'),
  bool('OUTLET_REVIEW_EXPAND_SEARCH','Perluas pencarian melalui alamat/wilayah',true,'Titik lama yang diragukan tidak menjadi jangkar wajib.'),
  num('OUTLET_REVIEW_SEARCH_RADIUS_METERS','Radius pencarian kandidat dekat',comparison.searchRadiusMeters,50,5000,'meter'),
  num('OUTLET_REVIEW_TIMEOUT_SECONDS','Batas tunggu setiap permintaan pemeriksaan peta',comparison.timeoutSeconds,2,60,'detik'),
 ]),
 group('OUTLET_REVIEW_MATCHING','Validasi outlet · kecukupan bukti','Kemiripan bukan probabilitas. Konflik cabang, nomor alamat, kota, tutup/pindah tetap menghalangi hasil kuat.',[
  num('OUTLET_REVIEW_STRONG_NAME_PERCENT','Nama minimum untuk bukti kuat',90,80,100,'%'),
  num('OUTLET_REVIEW_STRONG_ADDRESS_PERCENT','Alamat minimum untuk bukti kuat',80,60,100,'%'),
  num('OUTLET_REVIEW_CANDIDATE_GAP','Selisih minimum kandidat kuat',15,5,40,'poin'),
  num('OUTLET_REVIEW_EVIDENCE_DAYS','Masa berlaku hasil perbandingan peta',comparison.evidenceDays,0,3650,'hari','Nol tanpa kedaluwarsa penilaian berdasarkan umur. Cache koordinat Google tetap maksimal 30 hari; setelah cache berakhir pemeriksaan ulang wajib untuk keputusan digital.'),
 ]),
 group('OUTLET_REVIEW_ADMIN','Validasi outlet · pertimbangan Admin','Admin berizin dapat menerima kandidat di bawah syarat standar setelah meninjau peta dan mencatat alasan. Skor asli tetap tercatat. Kandidat tanpa detail/titik sah, tutup/pindah, hasil kedaluwarsa atau master berubah tetap perlu pemeriksaan baru.',[
  bool('OUTLET_REVIEW_ADMIN_ENABLED','Izinkan konfirmasi dengan pertimbangan Admin',true,'Hanya role Admin dengan izin menyimpan keputusan. Tidak berlaku untuk persetujuan otomatis atau Supervisor.'),
  num('OUTLET_REVIEW_ADMIN_NAME_PERCENT','Kemiripan nama minimum untuk Admin',70,0,100,'%','Minimal nama atau alamat memenuhi ambang Admin, atau telepon usaha cocok. Nol mengabaikan ambang sinyal ini.'),
  num('OUTLET_REVIEW_ADMIN_ADDRESS_PERCENT','Kemiripan alamat minimum untuk Admin',60,0,100,'%','Dipakai sebagai alternatif kecocokan nama. Nilai lebih rendah membantu tinjauan alamat lama yang tidak lengkap; alasan keputusan tetap wajib.'),
  bool('OUTLET_REVIEW_ADMIN_ALLOW_AMBIGUOUS','Admin boleh memilih kandidat ambigu',true,'Wajib memeriksa ulang kandidat yang dipilih dan menyatakan sudah meninjau perbedaannya.'),
  bool('OUTLET_REVIEW_ADMIN_ALLOW_CONFLICTS','Admin boleh menerima konflik data',false,'Meliputi perbedaan telepon, nomor/cabang, kota, atau jarak dari GPS terpercaya. Profil tutup/pindah dan titik tidak sah tetap tidak dapat diterima.'),
 ]),
 group('OUTLET_FIELD_POLICY','Validasi outlet · tugas Sales','Bukti lapangan terpisah dari presensi. Persyaratan dibekukan saat tugas dibuat.',[
  bool('OUTLET_FIELD_ENABLED','Izinkan tugas pemeriksaan Sales',true),
  bool('OUTLET_FIELD_REQUIRE_GPS','Wajib GPS hasil lapangan',true),
  bool('OUTLET_FIELD_REQUIRE_PHOTO','Wajib foto hasil lapangan',true),
  num('OUTLET_FIELD_GPS_MAX_AGE_MINUTES','Umur maksimal GPS lapangan',15,1,120,'menit'),
  num('OUTLET_FIELD_GPS_MAX_ACCURACY','Akurasi maksimal GPS lapangan',100,5,1000,'meter'),

  select('OUTLET_FIELD_PJP_MODE','PJP tugas validasi','TODAY_ONLY',['TODAY_ONLY','UNTIL_COMPLETE'],'Dibekukan saat ditugaskan. Riwayat hari yang belum dikerjakan tetap ditandai; tidak mengubah template kunjungan rutin.',{optionLabels:{TODAY_ONLY:'Hanya hari ditugaskan',UNTIL_COMPLETE:'Tetap muncul sampai validasi selesai'}}),
  num('OUTLET_FIELD_REVIEW_SLA_HOURS','Tenggat pemeriksaan bukti Sales',24,0,720,'jam','Dimulai saat bukti dikirim. Nol tanpa tenggat otomatis; kalender dibekukan pada tugas.'),
  num('OUTLET_FIELD_SLA_HOURS','Tenggat tugas lapangan',48,1,720,'jam'),
 ]),
 group('OUTLET_GOOGLE_LOCATION','Validasi outlet · lokasi operasional','Titik Google disetujui terpisah dari koordinat internal dan hanya dipakai selama cache berlaku.',[
  bool('OUTLET_LOCATION_ALERTS_ENABLED','Pantau masalah lokasi di antrean perhatian',true,'Menampilkan titik kosong, konflik, kedaluwarsa dan kegagalan pembaruan ke Admin/SPV. Tidak membuat kasus, tugas Sales atau presensi otomatis. Tetap dapat dipantau ketika pemeriksaan Google dijeda.'),
  num('OUTLET_LOCATION_ALERT_SLA_HOURS','Tenggat penanganan peringatan lokasi',24,0,720,'jam','Berlaku pada peringatan tanpa kasus terbuka. Nol tanpa tenggat. Mengikuti kalender SLA; kasus terbuka tetap memakai PIC dan tenggat kasus/tugas yang sudah ditetapkan.'),
  bool('OUTLET_GOOGLE_LOCATION_ENABLED','Terapkan / perbarui titik Google',true,'Keputusan digital kuat dapat memakai cache titik Google untuk rute dan radius. Mematikan menghentikan penerapan/pembaruan berikutnya; titik yang sudah disetujui tetap berlaku sampai kedaluwarsa. Tidak menimpa bukti GPS.'),
  bool('OUTLET_GOOGLE_LOCATION_AUTO_REFRESH','Perbarui titik Google otomatis',true,'Perbarui referensi yang telah disetujui sebelum kedaluwarsa. Konflik memerlukan pemeriksaan ulang; kegagalan layanan tidak memperpanjang masa berlaku.'),
  num('OUTLET_GOOGLE_LOCATION_CACHE_DAYS','Masa berlaku titik Google',7,1,30,'hari','Maksimal 30 hari. Dibekukan ketika titik disetujui atau berhasil diperbarui.'),
  num('OUTLET_GOOGLE_LOCATION_REFRESH_HOURS','Perbarui sebelum kedaluwarsa',24,1,168,'jam','Pembaruan dibatasi kuota Google bersama. Waktu awal paling cepat separuh masa cache untuk menghindari panggilan berulang yang tidak perlu.'),
  num('OUTLET_GOOGLE_LOCATION_MAX_DRIFT_METERS','Pergeseran yang perlu tinjauan ulang',30,0,1000,'m','Titik Google yang berubah melebihi batas tidak diterapkan otomatis.'),
 ]),
 group('OUTLET_REVIEW_LEGACY','Validasi outlet · referensi metode lama','Nilai kompatibilitas metode terdahulu. Pemeriksaan baru memakai kelompok kecukupan bukti; histori tidak dihitung ulang.',[
  num('OUTLET_REVIEW_NAME_MATCH_PERCENT','Kemiripan minimum nama kandidat',comparison.nameMatchPercent,50,100,'%'),
  num('OUTLET_REVIEW_ADDRESS_MATCH_PERCENT','Kemiripan alamat untuk dianggap selaras',comparison.addressMatchPercent,10,100,'%'),
  num('OUTLET_REVIEW_ADDRESS_CONFLICT_PERCENT','Kemiripan alamat di bawah ini dianggap konflik',comparison.addressConflictPercent,0,90,'%','Harus lebih kecil dari ambang alamat selaras. Nilai di antaranya tetap meragukan.'),
  num('OUTLET_REVIEW_ALTERNATIVE_NAME_PERCENT','Kemiripan minimum kandidat alternatif',comparison.alternativeNamePercent,0,100,'%','Alternatif yang dekat dan memiliki nama serupa menandai ambiguitas. Tidak boleh melebihi ambang kecocokan nama.'),
  num('OUTLET_REVIEW_AMBIGUITY_GAP_PERCENT','Selisih maksimum kemiripan kandidat ambigu',comparison.ambiguityGapPercent,0,50,'poin persen','Kandidat alternatif dalam selisih ini membuat hasil meragukan. Nilai nol tetap mendeteksi kandidat dengan kemiripan yang sama.'),
  num('OUTLET_REVIEW_SUGGESTION_NAME_PERCENT','Kemiripan minimum untuk usulan titik',comparison.suggestionNamePercent,50,100,'%','Minimal sama dengan ambang kecocokan nama. Usulan tetap perlu keputusan manusia dan tidak memindahkan master otomatis.'),
 ]),
 group('OUTLET_REVIEW_SERVICE','Validasi outlet · kuota dan biaya','Batas bersama seluruh server. Estimasi mengikuti asumsi Admin, bukan tagihan aktual Google.',[
  num('OUTLET_REVIEW_DAILY_CALL_LIMIT','Batas panggilan pemeriksaan per hari WIB',0,0,100000,'panggilan','Nol tanpa batas aplikasi. Setiap HTTP provider dihitung, termasuk retry dan hasil gagal.'),
  num('OUTLET_REVIEW_CALLS_PER_MINUTE','Batas panggilan pemeriksaan per menit',0,0,10000,'panggilan','Nol tanpa batas aplikasi. Batas dibagi seluruh koneksi server memakai PostgreSQL.'),
  num('OUTLET_REVIEW_DAILY_BUDGET_RUPIAH','Batas perkiraan biaya pemeriksaan per hari',0,0,1000000000,'Rp','Nol tanpa batas perkiraan. Bukan tagihan aktual provider.'),
  num('OUTLET_REVIEW_ESTIMATED_CALL_RUPIAH','Asumsi biaya setiap panggilan pemeriksaan',0,0,1000000,'Rp','Diisi Admin menurut kontrak provider; tidak memprediksi harga layanan secara otomatis.'),
 ]),
 group('WAREHOUSE_WORKFLOW','Tahapan gudang dan penutupan trip','Tahap yang dilewati dicatat sebagai tidak diwajibkan, bukan bukti pemeriksaan petugas.',[
  select('DELIVERY_RECIPIENT_MODE','Nama penerima barang','OPTIONAL',['DISABLED','OPTIONAL','REQUIRED'],'Berlaku untuk barang diterima penuh atau sebagian; penolakan penuh tidak memerlukan penerima.'),
  select('DELIVERY_SIGNATURE_MODE','Tanda tangan penerima','DISABLED',['DISABLED','OPTIONAL','REQUIRED'],'Bukti penerimaan barang. Jika diisi, nama penerima wajib. Tidak menjadi bukti pembayaran.'),
  bool('WAREHOUSE_REQUIRE_PICK','Wajib tahap penyiapan'),bool('WAREHOUSE_REQUIRE_CHECK','Wajib pemeriksaan muatan'),bool('WAREHOUSE_REQUIRE_LOAD','Wajib konfirmasi loading'),
  bool('WAREHOUSE_SEPARATE_CHECKER','Pemeriksa berbeda dari penyiap',false),
  bool('TRIP_REQUIRE_ODOMETER','Wajib kilometer aktual'),
  {key:'TRIP_DEPARTURE_CHECKLIST',label:'Checklist sebelum keberangkatan',type:'checklist',defaultValue:[],description:'Pertanyaan ya/tidak, teks, angka atau pilihan beserta alasan/foto ketika gagal. Kosongkan untuk menonaktifkan. Checklist dibekukan pada trip dan jawaban disimpan bersama pelaku serta waktu keberangkatan.'},
  bool('TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST','Tahan keberangkatan jika jawaban checklist gagal',true,'Berlaku pada pertanyaan yang memiliki kondisi gagal; petugas perlu memperbaiki kondisi sebelum berangkat. Jika nonaktif, kegagalan tetap disimpan pada bukti keberangkatan.'),
  bool('TRIP_REQUIRE_DOCUMENT_RETURN','Wajib rekonsiliasi dokumen saat tutup'),
  bool('TRIP_REQUIRE_RETURN_INSPECTION','Wajib pemeriksaan barang kembali'),
  bool('TRIP_BLOCK_OPEN_ISSUES','Tahan penutupan jika masih ada masalah'),
  select('DELIVERY_ATTENDANCE_MODE','Mode bukti di tujuan','IN_OUT',['IN_OUT','IN_ONLY','OPTIONAL']),
  bool('DELIVERY_ALLOW_RESULT_WITHOUT_OUT','Izinkan hasil pengiriman tanpa bukti keluar',false,'Hanya pada mode masuk + keluar setelah bukti masuk tersedia. Driver wajib memberi alasan; gudang menerima tugas pemeriksaan. Foto hasil tetap mengikuti kewajibannya. Tidak membuat presensi keluar otomatis.'),
  select('DELIVERY_STOP_ORDER','Urutan pelaksanaan tujuan','FREE',['FREE','SEQUENTIAL'],'Urutan wajib menunggu hasil seluruh tujuan sebelumnya. Tujuan yang sudah dimulai tetap dapat diselesaikan.',{optionLabels:{FREE:'Bebas memilih tujuan',SEQUENTIAL:'Sesuai urutan sampai hasil selesai'}}),
  bool('DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT','Boleh lanjut saat hasil tujuan sebelumnya belum dicatat',true,'Pada urutan bebas, tujuan yang sudah didatangi tetapi belum memiliki hasil ditandai untuk gudang. Tidak membuat bukti keluar atau hasil barang otomatis.'),
  bool('DELIVERY_REQUIRE_GPS','Wajib GPS pada presensi tujuan'),
  num('DELIVERY_ISSUE_DEFAULT_HOURS','Tenggat awal kendala pengiriman',24,1,720,'jam'),
 ]),
 group('TRACKING_POLICY','Berbagi lokasi dan layanan peta','Sakelar pelacakan berlaku segera. Titik presensi dan GPS langsung tetap dibedakan.',[
  select('DRAFT_STORAGE_MODE','Penyimpanan draf formulir','SESSION',['SESSION','PERSISTENT'],'Sesi browser atau perangkat ini agar bertahan setelah browser ditutup. Terpisah per akun. Berlaku saat formulir dibuka; draf belum menjadi transaksi server.',{optionLabels:{SESSION:'Selama sesi browser',PERSISTENT:'Tetap di perangkat ini'}}),
  bool('DRIVER_BACKGROUND_SUBMISSION_ENABLED','Kirim ulang bukti Driver otomatis',false,'Memerlukan draf persisten dan HTTPS. Payload/UUID/foto/GPS asli disimpan pada antrean perangkat; akses token sesi digunakan tanpa menyimpan refresh token. Logout menghentikan sesi antrean. Dukungan Background Sync mengikuti browser; saat sesi habis atau validasi gagal pengguna perlu masuk/periksa kembali. Bukan GPS latar belakang.'),
  num('DRAFT_RETENTION_HOURS','Masa simpan draf biasa',24,1,168,'jam','Permintaan yang sudah dicoba tetapi belum dikonfirmasi tidak kedaluwarsa otomatis; periksa hasil server dahulu. Foto/GPS lama tetap divalidasi server, bukan dianggap bukti baru.'),
  select('SALES_TRACKING_MODE','Berbagi GPS Sales','LOGIN',['OFF','LOGIN','SHIFT','VISIT']),
  select('DRIVER_TRACKING_MODE','Berbagi GPS Driver','TRIP',['OFF','TRIP']),
  num('TRACKING_SEND_INTERVAL_SECONDS','Jeda pengiriman lokasi',30,10,600,'detik'),
  num('TRACKING_TRAIL_MIN_DISTANCE_METERS','Jarak minimum antartitik jejak',0,0,1000,'meter','Membatasi titik jejak yang berdekatan, bukan menghentikan heartbeat GPS saat kendaraan/petugas diam. Nol menyimpan setiap titik yang diterima.'),
  num('TRACKING_LOCATION_RETENTION_HOURS','Masa simpan titik GPS dan jejak langsung',0,0,8760,'jam','Nol menonaktifkan penghapusan otomatis. Nilai positif menyembunyikan titik kedaluwarsa dan menghapus telemetri melalui pemindaian berkala. Bukti presensi tidak dihapus. Data yang sudah dihapus tidak dipulihkan dengan memperpanjang batas.'),
  num('DRIVER_TRACKING_LIVE_SECONDS','Batas usia GPS langsung Driver',120,30,1800,'detik'),
  num('DRIVER_TRACKING_MAX_POINTS','Panjang jejak Driver',60,5,500,'titik'),
  select('ROUTING_PROVIDER','Layanan rute jalan','AUTO',['AUTO','GOOGLE','OSRM','OFF']),
  bool('ROUTING_ALLOW_FALLBACK','Izinkan layanan rute cadangan'),
  select('PLACE_LOOKUP_PROVIDER','Layanan pencarian alamat outlet','AUTO',['AUTO','GOOGLE','OSM','OFF'],'Terpisah dari rute jalan dan GPS perangkat. Nonaktif tetap mengizinkan alamat manual.',{optionLabels:{AUTO:'Otomatis: Google lalu OpenStreetMap',GOOGLE:'Google',OSM:'OpenStreetMap',OFF:'Nonaktif'}}),
  bool('PLACE_LOOKUP_ALLOW_FALLBACK','Izinkan pencarian alamat cadangan',true,'Jika Google tidak tersedia atau tidak menemukan hasil dalam radius, gunakan OpenStreetMap. Tidak berlaku ketika provider dipilih OpenStreetMap atau Nonaktif.'),
  num('PLACE_LOOKUP_TIMEOUT_SECONDS','Batas tunggu setiap layanan alamat',10,2,60,'detik','Pencarian gagal menampilkan pesan untuk mencoba lagi atau melengkapi alamat manual.'),
 ]),
 group('VEHICLE_SERVICE_POLICY','Pemantauan dan pencatatan servis','Interval umum mengikuti profil yang efektif; interval khusus dikelola pada kendaraan. Mematikan pengingat tidak mengubah kelayakan kendaraan.',[
  {key:'VEHICLE_SERVICE_CATALOG',label:'Pilihan jenis servis',type:'catalog',defaultValue:DEFAULT_SERVICE_CATALOG,description:'Tambah kode, ubah label, nonaktifkan input baru, dan atur urutan. Kode tersimpan dipertahankan. Hanya tiga kode komponen bawaan mengatur dasar kilometer pengingat; jenis tambahan menjadi catatan servis tanpa membuat interval komponen fiktif.'},
  bool('VEHICLE_SERVICE_SCHEDULED_REMINDERS','Kirim pengingat servis berkala',false,'Diperiksa setiap jam. Status kilometer tetap ditampilkan walaupun pemberitahuan berkala dimatikan.'),
  num('VEHICLE_SERVICE_REPEAT_HOURS','Jeda pengulangan pengingat servis',24,0,720,'jam','Nol mengirim sekali per kendaraan, jenis servis dan tingkat peringatan sampai dasar servis berubah.'),
  bool('NOTIFY_VEHICLE_SERVICE_EVENTS','Notifikasi servis kendaraan'),
  bool('VEHICLE_SERVICE_REMINDERS_ENABLED','Tampilkan pengingat servis berdasarkan kilometer'),
  num('VEHICLE_SERVICE_WARNING_PERCENT','Peringatan saat interval servis terpakai',80,1,99,'%'),
  bool('VEHICLE_SERVICE_REQUIRE_WORKSHOP','Wajib nama bengkel saat mencatat servis',false),
  bool('VEHICLE_SERVICE_REQUIRE_NOTE','Wajib catatan servis',false),
  bool('VEHICLE_SERVICE_ALLOW_BACKDATE','Izinkan tanggal servis sebelum hari ini',true,'Tanggal kejadian aktual boleh dicatat kemudian. Tanggal masa depan tetap tidak sah.'),
  num('VEHICLE_SERVICE_MAX_BACKDATE_DAYS','Batas umur kejadian servis yang boleh dicatat',0,0,3650,'hari','Nol tanpa batas umur. Dihitung menurut tanggal WIB; catatan lama tidak diubah.'),
 ]),
 group('SLA_CALENDAR','Kalender SLA','Jam kalender atau jam kerja WIB untuk pekerjaan tanpa tenggat eksplisit.',[
  select('SLA_CLOCK_MODE','Dasar durasi SLA','CALENDAR',['CALENDAR','BUSINESS']),
  {key:'SLA_WORKING_DAYS',label:'Hari kerja SLA',type:'text',defaultValue:'1,2,3,4,5,6',description:'0 Minggu sampai 6 Sabtu, dipisahkan koma.'},
  {key:'SLA_WORK_START',label:'Awal jam kerja SLA (WIB)',type:'text',defaultValue:'08:00'},
  {key:'SLA_WORK_END',label:'Akhir jam kerja SLA (WIB)',type:'text',defaultValue:'17:00'},
  {key:'SLA_HOLIDAYS',label:'Tanggal libur SLA',type:'text',defaultValue:'',description:'Tanggal YYYY-MM-DD dipisahkan koma. Tenggat eksplisit tidak digeser.'},
 ]),
 group('REPORTING_POLICY','Laporan dan notifikasi','Ketersediaan keluaran, pemantauan, dan ukuran halaman.',[
  bool('REPORT_SHOW_COMMERCIAL','Tampilkan nominal dan target pada laporan',true,'Pembatasan server laporan harian, mingguan, MTD, rekap dan arsip, termasuk ekspor dari data laporan. Atur per role/tim melalui profil. Tidak mengubah akses order operasional.'),
  bool('REPORT_SHOW_CONTACT','Tampilkan kolom kontak dan alamat laporan',true,'Membatasi kolom terstruktur kontak/alamat pada server laporan. Catatan bebas dan hak akses modul master diatur terpisah.'),
  bool('REPORT_SHOW_LOCATION','Tampilkan titik lokasi pada laporan',true,'Membatasi koordinat, tautan peta dan metadata lokasi terstruktur. Flag anomali kunjungan tetap tampil.'),
  bool('REPORT_SHOW_EVIDENCE','Tampilkan foto dan lampiran laporan',true,'Membatasi kolom foto/lampiran/tanda tangan terstruktur pada server laporan, tanpa menghapus bukti asli.'),
  num('REPORT_DAILY_DEFAULT_DAYS_AGO','Tanggal awal laporan harian',0,0,31,'hari lalu','Nol berarti hari ini WIB. Hanya default saat belum ada pilihan pengguna.'),
  select('REPORT_REGISTRATION_DEFAULT_STATUS','Status awal laporan registrasi','ALL',['ALL','SUBMITTED','SPV_APPROVED','REGISTERED_ACTIVE','REJECTED'],'Filter awal saja; tidak mengubah status atau persetujuan outlet.',{optionLabels:{ALL:'Semua status',SUBMITTED:'Menunggu persetujuan',SPV_APPROVED:'Disetujui SPV',REGISTERED_ACTIVE:'Aktif di sistem',REJECTED:'Ditolak'}}),
  select('REPORT_REGISTRATION_DEFAULT_PERIOD','Periode awal laporan registrasi','ALL',['ALL','LAST_7','LAST_30','CURRENT_MONTH','PREVIOUS_MONTH'],'Tanggal pengajuan mengikuti WIB. Hanya default sebelum pengguna mengubah filter.',{optionLabels:{ALL:'Seluruh tanggal',LAST_7:'7 hari terakhir',LAST_30:'30 hari terakhir',CURRENT_MONTH:'Bulan berjalan',PREVIOUS_MONTH:'Bulan sebelumnya'}}),
  select('REPORT_SPV_DEFAULT_VIEW','Tab awal pemantauan Supervisor','visits',['visits','timeline','audit','map'],'Pilihan URL pengguna dan izin laporan/peta didahulukan.',{optionLabels:{visits:'Kunjungan',timeline:'Timeline Sales',audit:'Indikasi presensi',map:'Posisi terkini'}}),
  select('REPORT_DAILY_DEFAULT_TYPE','Filter awal kunjungan harian','ALL',['ALL','EFFECTIVE_CALL','NON_EFFECTIVE_CALL','EXTRA_CALL','SKIPPED','ALL_ANOMALIES'],'Tidak mengubah cakupan akses atau metrik.',{optionLabels:{ALL:'Semua kunjungan',EFFECTIVE_CALL:'Effective call',NON_EFFECTIVE_CALL:'Tanpa order',EXTRA_CALL:'Kunjungan tambahan',SKIPPED:'Terlewat',ALL_ANOMALIES:'Semua anomali'}}),
  select('REPORT_WEEKLY_DEFAULT_PERIOD','Periode awal mingguan','CURRENT',['CURRENT','PREVIOUS'],'Minggu dimulai Senin; hari kerja perhitungan tetap mengikuti kalender laporan.',{optionLabels:{CURRENT:'Minggu berjalan',PREVIOUS:'Minggu sebelumnya'}}),
  select('REPORT_MTD_DEFAULT_PERIOD','Periode awal bulanan','CURRENT',['CURRENT','PREVIOUS'],'Hanya pemilihan awal; formula target dan bulan pembanding tetap.',{optionLabels:{CURRENT:'Bulan berjalan',PREVIOUS:'Bulan sebelumnya'}}),
  select('REPORT_DEFAULT_VIEW','Tab awal laporan','DAILY',['DAILY','WEEKLY','MTD'],'Dipakai jika pengguna belum memilih tab. Tab nonaktif tidak ditawarkan.'),
  select('REPORT_TABLE_DENSITY','Kepadatan tabel laporan','COMFORTABLE',['COMFORTABLE','COMPACT'],'Pengaturan tampilan saja; tidak mengubah izin, scope, arsip atau isi ekspor.',{optionLabels:{COMFORTABLE:'Nyaman',COMPACT:'Ringkas'}}),
  ...Object.entries(REPORT_PRESENTATION).map(([key,items])=>({key,label:({REPORT_SPV_WIDGETS:'Kartu ringkasan pemantauan Supervisor',REPORT_WEEKLY_WIDGETS:'Kartu ringkasan mingguan',REPORT_MTD_WIDGETS:'Kartu ringkasan bulanan',REPORT_WEEKLY_COLUMNS:'Kelompok kolom mingguan',REPORT_MTD_COLUMNS:'Kolom bulanan'})[key],type:'text',defaultValue:items.join(','),description:'Pilih informasi yang ditampilkan. Urutan kartu dapat diubah; urutan kolom tetap konsisten. Jika semua pilihan dimatikan, identitas Sales tetap tampil. Pengaturan ini tidak membatasi izin akses atau isi ekspor.'})),
  num('NOTIFY_READ_RETENTION_DAYS','Masa simpan notifikasi yang sudah dibaca',0,0,3650,'hari','Nol menyimpan tanpa batas. Hanya pesan dibaca dengan outbox selesai (terkirim/dilewati) yang dihapus; pesan belum dibaca, antrean gagal dan pekerjaan bisnis tetap ada.'),
  num('AUDIT_ACTIVE_RETENTION_DAYS','Masa riwayat audit aktif',0,0,3650,'hari','Khusus perusahaan. Nol tanpa pengarsipan otomatis. Riwayat lebih lama ditandai sebagai arsip dan tetap dapat ditelusuri; bukti keputusan serta pencegah duplikasi tidak dihapus.'),
  bool('NOTIFY_REALTIME_ENABLED','Siarkan notifikasi langsung setelah transaksi berhasil',true,'Nonaktif tetap menyimpan pesan yang diizinkan pada kotak masuk. Siaran socket bukan tanda pesan sudah dibaca.'),
  num('NOTIFY_RETRY_MAX_ATTEMPTS','Batas percobaan siaran notifikasi',5,1,20,'kali','Pesan gagal tetap tersimpan. Admin dapat memeriksa dan mengulang antrean gagal.'),
  num('NOTIFY_RETRY_BASE_SECONDS','Jeda awal percobaan ulang notifikasi',10,5,3600,'detik','Jeda bertambah pada kegagalan berulang, maksimal satu jam. Mengikuti profil penerima.'),
  bool('REPORT_WEEKLY_ENABLED','Laporan mingguan'),bool('REPORT_MTD_ENABLED','Laporan bulanan'),bool('REPORT_ARCHIVE_ENABLED','Penyimpanan arsip laporan'),
  bool('REPORT_EXPORT_ENABLED','Ekspor dan cetak laporan'),bool('NOTIFY_ORDER_EVENTS','Notifikasi order'),bool('NOTIFY_REGISTRATION_EVENTS','Notifikasi registrasi'),
  bool('NOTIFY_FOLLOW_UP_EVENTS','Notifikasi tugas'),bool('NOTIFY_DELIVERY_EVENTS','Notifikasi pengiriman'),bool('NOTIFY_EXCEPTION_EVENTS','Notifikasi klarifikasi presensi'),
 ]),
];
export const POLICY_OPTION_LABELS={ACTIVE:'Aktif',PAUSED:'Jeda pekerjaan baru',OFF:'Nonaktif',IN_OUT:'Masuk dan keluar',IN_ONLY:'Masuk saja',OPTIONAL:'Tanpa presensi wajib',INHERIT:'Ikuti aturan umum',REQUIRED:'Wajib',ADMIN:'Admin',SUPERVISOR:'Supervisor',BOTH:'Admin atau Supervisor',SEQUENTIAL:'Supervisor lalu Admin',NONE:'Tanpa persetujuan manusia',BLOCK:'Blokir',REASON:'Izinkan dengan alasan',WARN:'Izinkan dengan peringatan',LOGIN:'Selama masuk aplikasi',SHIFT:'Saat shift aktif',VISIT:'Saat kunjungan aktif',TRIP:'Saat trip berjalan',AUTO:'Otomatis: Google lalu OSRM',GOOGLE:'Google',OSRM:'OpenStreetMap / OSRM'};
export const POLICY_SECRET_KEYS=['MAPS_API_KEY','BYPASS_GEOFENCE_EMAILS','JWT_EXPIRES_IN','JWT_REFRESH_EXPIRES_IN'];
export const policyGlobalOnly=key=>POLICY_SECRET_KEYS.includes(key)||key.startsWith('CODE_')||key==='AUDIT_ACTIVE_RETENTION_DAYS';
export const featureAvailable=(values,id)=>!['OFF','PAUSED'].includes(values?.[`FEATURE_${id}_MODE`]);
export const featureReadable=(values,id)=>values?.[`FEATURE_${id}_MODE`]!=='OFF';
export function visitPolicy(values={}){
 const mode=values.SALES_ATTENDANCE_MODE||'IN_OUT';
 return {mode,requireIn:mode!=='OPTIONAL',requireOut:mode==='IN_OUT',allowContinue:mode!=='IN_OUT'||values.SALES_ALLOW_CONTINUE_WITHOUT_OUT===true,
  photoIn:values.SALES_IN_PHOTO==='REQUIRED'||values.SALES_IN_PHOTO!=='OPTIONAL'&&values.ATTENDANCE_REQUIRE_PHOTO!==false,
  photoOut:values.SALES_OUT_PHOTO==='REQUIRED'||values.SALES_OUT_PHOTO!=='OPTIONAL'&&values.ATTENDANCE_REQUIRE_PHOTO!==false};
}
export function policyConflicts(values){
 const imageFormats=(values.EVIDENCE_IMAGE_FORMATS||'JPEG,PNG,WEBP').split(',').map(v=>v.trim());
 const issues=[];
 if(values.VISIT_RESULT_ATTACHMENT_MODE==='REQUIRED'&&!imageFormats.some(v=>['JPEG','PNG'].includes(v)))issues.push('Lampiran hasil kunjungan wajib memerlukan format JPEG atau PNG diizinkan.');
 if(values.DRIVER_BACKGROUND_SUBMISSION_ENABLED===true&&values.DRAFT_STORAGE_MODE!=='PERSISTENT')issues.push('Antrean otomatis bukti Driver memerlukan penyimpanan draf persisten.');
 if(values.DELIVERY_RECIPIENT_MODE==='DISABLED'&&values.DELIVERY_SIGNATURE_MODE!=='DISABLED'&&values.DELIVERY_SIGNATURE_MODE)issues.push('Tanda tangan penerima memerlukan kolom nama penerima aktif.');
 if(String(values.SHIFT_DAY_CUTOFF_TIME||'00:00')>String(values.SHIFT_START_TIME||'08:00'))issues.push('Pergantian tanggal kerja shift maksimal sama dengan jam mulai kerja.');
 if(Number(values.OUTLET_REVIEW_DAILY_BUDGET_RUPIAH)>0&&!(Number(values.OUTLET_REVIEW_ESTIMATED_CALL_RUPIAH)>0))issues.push('Batas perkiraan biaya pemeriksaan memerlukan asumsi biaya per panggilan lebih dari nol.');
 if(values.SLA_CLOCK_MODE==='BUSINESS'&&String(values.SLA_WORK_END||'17:00')<=String(values.SLA_WORK_START||'08:00'))issues.push('Akhir jam kerja SLA harus setelah awal pada hari yang sama.');
 if(Number(values.OUTLET_REVIEW_ADDRESS_CONFLICT_PERCENT??20)>=Number(values.OUTLET_REVIEW_ADDRESS_MATCH_PERCENT??60))issues.push('Ambang konflik alamat harus lebih kecil dari ambang alamat selaras.');
 if(Number(values.OUTLET_REVIEW_SUGGESTION_NAME_PERCENT??75)<Number(values.OUTLET_REVIEW_NAME_MATCH_PERCENT??70))issues.push('Ambang usulan titik minimal sama dengan ambang kecocokan nama kandidat.');
 if(Number(values.OUTLET_REVIEW_ALTERNATIVE_NAME_PERCENT??65)>Number(values.OUTLET_REVIEW_NAME_MATCH_PERCENT??70))issues.push('Ambang kandidat alternatif tidak boleh melebihi ambang kecocokan nama.');
 if(!String(values.PJP_ALLOWED_INTERVALS||'1,2,4').split(',').includes(String(values.PJP_DEFAULT_INTERVAL||'1')))issues.push('Interval awal PJP harus termasuk interval yang diizinkan.');
 if(values.REGISTRATION_APPROVAL_MODE==='SEQUENTIAL'&&values.REGISTRATION_ACTIVATOR==='SUPERVISOR')issues.push('Persetujuan berjenjang outlet memerlukan aktivasi oleh Admin.');
 if(values.SHIFT_ATTENDANCE_MODE==='OPTIONAL'&&values.ATTENDANCE_REQUIRE_ACTIVE_SHIFT===true)issues.push('Shift opsional tidak dapat menjadi prasyarat wajib kunjungan.');
 if(values.FEATURE_SHIFT_MODE!=='ACTIVE'&&values.ATTENDANCE_REQUIRE_ACTIVE_SHIFT===true)issues.push('Nonaktifkan syarat shift wajib sebelum menjeda fitur shift.');
 if(values.SALES_ATTENDANCE_MODE!=='OPTIONAL'&&values.SALES_REQUIRE_GPS===false&&values.ATTENDANCE_ENFORCE_GEOFENCE===true)issues.push('Dukung GPS opsional dengan menonaktifkan pembatas radius Sales.');
 if(values.SPV_ATTENDANCE_MODE!=='OPTIONAL'&&values.SPV_REQUIRE_GPS===false&&values.SPV_ENFORCE_GEOFENCE===true)issues.push('Pembatas radius SPV memerlukan GPS wajib.');
 if(values.DELIVERY_ATTENDANCE_MODE!=='OPTIONAL'&&values.DELIVERY_REQUIRE_GPS===false&&values.DELIVERY_REQUIRE_GEOFENCE===true)issues.push('Pembatas radius Driver memerlukan GPS wajib.');
 if(values.PACKING_SOURCE_MODE==='MANUAL'&&values.PACKING_AUTO_FROM_APPROVED_ORDER===true)issues.push('Draft otomatis dari order memerlukan sumber ORDER atau BOTH.');
 if(values.WAREHOUSE_SEPARATE_CHECKER===true&&values.WAREHOUSE_REQUIRE_CHECK===false)issues.push('Pemisahan pemeriksa memerlukan tahap pemeriksaan aktif.');
 return issues;
}
