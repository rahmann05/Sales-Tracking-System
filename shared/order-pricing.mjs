// Match the existing rupiah tax rounding rule on both server and confirmation form.
export function orderPricing(items, taxRatePercent, taxIncluded) {
  const subtotal=items.reduce((sum,item)=>sum+Number(item.unitPrice)*Number(item.quantity),0);
  const taxAmount=Math.round(taxIncluded?subtotal*taxRatePercent/(100+taxRatePercent):subtotal*taxRatePercent/100);
  return {subtotal,taxAmount,totalValue:taxIncluded?subtotal:subtotal+taxAmount,taxRatePercent,taxIncluded};
}
