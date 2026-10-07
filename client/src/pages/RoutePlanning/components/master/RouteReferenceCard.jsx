import React from 'react';

export const RouteReferenceCard = ({ route, index, isActive, onClick, outlets }) => {
    const startOutlet = outlets.find((o) => o.id === route.startOutletId);

    return (
        <button type="button" aria-pressed={isActive}
            onClick={onClick}
            className={`w-full text-left p-3 border rounded-md cursor-pointer transition ${isActive
                    ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
        >
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm">Rute {index + 1}</span>
                {isActive && (
                    <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded-full">
                        Aktif
                    </span>
                )}
            </div>
            <div className="text-xs text-gray-600">
                Mulai: {startOutlet?.name || 'Belum ditentukan'}
            </div>
            <div className="text-xs text-gray-500">
                Estimasi antartitik: {route.totalDistanceKm} km
            </div>
        </button>
    );
};
