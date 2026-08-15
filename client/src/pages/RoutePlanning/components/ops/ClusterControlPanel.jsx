import React from 'react';
import { RouteReferenceCard } from './RouteReferenceCard';
import { OutletListPanel } from './OutletListPanel';

const WIZARD_STEPS = [
    { num: 1, label: 'Info Dasar' },
    { num: 2, label: 'Area & Rute' },
    { num: 3, label: 'Sales' },
    { num: 4, label: 'Simpan' },
];

/**
 * ClusterControlPanel — Right-side 40% panel for the Create Cluster wizard.
 * Contains wizard progress bar + step forms.
 */
export const ClusterControlPanel = ({
    step = 1,
    // Step 1 (no cluster name here – moved to step 5)
    clusterRegion = '',
    setClusterRegion = () => { },
    clusterColor = '#3b82f6',
    setClusterColor = () => { },
    // Step 2
    outletCount = 10,
    setOutletCount = () => { },
    selectedOutlets = [],
    onToggleOutlet = () => { },
    // Step 3
    routes = [],
    activeRouteIndex = 0,
    onSelectRoute = () => { },
    allOutlets = [],
    // Step 4
    salesUsers = [],
    assignedSalesId = '',
    setAssignedSalesId = () => { },
    // Step 5 – cluster name editable at end
    clusterName = '',
    setClusterName = () => { },
    // Navigation
    onNext = () => { },
    onBack = () => { },
    onSave = () => { },
    isSaving = false,
    onCancel = () => { },
    isGeneratingRoutes = false,
}) => {
    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-hidden pr-2 md:pr-4">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Buat Cluster Baru</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    Langkah {step} dari {WIZARD_STEPS.length}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-1">
                    {WIZARD_STEPS.map((s) => (
                        <React.Fragment key={s.num}>
                            <div
                                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${step >= s.num
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {s.num}
                            </div>
                            {s.num < WIZARD_STEPS.length && (
                                <div
                                    className={`flex-1 h-0.5 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex justify-between mt-1">
                    {WIZARD_STEPS.map((s) => (
                        <span
                            key={s.num}
                            className={`text-[9px] ${step >= s.num ? 'text-blue-600 font-semibold' : 'text-gray-400'
                                }`}
                        >
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* STEP 1: Region & Color only (name auto-generated at final step) */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700 font-medium">
                                Nama cluster akan di-generate otomatis dari region dan sales yang dipilih. Anda bisa mengeditnya sebelum menyimpan.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Region / Wilayah <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={clusterRegion}
                                onChange={(e) => setClusterRegion(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="">— Pilih Wilayah —</option>
                                <option value="Cimahi">Cimahi</option>
                                <option value="Bandung Barat">Bandung Barat</option>
                                <option value="Perbatasan Bandung Barat">Perbatasan Bandung Barat</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Warna Penanda
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={clusterColor}
                                    onChange={(e) => setClusterColor(e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                                />
                                <span className="text-sm text-gray-600">{clusterColor}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Area & Route merged */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Outlet
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={outletCount}
                                onChange={(e) => setOutletCount(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 font-medium">
                                Klik pada peta untuk memilih titik pusat area cluster.
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Sistem akan otomatis memilih {outletCount} outlet terdekat dan membuatkan rekomendasi rute.
                            </p>
                        </div>

                        {selectedOutlets.length > 0 && (
                            <>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-2">
                                        Pilih Rute Alternatif
                                    </p>
                                    {isGeneratingRoutes ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <p className="text-xs font-medium">Menghitung rute optimal dengan AI...</p>
                                        </div>
                                    ) : routes.length > 0 ? (
                                        <div className="space-y-2">
                                            {routes.map((route, idx) => (
                                                <RouteReferenceCard
                                                    key={idx}
                                                    route={route}
                                                    index={idx}
                                                    isActive={idx === activeRouteIndex}
                                                    onClick={() => onSelectRoute(idx)}
                                                    outlets={allOutlets}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Mengkalkulasi rute...</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Outlet Terpilih ({selectedOutlets.length})
                                    </p>
                                    <OutletListPanel
                                        outlets={selectedOutlets}
                                        selectedIds={selectedOutlets.map((o) => o.id)}
                                        onToggle={onToggleOutlet}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* STEP 3: Assign Sales */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign ke Sales
                            </label>
                            <select
                                value={assignedSalesId}
                                onChange={(e) => setAssignedSalesId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="">— Pilih Sales —</option>
                                {salesUsers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-500">
                                Sales yang di-assign akan bertanggung jawab atas seluruh outlet dalam cluster ini.
                                Anda dapat mengubahnya nanti.
                            </p>
                        </div>
                    </div>
                )}

                {/* STEP 4: Review & Save */}
                {step === 4 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Nama Cluster
                                <span className="ml-2 text-xs font-normal text-gray-400">(dapat diedit)</span>
                            </label>
                            <input
                                type="text"
                                value={clusterName}
                                onChange={(e) => setClusterName(e.target.value)}
                                placeholder="Nama cluster..."
                                className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Auto-generated dari region &amp; sales. Edit sesuai kebutuhan.</p>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">Ringkasan Cluster</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Region:</span>
                                <span className="font-medium">{clusterRegion || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Warna:</span>
                                <span
                                    className="inline-block w-5 h-5 rounded border border-gray-300"
                                    style={{ backgroundColor: clusterColor }}
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Outlet:</span>
                                <span className="font-medium">{selectedOutlets.length} outlet</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Rute Aktif:</span>
                                <span className="font-medium">Rute {activeRouteIndex + 1}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Sales:</span>
                                <span className="font-medium">
                                    {salesUsers.find((s) => s.id === assignedSalesId)?.name || 'Belum dipilih'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={step === 1 ? onCancel : onBack}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    {step === 1 ? 'Batal' : 'Kembali'}
                </button>

                {step < WIZARD_STEPS.length ? (
                    <button
                        type="button"
                        onClick={onNext}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        Lanjut
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Menyimpan…</span>
                            </>
                        ) : (
                            <span>Simpan Cluster</span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
