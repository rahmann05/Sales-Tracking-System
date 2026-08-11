import React, { useState, useEffect, useRef } from 'react';
import { useMapData } from '../../../context/MapDataContext';
import { apiService, clustersApi, usersApi } from '../../../services/api';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { FaTimes, FaMapMarkerAlt, FaUsers, FaRoute, FaCheck } from 'react-icons/fa';

export const ClusterBuilder = ({ mapState, setMapState, setMapHandlers, onClose }) => {
  const { outlets, clusters, salesUsers, invalidate } = useMapData();
  const [step, setStep] = useState(1); // 1: Setup, 2: Map Selection, 3: Review
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    colorHex: '#3b82f6',
    outletCount: 10,
    assignedSalesId: ''
  });
  
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [nearestOutlets, setNearestOutlets] = useState([]);
  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  // Update map on mount to show all unassigned outlets
  useEffect(() => {
    if (step === 1 || step === 2) {
      // Show all outlets that are not yet assigned to a cluster
      const unassignedOutlets = outlets.filter(o => !o.clusterId);
      setMapState(prev => ({
        ...prev,
        isVisible: true,
        markers: unassignedOutlets.map(o => ({
          id: o.id,
          lat: o.latitude,
          lng: o.longitude,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#9ca3af', // Gray for unassigned
            fillOpacity: 0.8,
            strokeWeight: 1,
            scale: 5
          },
          ...o
        })),
        routes: []
      }));
    }

    return () => {
      // Cleanup handlers
      setMapHandlers({ onMapClick: null, onMarkerClick: null });
    };
  }, [step, outlets, setMapState, setMapHandlers]);

  // Handle map clicks when in step 2
  useEffect(() => {
    if (step === 2) {
      setMapHandlers({
        onMapClick: async (latLng) => {
          setSelectedCenter(latLng);
          try {
            const res = await clustersApi.getNearestOutlets(latLng.lat, latLng.lng, formData.outletCount);
            const nearest = res.data || [];
            setNearestOutlets(nearest);
            
            // Get routes for these nearest
            const routeRes = await clustersApi.generateRoutes(nearest.map(o => o.id));
            setGeneratedRoutes(routeRes.data || []);
            setActiveRouteIndex(0); // default to first route

          } catch (err) {
            notifyError('Gagal mendapatkan outlet terdekat');
          }
        },
        onMarkerClick: null
      });
    }
  }, [step, formData.outletCount, setMapHandlers]);

  // Update map visual when selection or route changes
  useEffect(() => {
    if (step === 2 && selectedCenter && nearestOutlets.length > 0) {
      const activeRoute = generatedRoutes.find(r => r.routeIndex === activeRouteIndex);
      
      const orderedOutlets = activeRoute?.outletOrder 
        ? activeRoute.outletOrder.map(oo => nearestOutlets.find(no => no.id === oo.id)).filter(Boolean)
        : nearestOutlets;

      const path = orderedOutlets.map(o => ({ lat: o.latitude, lng: o.longitude }));

      setMapState(prev => ({
        ...prev,
        center: selectedCenter,
        zoom: 13,
        markers: [
          // Center Marker
          {
            id: 'center-point',
            lat: selectedCenter.lat,
            lng: selectedCenter.lng,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          },
          // Outlet Markers
          ...nearestOutlets.map(o => ({
            id: o.id,
            lat: o.latitude,
            lng: o.longitude,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: formData.colorHex,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 7
            }
          }))
        ],
        routes: [
          {
            path,
            color: formData.colorHex,
            isActive: true
          }
        ]
      }));
    }
  }, [step, selectedCenter, nearestOutlets, generatedRoutes, activeRouteIndex, formData.colorHex, setMapState]);

  const handleSaveCluster = async () => {
    try {
      // Modify routes to set active flag correctly based on selection
      const routesToSave = generatedRoutes.map(r => ({
        ...r,
        isActive: r.routeIndex === activeRouteIndex
      }));

      await clustersApi.createFull({
        name: formData.name,
        region: formData.region,
        colorHex: formData.colorHex,
        centerLat: selectedCenter.lat,
        centerLng: selectedCenter.lng,
        outletCount: formData.outletCount,
        assignedSalesId: formData.assignedSalesId || undefined,
        outletIds: nearestOutlets.map(o => o.id),
        routes: routesToSave
      });
      
      notifySuccess('Cluster berhasil dibuat!');
      invalidate('clusters');
      onClose(); // Hide builder
    } catch (err) {
      notifyError('Gagal membuat cluster');
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex pointer-events-none p-4 md:p-8">
      {/* Overlay Panel (Left Side) */}
      <div className="bg-card w-full md:w-96 rounded-xl shadow-2xl border border-border flex flex-col pointer-events-auto h-full max-h-full overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaRoute className="text-primary" />
            Buat Cluster Baru
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <FaTimes />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Step 1: Basic Info */}
          <div className={`space-y-4 ${step > 1 ? 'opacity-50' : ''}`}>
            <h3 className="font-medium border-b border-border pb-2 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Informasi Dasar
            </h3>
            
            {step === 1 && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Cluster</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Jakarta Selatan A"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Wilayah (Region)</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: DKI Jakarta"
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Jumlah Target Outlet</label>
                  <input 
                    type="number" 
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.outletCount}
                    min="1"
                    onChange={e => setFormData({...formData, outletCount: parseInt(e.target.value, 10)})}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Warna Cluster (Peta)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      className="h-9 w-9 p-0 border-0 rounded cursor-pointer"
                      value={formData.colorHex}
                      onChange={e => setFormData({...formData, colorHex: e.target.value})}
                    />
                    <span className="text-sm font-mono">{formData.colorHex}</span>
                  </div>
                </div>
                
                <button 
                  className="w-full btn btn-primary mt-2"
                  disabled={!formData.name || !formData.region}
                  onClick={() => setStep(2)}
                >
                  Lanjut ke Peta
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Map Selection */}
          {step >= 2 && (
            <div className={`space-y-4 ${step > 2 ? 'opacity-50' : ''}`}>
              <h3 className="font-medium border-b border-border pb-2 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Tentukan Titik Pusat
              </h3>
              
              {step === 2 && (
                <div className="space-y-4 pt-2">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-md text-sm text-blue-200">
                    <p className="flex items-start gap-2">
                      <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                      <span><strong>Klik sembarang tempat pada peta</strong> untuk menentukan titik pusat cluster. Sistem akan otomatis mencari {formData.outletCount} outlet terdekat dari titik tersebut.</span>
                    </p>
                  </div>
                  
                  {selectedCenter && (
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-xs text-muted-foreground mb-1">Koordinat Pusat:</div>
                      <div className="font-mono text-sm">{selectedCenter.lat.toFixed(5)}, {selectedCenter.lng.toFixed(5)}</div>
                      <div className="text-xs text-muted-foreground mt-2 mb-1">Outlet Ditemukan:</div>
                      <div className="font-semibold text-primary">{nearestOutlets.length} Outlet</div>
                    </div>
                  )}

                  {nearestOutlets.length > 0 && generatedRoutes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground block">Pilih Referensi Rute Terdekat</label>
                      <div className="grid grid-cols-1 gap-2">
                        {generatedRoutes.map(r => (
                          <div 
                            key={r.routeIndex}
                            onClick={() => setActiveRouteIndex(r.routeIndex)}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${activeRouteIndex === r.routeIndex ? 'bg-primary/20 border-primary' : 'bg-background border-border hover:border-primary/50'}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">Opsi Rute {r.routeIndex + 1}</span>
                              {activeRouteIndex === r.routeIndex && <FaCheck className="text-primary text-xs" />}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Jarak: <strong className="text-foreground">{r.totalDistanceKm} km</strong></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 btn btn-secondary" onClick={() => setStep(1)}>Kembali</button>
                    <button 
                      className="flex-1 btn btn-primary"
                      disabled={!selectedCenter || nearestOutlets.length === 0}
                      onClick={() => setStep(3)}
                    >
                      Lanjut
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Assignment & Save */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium border-b border-border pb-2 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                Assign Sales & Simpan
              </h3>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Assign Sales (Opsional)</label>
                  <select 
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.assignedSalesId}
                    onChange={e => setFormData({...formData, assignedSalesId: e.target.value})}
                  >
                    <option value="">Pilih Sales Nanti</option>
                    {salesUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.outletCode || 'N/A'})</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Anda dapat melakukan assign rute ini ke sales secara spesifik.</p>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-md mt-6">
                  <h4 className="font-semibold text-primary mb-2">Ringkasan Cluster</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>Nama: <strong className="text-foreground">{formData.name}</strong></li>
                    <li>Region: <strong className="text-foreground">{formData.region}</strong></li>
                    <li>Total Outlet: <strong className="text-foreground">{nearestOutlets.length}</strong></li>
                    <li>Estimasi Jarak Rute: <strong className="text-foreground">{generatedRoutes.find(r => r.routeIndex === activeRouteIndex)?.totalDistanceKm} km</strong></li>
                  </ul>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 btn btn-secondary" onClick={() => setStep(2)}>Kembali</button>
                  <button className="flex-1 btn btn-primary flex justify-center items-center gap-2" onClick={handleSaveCluster}>
                    <FaCheck /> Simpan Cluster
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
