import React from 'react';

export const RouteReferenceCard = ({ route, index, isActive, onClick, outlets }) => {
  const startOutlet = outlets.find((o) => o.id === route.startOutletId);

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={`w-full min-h-[44px] text-left p-3.5 border rounded-xl cursor-pointer transition ${
        isActive
          ? 'border-[#1b66ca] bg-[#f0f6ff] ring-1 ring-[#1b66ca]'
          : 'border-slate-200 bg-white hover:border-[#7fb0f0]'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-sm text-[#01144c]">Rute {index + 1}</span>
        {isActive && (
          <span className="text-[11px] font-semibold bg-[#1b66ca] text-white px-2.5 py-0.5 rounded-full">
            Aktif
          </span>
        )}
      </div>
      <div className="text-xs text-slate-700">Mulai: {startOutlet?.name || 'Belum ditentukan'}</div>
      <div className="text-xs text-slate-500">Estimasi antartitik: {route.totalDistanceKm} km</div>
    </button>
  );
};
