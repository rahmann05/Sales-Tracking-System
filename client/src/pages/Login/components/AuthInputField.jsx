import React from 'react';

export const AuthInputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: IconComponent,
  required = true,
}) => {
  return (
    <div className="login-field-group">
      <label className="login-label">{label}</label>
      <div className="login-input-box">
        {IconComponent && <IconComponent className="text-on-surface-variant mr-3 text-lg" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="login-input"
        />
      </div>
    </div>
  );
};
