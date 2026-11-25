import React from 'react';

/** Satu baris isian formulir: label berlatar abu-abu di kiri, nilai di kanan, bergaris tipis. */
export function NooDocumentFact({ label, wide = false, children }) {
  return (
    <div className="doc-field" data-wide={wide}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
