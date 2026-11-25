import React from 'react';

/**
 * Pilihan bertanda V seperti pada formulir kertas: label lalu kotak. Memakai input asli
 * (radio / checkbox) sehingga tetap dapat diakses dengan keyboard dan pembaca layar.
 * `spread` mendorong kotak ke tepi kanan kolom, seperti daftar pilihan pada formulir.
 */
export function NooTick({
  type = 'radio',
  name,
  checked,
  onChange,
  label,
  disabled = false,
  required = false,
  spread = false,
  strong = false,
}) {
  return (
    <label className="npf-tick" data-spread={spread} data-strong={strong}>
      <span>{label}</span>
      <input
        type={type}
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
    </label>
  );
}
