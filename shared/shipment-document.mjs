export const shipmentDocumentLabel=document=>document?.documentKind==='MANIFEST'?'Manifest pengiriman':'Packing list';
export function shipmentInvoiceRequired(document,values=document?.policySnapshot?.values||{}){
 return document?.documentKind==='MANIFEST'?values.MANIFEST_REQUIRE_INVOICE===true:values.PACKING_REQUIRE_INVOICE!==false;
}
export function shipmentReady(document,values){
 const invoices=document.invoices||[];
 if(document.loadPlanVersion===2){
  if(!document.destinations?.length||document.destinations.some(destination=>!destination.point||destination.totalCartons<=0||!document.items?.some(item=>item.destinationId===destination.id)))return false;
  for(const destination of document.destinations){
   const attached=invoices.filter(invoice=>invoice.destinationId===destination.id);
   if(shipmentInvoiceRequired(document,values)&&!attached.length)return false;
   if(attached.length&&(attached.some(invoice=>invoice.totalCartons<=0)||attached.reduce((sum,invoice)=>sum+invoice.totalCartons,0)!==destination.totalCartons))return false;
  }
 }
 return document.totalCartons>0&&document.items?.length>0&&(!shipmentInvoiceRequired(document,values)||invoices.length>0)&&(!invoices.length||invoices.reduce((n,i)=>n+i.totalCartons,0)===document.totalCartons);
}
