import React, { useState } from 'react';
import { NativeDialog } from './NativeDialog';

export function EvidencePhoto({ url, label }) {
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!url) {
    return <p className="text-on-surface-variant">Foto tidak tersimpan pada catatan ini.</p>;
  }
  if (failed) {
    return <p role="alert">Foto gagal dimuat. Coba buka ulang rincian.</p>;
  }

  return (
    <>
      <button
        type="button"
        className="text-left"
        onClick={() => setExpanded(true)}
        aria-label={`Perbesar foto ${label}`}
      >
        <img
          src={url}
          alt={`Foto ${label}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-w-full w-48 max-h-56 object-contain rounded-xl border border-border-glass"
        />
        <span className="block text-xs text-primary mt-1">Perbesar foto</span>
      </button>
      {expanded && (
        <NativeDialog open title={`Foto ${label}`} onClose={() => setExpanded(false)}>
          <img
            src={url}
            alt={`Foto ${label} diperbesar`}
            className="w-full max-h-[70vh] object-contain"
          />
        </NativeDialog>
      )}
    </>
  );
}
