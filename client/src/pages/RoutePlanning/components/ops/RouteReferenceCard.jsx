import React from 'react';

export const RouteReferenceCard = ({ route, index, isActive, onClick, outlets }) => {
    const startOutlet = outlets.find((o) => o.id === route.startOutletId);

    return (
        <div
            onClick={onClick}
            className={`p-3 border rounded-md cursor-pointer transition ${isActive
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
        >
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm">Rute {index + 1}</span>
                {isActive && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Aktif
                    </span>
                )}
            </div>
            <div className="text-xs text-gray-600">
                Start: {startOutlet?.name || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500">
                Jarak: {route.totalDistanceKm} km
            </div>
        </div>
    );
};
