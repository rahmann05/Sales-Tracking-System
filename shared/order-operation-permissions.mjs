export const ORDER_OPERATION_PERMISSIONS={
 PROMISE:{key:'can_set_order_promise',label:'Ubah janji pengiriman order',desc:'Khusus Admin; perubahan tanggal dan alasan masuk riwayat order.'},
 CANCEL_REMAINDER:{key:'can_cancel_order_remainder',label:'Batalkan sisa order',desc:'Khusus Admin; hanya jumlah yang belum dipacking, mengikuti aturan order.'},
 ASSIGN_REVIEW:{key:'can_assign_order_review',label:'Tugaskan pemeriksa order',desc:'Khusus Admin dengan izin approval; tahap, tim dan izin pemeriksa tetap diperiksa.'},
};
export function canOrderOperation(actor,action){
 const permission=ORDER_OPERATION_PERMISSIONS[action];
 if(!permission||actor?.role!=='ADMIN'||actor.deletedAt)return false;
 if(action==='ASSIGN_REVIEW'&&actor.permissions?.can_approve_order===false)return false;
 // Older templates retain their existing access until explicitly restricted.
 return actor.permissions?.[permission.key]!==false;
}
