import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiSettings } from 'react-icons/fi';
import { configApi } from '../../../../services/api';

export const LogisticsConfigModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    pricePerCarton: 0,
    grossMarginPercent: 0,
    baseDropCost: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchConfig = async () => {
        setIsLoading(true);
        try {
          const res = await configApi.getByKey('LOGISTICS_METRICS');
          if (res.data) {
            setFormData({
              pricePerCarton: res.data.pricePerCarton || 0,
              grossMarginPercent: res.data.grossMarginPercent || 0,
              baseDropCost: res.data.baseDropCost || 0,
            });
          }
        } catch (error) {
          console.error('Failed to load logistics config', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchConfig();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await configApi.updateByKey('LOGISTICS_METRICS', formData);
      onClose(true); // pass true to indicate success
    } catch (error) {
      console.error('Failed to save config', error);
      alert('Gagal menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Parameter Logistik</h2>
          </div>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Rata-rata per Karton (Rp)
                </label>
                <input
                  type="number"
                  name="pricePerCarton"
                  value={formData.pricePerCarton}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Estimasi nilai Rupiah untuk 1 karton FMCG.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margin Kotor Distributor (%)
                </label>
                <input
                  type="number"
                  name="grossMarginPercent"
                  value={formData.grossMarginPercent}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biaya Operasional per Drop (Rp)
                </label>
                <input
                  type="number"
                  name="baseDropCost"
                  value={formData.baseDropCost}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Komponen biaya BBM/Kuli per lokasi pengiriman.</p>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : (
                <>
                  <FiSave className="w-4 h-4" />
                  Simpan Parameter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
