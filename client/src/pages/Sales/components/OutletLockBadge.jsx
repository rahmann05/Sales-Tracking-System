import React from 'react';
import { LuLock } from 'react-icons/lu';

/**
 * OutletLockBadge Component
 * Single Responsibility: Display locked outlet notification with button to request unlock from Admin.
 */
export const OutletLockBadge = ({ lockReason, onRequestUnlock, stop }) => (
  <section className="sales-lock" aria-label="Absen outlet terkunci">
    <div className="sales-lock-copy">
      <h3>
        <LuLock aria-hidden="true" />
        Absen outlet terkunci
      </h3>
      <p>{lockReason}</p>
    </div>
    <button type="button" className="app-button" onClick={() => onRequestUnlock(stop)}>
      Ajukan pengecualian presensi
    </button>
  </section>
);
