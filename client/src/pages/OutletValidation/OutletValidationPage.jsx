import React from 'react';
import {OutletValidationPanel} from './components/OutletValidationPanel';
import '../../styles/pages/OutletWorkspace.css';
export function OutletValidationPage() {
 return <main className="workspace-page outlet-workspace"><header className="outlet-page-heading"><div><p className="outlet-eyebrow">Pelanggan / Pemeriksaan opsional</p><h1>Pemeriksaan lokasi outlet</h1><p>Tinjau data lama atau data yang diragukan, bandingkan bukti, lalu catat keputusan yang dapat ditelusuri.</p></div></header><OutletValidationPanel/></main>;
}
