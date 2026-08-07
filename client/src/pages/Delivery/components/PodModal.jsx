import React, { useState } from 'react';
import { LuDollarSign, LuCamera, LuCheck } from 'react-icons/lu';
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
  const [photoProof, setPhotoProof] = useState(null);

  if (!stop) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmitPOD({
      deliveryStopId: stop.id,
      signature: signatureData || 'mock_signature_data_url',
      photo: photoProof || null,
      cashCollected: Number(cashCollected),
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="modal-header">
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

        {/* Photo Proof Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-on-surface">Foto Serah Terima Barang:</label>
          {photoProof ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-border-glass">
              <img src={photoProof} alt="Bukti Kirim" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => setPhotoProof(null)}
                  className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[11px] font-semibold hover:bg-black/80 transition-all"
                >
                  Ubah Foto
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5">
                <LuCheck className="text-xs text-emerald-400" />
                <span>Foto Serah Terima Terunggah</span>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-border-glass hover:border-primary/50 bg-surface-variant/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5 group">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <LuCamera className="text-lg" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-on-surface block">Ambil Foto Serah Terima</span>
                <span className="text-[11px] text-on-surface-variant">Klik untuk membuka kamera</span>
              </div>
            </label>
          )}
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
