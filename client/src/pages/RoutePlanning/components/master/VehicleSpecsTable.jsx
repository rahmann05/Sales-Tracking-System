import React from 'react';
import { LuTruck, LuPencil, LuTrash2 } from 'react-icons/lu';

export const VehicleSpecsTable = ({ vehicles = [], onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto mobile-card-table-wrapper">
        <table className="w-full text-left border-collapse mobile-card-table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
              <th className="p-4 font-semibold">Kode</th>
              <th className="p-4 font-semibold">Nama Kendaraan</th>
              <th className="p-4 font-semibold">Kapasitas Muatan</th>
              <th className="p-4 font-semibold">Spesifikasi BBM</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  Belum ada data kendaraan logistik yang terdaftar.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td data-label="Kode" className="p-4 font-mono text-gray-700">{v.code}</td>
                  <td data-label="Kendaraan" className="p-4">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <LuTruck className="text-gray-400" />
                      {v.name}
                    </div>
                  </td>
                  <td data-label="Kapasitas" className="p-4">
                    <div className="text-gray-900 font-medium">{v.maxCartons} Karton</div>
                    <div className="text-xs text-gray-500">{v.maxWeightKg} Kg</div>
                  </td>
                  <td data-label="BBM" className="p-4">
                    <div className="text-gray-900 font-medium">{v.fuelKmPerLiter} Km/L</div>
                    <div className="text-xs text-gray-500">
                      {v.fuelType} (Rp {v.fuelPricePerLiter.toLocaleString('id-ID')})
                    </div>
                  </td>
                  <td data-label="Status" className="p-4">
                    {v.isActive ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center mobile-full-width">
                    <div className="flex items-center justify-center gap-2 w-full">
                      <button 
                        onClick={() => onEdit && onEdit(v)}
                        className="flex-1 md:flex-initial py-2 md:py-1.5 px-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Edit Kendaraan"
                      >
                        <LuPencil /> Edit
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Hapus kendaraan ${v.name}?`)) {
                            onDelete && onDelete(v.id);
                          }
                        }}
                        className="flex-1 md:flex-initial py-2 md:py-1.5 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Hapus Kendaraan"
                      >
                        <LuTrash2 /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
