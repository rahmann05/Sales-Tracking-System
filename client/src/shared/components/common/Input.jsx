import React, { useId } from 'react';
import { FiSearch } from 'react-icons/fi';

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
  id,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={`input-group ${containerClassName}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className={`input-container ${className}`}>
        {IconComponent && <IconComponent className="input-icon" />}
        <input
          id={inputId}
          aria-label={!label ? (rest['aria-label'] || placeholder) : undefined}
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
