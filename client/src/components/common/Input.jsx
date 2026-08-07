import React from 'react';
import { FiSearch } from 'react-icons/fi';
import '../../styles/common/Input.css';

/**
 * Modular Search & Text Input Component
 * Separated CSS into Input.css
 */
export const Input = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = 'Search...',
  icon: IconComponent = FiSearch,
  className = '',
  containerClassName = '',
  required = false,
  ...rest
}) => {
  return (
    <div className={`input-group ${containerClassName}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${className}`}>
      {IconComponent && <IconComponent className="input-icon" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
        {...rest}
      />
    </div>
  </div>
  );
};
