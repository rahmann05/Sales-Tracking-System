import React from 'react';
import {unitDescription} from '../../../../../shared/product-units.mjs';
import {LuPlus,LuMinus} from 'react-icons/lu';
export function ProductOrderItem({product,qty,onQtyChange}){
  const change=value=>{const next=Number(value);if(Number.isSafeInteger(next)&&next>=0)onQtyChange(product,next-qty);};
  return <div className="sales-product"><div><p>{product.name}</p><small>Rp {Number(product.price).toLocaleString('id-ID')} / {unitDescription(product)}</small></div><div className="sales-quantity"><button type="button" aria-label={`Kurangi ${product.name}`} disabled={qty===0} onClick={()=>onQtyChange(product,-1)}><LuMinus/></button><input type="number" min="0" step="1" inputMode="numeric" aria-label={`Jumlah ${product.name}`} value={qty} onChange={e=>change(e.target.value)}/><button type="button" aria-label={`Tambah ${product.name}`} onClick={()=>onQtyChange(product,1)}><LuPlus/></button></div></div>;
}
