import React from 'react';
import {
  DEFAULT_REGISTRATION_SUBMIT_REQUIRED_FIELDS,
  REGISTRATION_FIELDS,
  requiredRegistrationFields,
} from '../../../../../shared/registration-fields.mjs';

export function RegistrationAdditionalFields({ formData, updateField, settings }) {
  const required = requiredRegistrationFields(
    formData.revisionPolicyValues?.REGISTRATION_SUBMIT_REQUIRED_FIELDS ??
      settings.REGISTRATION_SUBMIT_REQUIRED_FIELDS ??
      DEFAULT_REGISTRATION_SUBMIT_REQUIRED_FIELDS
  );
  return (
    <div className="noo-field-grid">
      {['address2', 'address3', 'city', 'bankAccountInfo', 'outletKnownBy'].map((key) => {
        const isRequired = required.includes(key);
        return (
          <label className="noo-field" key={key}>
            <span>
              {REGISTRATION_FIELDS[key]}
              {isRequired ? <span className="noo-req" aria-hidden="true"> *</span> : null}
            </span>
            <input
              required={isRequired}
              maxLength={2000}
              value={formData[key] || ''}
              onChange={(e) => updateField(key, e.target.value)}
            />
          </label>
        );
      })}
    </div>
  );
}
