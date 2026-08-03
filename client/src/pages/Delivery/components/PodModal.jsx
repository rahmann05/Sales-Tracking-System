import React, { useState } from 'react';
import { LuDollarSign, LuCamera } from 'react-icons/lu';
import { FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { SignatureCanvas } from '../../../components/common/SignatureCanvas';
import { HelperChecklist } from './HelperChecklist';

/**
 * PodModal Component (Single Responsibility: Proof of Delivery Modal for Driver & Helper)
 * 1 File per Component
 */
export const PodModal = ({ stop, onClose, onSubmitPOD }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [cashCollected, setCashCollected] = useState(stop?.paymentType === 'COD' ? stop.totalAmount : 0);
  const [photoProof] = useState('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400');

  if (!stop) return null;

  const handleSubmit = () => {
    onSubmitPOD({
      deliveryStopId: stop.id,
      signature: signatureData || 'mock_signature_data_url',
      photo: photoProof,
      cashCollected: Number(cashCollected),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Proof of Delivery (POD)</h3>
            <p className="text-xs text-on-surface-variant">Outlet: {stop.outletName} • Order #{stop.orderId}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* Helper Physical Verification */}
        <HelperChecklist itemsCount={stop.itemsCount} />

        {/* Payment Collection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface flex items-center justify-between">
            <span>Penerimaan Pembayaran COD / Tunai:</span>
            <span className="text-xs text-blue-600 uppercase font-semibold">{stop.paymentType}</span>
          </label>
          <div className="relative">
            <LuDollarSign className="absolute left-3 top-3 text-on-surface-variant text-base" />
            <input
              type="number"
              value={cashCollected}
              onChange={(e) => setCashCollected(e.target.value)}
              placeholder="Jumlah tunai diterima"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-glass bg-surface text-xs font-bold text-on-surface"
            />
          </div>
        </div>

        {/* Signature Canvas Class Component Integration */}
        <SignatureCanvas onSaveSignature={setSignatureData} />

        {/* Photo Proof Simulation */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-on-surface">Foto Serah Terima Barang:</label>
          <div className="relative rounded-2xl overflow-hidden aspect-video border border-border-glass">
            <img src={photoProof} alt="Bukti Kirim" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5">
              <LuCamera className="text-xs text-primary" />
              <span>Foto Muatan Diterima Toko</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <FiCheckCircle className="text-base" />
          <span>Selesaikan Pengiriman & Absen Out Drop Point</span>
        </button>
      </div>
    </div>
  );
};
