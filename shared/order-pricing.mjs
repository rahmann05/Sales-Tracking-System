// Match the existing rupiah tax rounding rule on both server and confirmation form.
export const TAX_ROUNDING_LABELS={NEAREST:'Rupiah terdekat',DOWN:'Bulatkan ke bawah',UP:'Bulatkan ke atas'};
export function orderPricing(items, taxRatePercent, taxIncluded,taxRoundingMode='NEAREST') {
  if(!Object.hasOwn(TAX_ROUNDING_LABELS,taxRoundingMode))throw new Error('Aturan pembulatan pajak tidak valid');
  const subtotal=items.reduce((sum,item)=>sum+Number(item.unitPrice)*Number(item.quantity),0);
  const rawTax=taxIncluded?subtotal*taxRatePercent/(100+taxRatePercent):subtotal*taxRatePercent/100;
  // Avoid a binary-float artefact rounding an exact rupiah up by one.
  const stable=Math.abs(rawTax-Math.round(rawTax))<1e-8?Math.round(rawTax):rawTax;
  const taxAmount=taxRoundingMode==='UP'?Math.ceil(stable):taxRoundingMode==='DOWN'?Math.floor(stable):Math.round(stable);
  return {subtotal,taxAmount,totalValue:taxIncluded?subtotal:subtotal+taxAmount,taxRatePercent,taxIncluded,taxRoundingMode};
}

export function priceOverrideError(catalogPrice,appliedPrice,values={}){
 if(!Number.isFinite(appliedPrice)||appliedPrice<=0)return 'Harga per unit harus lebih dari nol.';
 if(appliedPrice===catalogPrice)return null;
 if(values.SALES_ALLOW_PRICE_OVERRIDE!==true)return 'Perubahan harga katalog tidak diizinkan.';
 if(values.ORDER_PRICE_OVERRIDE_LIMIT_ENABLED!==true)return null;
 if(!(catalogPrice>0))return 'Harga katalog belum mempunyai dasar untuk batas persentase. Perbaiki katalog dahulu.';
 const discount=appliedPrice<catalogPrice,limit=Number(values[discount?'ORDER_PRICE_OVERRIDE_MAX_DISCOUNT_PERCENT':'ORDER_PRICE_OVERRIDE_MAX_MARKUP_PERCENT']??100);
 const delta=Math.abs(appliedPrice-catalogPrice)*100/catalogPrice;
 return delta>limit+1e-8?`${discount?'Penurunan':'Kenaikan'} harga maksimal ${limit}% dari harga katalog.`:null;
}
