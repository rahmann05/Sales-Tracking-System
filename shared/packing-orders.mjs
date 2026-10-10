export function packingOrderIds(packing){
 return [...new Set([...(packing.sourceOrderIds||[]),packing.sourceOrderId].filter(Boolean))];
}
export const packingOrderWhere=ids=>({OR:[{sourceOrderId:{in:ids}},{sourceOrderIds:{hasSome:ids}}]});
export function packingSourceIds(data){
 const ids=[...(data.sourceOrderIds||[])];
 if(data.sourceOrderId&&!ids.includes(data.sourceOrderId))ids.push(data.sourceOrderId);
 if(new Set(ids).size!==ids.length)throw new Error('Order sumber tidak boleh dipilih dua kali.');
 return ids.sort();
}
