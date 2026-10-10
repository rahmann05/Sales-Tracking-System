export const shipmentDocumentLabel=document=>document?.documentKind==='MANIFEST'?'Manifest pengiriman':'Packing list';
export function shipmentInvoiceRequired(document,values=document?.policySnapshot?.values||{}){
 return document?.documentKind==='MANIFEST'?values.MANIFEST_REQUIRE_INVOICE===true:values.PACKING_REQUIRE_INVOICE!==false;
}
export function shipmentReady(document,values){
 const invoices=document.invoices||[];
 return document.totalCartons>0&&document.items?.length>0&&(!shipmentInvoiceRequired(document,values)||invoices.length>0)&&(!invoices.length||invoices.reduce((n,i)=>n+i.totalCartons,0)===document.totalCartons);
}
