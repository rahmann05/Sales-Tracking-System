// Business surfaces affected by rules. This registry does not grant authorization.
export const POLICY_SURFACES = [
 {id:'accounts',label:'Akun, tim dan hak akses',prefixes:['JWT_','FEATURE_']},
 {id:'shift',label:'Presensi shift dan laporan kehadiran',prefixes:['SHIFT_','ATTENDANCE_REQUIRE_ACTIVE_SHIFT']},
 {id:'sales',label:'Kunjungan, hasil dan order Sales',prefixes:['SALES_','ATTENDANCE_','MINIMUM_VISIT_','OFF_PJP_','MANUAL_SALES_','COLLECTION_','OUTLET_FIELD_','OUTLET_GOOGLE_LOCATION_']},
 {id:'supervision',label:'Kunjungan dan tindak lanjut SPV',prefixes:['OUTLET_GOOGLE_LOCATION_','SPV_','FOLLOW_UP_','OUTLET_FIELD_']},
 {id:'planner',label:'Wilayah, template dan planner tanggal',prefixes:['OUTLET_GOOGLE_LOCATION_','PJP_','OUTLET_FIELD_PJP_','CLUSTER_','DEFAULT_ITINERARY']},
 {id:'registration',label:'Pengajuan, revisi dan aktivasi outlet',prefixes:['REGISTRATION_','DEFAULT_BRANCH','DEFAULT_OUTLET_','OUTLET_DUPLICATE_']},
 {id:'outlet',label:'Master dan pemeriksaan opsional outlet',prefixes:['OUTLET_','VALIDATION_']},
 {id:'order',label:'Order, persetujuan dan pemenuhan',prefixes:['ORDER_','DEFAULT_PAYMENT_','DEFAULT_TERM_']},
 {id:'packing',label:'Packing dan dokumen faktur',prefixes:['PACKING_','INVOICE_']},
 {id:'warehouse',label:'Penyiapan, keberangkatan dan penutupan trip',prefixes:['WAREHOUSE_','TRIP_','DELIVERY_']},
 {id:'driver',label:'Tujuan, bukti dan hasil pengiriman Driver',prefixes:['OUTLET_GOOGLE_LOCATION_','DELIVERY_','DRIVER_']},
 {id:'vehicle',label:'Armada, pengingat dan catatan servis',prefixes:['VEHICLE_','OIL_','BRAKE_']},
 {id:'location',label:'Peta, GPS dan pencarian alamat',prefixes:['OUTLET_GOOGLE_LOCATION_','TRACKING_','GPS_','LIVE_TRACKING_','ROUTING_','PLACE_LOOKUP_','MAPS_']},
 {id:'reports',label:'Laporan, arsip dan ekspor',prefixes:['REPORT_','TRAVEL_GAP_']},
 {id:'attention',label:'Antrean perhatian dan notifikasi',prefixes:['SLA_','NOTIFY_','NOTIFICATIONS_','AUDIT_']},
 {id:'references',label:'Master referensi dan nomor dokumen',prefixes:['CODE_','DEFAULT_PRODUCT_','DEFAULT_CUSTOMER_']},
 {id:'drafts',label:'Draf formulir dan pengiriman ulang',prefixes:['DRAFT_']},
];
export function affectedSurfaces(values={}) {
 const keys=Object.keys(values);
 return POLICY_SURFACES.map(surface=>({...surface,keys:keys.filter(key=>surface.prefixes.some(prefix=>key.startsWith(prefix)))})).filter(surface=>surface.keys.length);
}
