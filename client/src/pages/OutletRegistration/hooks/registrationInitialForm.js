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
  visitDays: ['SENIN'],
  outletKnownBy: ''
};

/**
 * useOutletRegistrationForm Hook
 * Single Responsibility: Manage form state, automatic GPS/Google Places autofill, lock/unlock mechanics, and submission.
 */
