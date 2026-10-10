export const VISIT_REVIEW_PERMISSIONS={
 OFF_PJP:{key:'can_review_off_pjp',label:'Putuskan kunjungan luar PJP',desc:'Admin atau Supervisor tim; validasi kunjungan terpisah dari hasil penjualan manual.'},
 MANUAL_SALES:{key:'can_review_manual_sales',label:'Putuskan hasil penjualan manual',desc:'Admin atau Supervisor tim; tidak membuat order, stok, atau penerimaan pembayaran.'},
};
export function canReviewVisit(actor,action,applicantId){
 const permission=VISIT_REVIEW_PERMISSIONS[action];
 return Boolean(permission&&actor&&!actor.deletedAt&&['ADMIN','SUPERVISOR'].includes(actor.role)&&actor.permissions?.[permission.key]!==false&&(!applicantId||actor.id!==applicantId));
}
