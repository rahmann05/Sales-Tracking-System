import React, { useState } from 'react';
import { LuUser } from 'react-icons/lu';

/**
 * Modular Avatar Component
 * Handles image avatar with smooth initials / icon fallback
 */
export const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Get initials from name
  const initials = name
    ? name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : '';

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setHasError(true)}
        className={`rounded-2xl object-cover shrink-0 select-none ${currentSizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 select-none ${currentSizeClass} ${className}`}
      title={name}
    >
      {initials ? <span>{initials}</span> : <LuUser className="text-base" />}
    </div>
  );
};
