export const activeVisitStatuses=['ARRIVED','IN_VISIT','ORDERED'];
export const completedVisitStatuses=['VISITED','COMPLETED'];
export const visitStatusLabel=status=>({PENDING:'Belum dikunjungi',ARRIVED:'Sedang dikunjungi',IN_VISIT:'Sedang dikunjungi',ORDERED:'Order dibuat · belum keluar',VISITED:'Selesai',COMPLETED:'Selesai',CLOSED:'Toko tutup / dilaporkan',CLOSED_REPORTED:'Menunggu keputusan toko tutup',SKIPPED:'Dilewati'})[status]||status||'Belum tersedia';
export const orderStatusLabel=status=>({PENDING_APPROVAL:'Menunggu keputusan',PENDING:'Menunggu keputusan',APPROVED:'Disetujui',REJECTED:'Ditolak'})[status]||status||'Belum tersedia';
export const fulfillmentLabel=status=>({OPEN:'Belum terpenuhi',PARTIAL:'Diterima sebagian',FULFILLED:'Terpenuhi',CLOSED_WITH_CANCELLATION:'Ditutup dengan pembatalan'})[status]||status||'Belum tersedia';
export const stampWib=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+' WIB':'Belum tercatat';
