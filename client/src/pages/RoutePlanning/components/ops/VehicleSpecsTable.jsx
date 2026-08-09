import React from 'react';
import { LuTruck, LuPencil, LuTrash2 } from 'react-icons/lu';

export const VehicleSpecsTable = ({ vehicles = [], onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
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
                  <td className="p-4 font-mono text-gray-700">{v.code}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <LuTruck className="text-gray-400" />
                      {v.name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{v.maxCartons} Karton</div>
                    <div className="text-xs text-gray-500">{v.maxWeightKg} Kg</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{v.fuelKmPerLiter} Km/L</div>
                    <div className="text-xs text-gray-500">
                      {v.fuelType} (Rp {v.fuelPricePerLiter.toLocaleString('id-ID')})
                    </div>
                  </td>
                  <td className="p-4">
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
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit && onEdit(v)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Kendaraan"
                      >
                        <LuPencil />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Hapus kendaraan ${v.name}?`)) {
                            onDelete && onDelete(v.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Hapus Kendaraan"
                      >
                        <LuTrash2 />
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
