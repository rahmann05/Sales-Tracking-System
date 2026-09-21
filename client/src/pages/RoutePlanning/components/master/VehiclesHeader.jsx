import React, { useState } from 'react';
import { LuPlus, LuSettings } from 'react-icons/lu';
import { LogisticsConfigModal } from './LogisticsConfigModal';

export const VehiclesHeader = ({ onOpenCreateModal }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Kelola Armada & Spesifikasi Kendaraan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Atur kapasitas muatan (karton/kg) dan konsumsi BBM untuk algoritma Logistics Optimizer.
        </p>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={() => setIsConfigOpen(true)}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          <LuSettings className="text-lg" />
          Parameter Logistik
        </button>
        <button
          onClick={onOpenCreateModal}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <LuPlus className="text-lg" />
          Tambah Kendaraan
        </button>
      </div>

      <LogisticsConfigModal 
        isOpen={isConfigOpen} 
        onClose={(success) => {
          setIsConfigOpen(false);
          if (success) {
            // Optional: you can trigger a reload or show toast
            window.location.reload(); 
          }
        }} 
      />
    </div>
  );
};
