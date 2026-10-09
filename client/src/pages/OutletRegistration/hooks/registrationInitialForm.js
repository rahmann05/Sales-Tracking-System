export const INITIAL_FORM = {
  division: 'BELFOODS',
  branch: 'PADALARANG',
  name: '',
  ownerName: '',
  address: '',
  address2: '',
  address3: '',
  phone: '',
  locationType: 'PINGGIR_JALAN',
  mappingLocation: '',
  taxType: 'NON_PKP',
  taxNumber: '',
  taxName: '',
  taxAddress: '',
  taxDocumentUrl: '',
  area: 'CIMAHI',
  subAreaKecamatan: '',
  kelurahan: '',
  city: 'CIMAHI',
  latitude: null,
  longitude: null,
  photoUrl: '',
  channel: 'GENERAL_TRADE',
  subChannel: 'TOKO_RETAIL',
  channelTier: 'BRONZE_C',
  paymentType: 'CASH',
  cashMethod: 'TUNAI',
  termOfPaymentDays: 0,
  bankAccountInfo: '',
  visitWeekSchedule: 'ALL_WEEK',
  visitIntervalWeeks:1,
  visitDays: ['SENIN'],
  outletKnownBy: ''
};
export const registrationDefaults=values=>({...INITIAL_FORM,division:values.ACTIVE_DIVISION||INITIAL_FORM.division,branch:values.DEFAULT_BRANCH??INITIAL_FORM.branch,paymentType:values.DEFAULT_PAYMENT_TYPE||'CASH',termOfPaymentDays:values.DEFAULT_TERM_OF_PAYMENT_DAYS??30,visitIntervalWeeks:Number(values.PJP_DEFAULT_INTERVAL||1)});

/**
 * useOutletRegistrationForm Hook
 * Single Responsibility: Manage form state, automatic GPS/Google Places autofill, lock/unlock mechanics, and submission.
 */
