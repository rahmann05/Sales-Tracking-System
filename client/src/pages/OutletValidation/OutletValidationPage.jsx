import React from 'react';
import { OutletValidationPanel } from './components/OutletValidationPanel';
import '../../styles/pages/OutletWorkspace.css';
import '../../styles/pages/OutletValidation.css';

export function OutletValidationPage() {
  return (
    <main className="workspace-page outlet-workspace">
      <header className="outlet-page-heading">
        <div>
          <p className="outlet-eyebrow">Pelanggan / Pemeriksaan opsional</p>
          <h1>Validasi outlet</h1>
          <p>
            Cocokkan data dengan Google, tinjau perbedaan, atau tugaskan pemeriksaan lapangan.
          </p>
        </div>
      </header>
      <OutletValidationPanel />
    </main>
  );
}
