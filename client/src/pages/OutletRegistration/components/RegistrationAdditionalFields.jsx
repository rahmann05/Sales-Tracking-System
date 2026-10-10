import React from 'react';
import {REGISTRATION_FIELDS,requiredRegistrationFields} from '../../../../../shared/registration-fields.mjs';
export function RegistrationAdditionalFields({formData,updateField,settings}){
 const required=requiredRegistrationFields(formData.revisionPolicyValues?.REGISTRATION_SUBMIT_REQUIRED_FIELDS??settings.REGISTRATION_SUBMIT_REQUIRED_FIELDS??'');
 return <div className="sales-registration-fields">{['address2','address3','city','bankAccountInfo','outletKnownBy'].map(key=><label className="sales-registration-field" key={key}>{REGISTRATION_FIELDS[key]} {required.includes(key)?'(wajib)':'(opsional)'}<input required={required.includes(key)} maxLength={2000} value={formData[key]||''} onChange={e=>updateField(key,e.target.value)}/></label>)}</div>;
}
