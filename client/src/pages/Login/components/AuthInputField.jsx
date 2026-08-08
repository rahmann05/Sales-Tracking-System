import React from 'react';

/**
 * AuthInputField Component
 * Single Responsibility: Render a single labeled input with icon for auth forms.
 */
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
        {IconComponent && <IconComponent className="login-input-icon" />}
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
