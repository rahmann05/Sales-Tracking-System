// Zero is a valid TOP term; a CASH outlet's zero is not a TOP agreement.
export function orderTerms(paymentType,outlet={},defaultDays=30){
 return paymentType==='TOP'?(outlet.paymentType==='TOP'?outlet.termOfPaymentDays??defaultDays:defaultDays):0;
}
