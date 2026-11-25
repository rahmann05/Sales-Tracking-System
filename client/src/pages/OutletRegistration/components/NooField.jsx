import React from 'react';

/**
 * Isian "LABEL : ........" dengan kontrol di kanan. Label membungkus kontrol sehingga dapat
 * diklik. `required` menampilkan tanda *, `hint` keterangan kecil, `error` pesan validasi.
 */
export function NooField({ label, required = false, hint, error, children }) {
  return (
    <label className="npf-field">
      <span>
        {label}
        {required && (
          <span className="npf-req" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </span>
      <span aria-hidden="true">:</span>
      <span>
        {children}
        {hint && <small className="npf-hint">{hint}</small>}
        {error && (
          <span role="alert" className="npf-error">
            {error}
          </span>
        )}
      </span>
    </label>
  );
}
