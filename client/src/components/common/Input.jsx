import React from 'react';
import { FiSearch } from 'react-icons/fi';
import '../../styles/common/Input.css';

/**
 * Modular Search & Text Input Component
 * Separated CSS into Input.css
 */
export const Input = ({
  value,
  onChange,
  placeholder = 'Search...',
  icon: IconComponent = FiSearch,
  className = '',
}) => {
  return (
    <div className={`input-container ${className}`}>
      {IconComponent && <IconComponent className="input-icon" />}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
};
