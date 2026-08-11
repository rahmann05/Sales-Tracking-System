import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMap } from '../../context/MapContext';
import { useMapData } from '../../context/MapDataContext';
import { useApp } from '../../context/AppContext';
import { clustersApi } from '../../services/api';
import { ClusterControlPanel } from './components/ops/ClusterControlPanel';
import { TAB_IDS } from '../../constants/navigation';
import '../../styles/pages/CreateClusterPage.css';

/**
 * CreateClusterPage — Full-page split-screen wizard for creating a new cluster.
 * Left 60%: persistent map (click to select center → auto-pick N nearest outlets → 3 alt routes)
 * Right 40%: ClusterControlPanel (wizard steps 1-5)
 */
export const CreateClusterPage = ({ onGoBack }) => {
    const { setMapMode, setMarkers, clearMarkers, setPolylines, clearPolylines, panTo, fitBounds, addClickListener, removeClickListener, mapInstanceRef, isMapReady } = useMap();
    const { outlets: allOutlets, salesUsers, invalidate } = useMapData();
    const { setActiveTab, addNotification } = useApp();

    // Wizard state
    const [step, setStep] = useState(1);

    // Step 1 — region & color
    const [clusterRegion, setClusterRegion] = useState('');
    const [clusterColor, setClusterColor] = useState('#3b82f6');

    // Step 2
    const [outletCount, setOutletCount] = useState(10);
    const [centerPoint, setCenterPoint] = useState(null); // {lat, lng}
    const [selectedOutlets, setSelectedOutlets] = useState([]);

    // Step 3
    const [routes, setRoutes] = useState([]);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);

    // Step 4
    const [assignedSalesId, setAssignedSalesId] = useState('');

    // Step 5 — cluster name (auto-filled, editable before save)
    const [clusterName, setClusterName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isMapReadyState, setIsMapReady] = useState(false);
    const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false);

    // Track whether user manually edited the name (so we don't overwrite edits)
    const nameManuallyEditedRef = useRef(false);

    const centerMarkerRef = useRef(null);

    // Ref wrapper so markers always call the latest handleCenterSelection without stale closures
    const handleCenterSelectionRef = useRef(null);
    const handleCenterSelectionStable = useCallback((coords) => {
        if (handleCenterSelectionRef.current) handleCenterSelectionRef.current(coords);
    }, []);

    // Set map mode on mount, restore on unmount
    useEffect(() => {
        setMapMode('create-cluster');
        return () => {
            setMapMode('hidden');
            clearMarkers();
            clearPolylines();
            removeClickListener();
        };
    }, [setMapMode, clearMarkers, clearPolylines, removeClickListener]);

    // Toggle outlet selection (manual edit)
    const handleToggleOutlet = useCallback((outletId) => {
        setSelectedOutlets((prev) => {
            const exists = prev.find((o) => o.id === outletId);
            if (exists) {
                return prev.filter((o) => o.id !== outletId);
            }
            // Find from allOutlets and add
            const outlet = allOutlets.find((o) => o.id === outletId);
            return outlet ? [...prev, outlet] : prev;
        });
    }, [allOutlets]);

    // handleCenterSelection: runs once per click (1 click = fetch outlets + generate 3 routes)
    const handleCenterSelection = useCallback(async (coords) => {
        setCenterPoint(coords);
        panTo(coords.lat, coords.lng);

        // Place center marker
        const map = mapInstanceRef.current;
        if (map && window.google) {
            if (centerMarkerRef.current) centerMarkerRef.current.setMap(null);
            centerMarkerRef.current = new window.google.maps.Marker({
                position: coords,
                map,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: clusterColor,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                },
                title: 'Titik Pusat Cluster',
                zIndex: 999,
            });
        }

        // Fetch nearest outlets from server
        let outlets = [];
        try {
            const poolSize = Math.max(outletCount * 2, 30);
            const res = await clustersApi.getNearestOutlets(coords.lat, coords.lng, poolSize);
            const pool = res?.data || [];

            if (pool.length > 0) {
                const distSq = (lat1, lng1, lat2, lng2) => Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2);
                outlets = [...pool].sort((a, b) =>
                    distSq(coords.lat, coords.lng, a.latitude, a.longitude) -
                    distSq(coords.lat, coords.lng, b.latitude, b.longitude)
                ).slice(0, outletCount);
                setSelectedOutlets(outlets);
            }
        } catch (err) {
            console.error('Failed to fetch nearest outlets:', err);
            return;
        }

        if (outlets.length === 0) return;

        // Generate 3 route combinations from different starting points
        setIsGeneratingRoutes(true);
        clearPolylines();
        setRoutes([]);
        setActiveRouteIndex(-1);

        try {
            // Pick 3 diverse start points from the selected outlets
            const uniqueStarts = [];

            // 1. If coords matches an outlet exactly, prioritize it as first start
            const centerOutlet = outlets.find(o =>
                Math.abs(o.latitude - coords.lat) < 0.0001 && Math.abs(o.longitude - coords.lng) < 0.0001
            );
            if (centerOutlet) uniqueStarts.push(centerOutlet);

            // 2. Add extreme points for diversity
            const sortedByLat = [...outlets].sort((a, b) => b.latitude - a.latitude);
            const sortedByLng = [...outlets].sort((a, b) => a.longitude - b.longitude);
            [sortedByLat[0], sortedByLat[sortedByLat.length - 1], sortedByLng[0]].forEach(p => {
                if (p && !uniqueStarts.find(u => u.id === p.id)) uniqueStarts.push(p);
            });

            // 3. Fill up to 3 if needed
            for (const o of outlets) {
                if (uniqueStarts.length >= 3) break;
                if (!uniqueStarts.find(u => u.id === o.id)) uniqueStarts.push(o);
            }

            const generatedRoutes = await Promise.all(uniqueStarts.map(async (startOutlet, index) => {
                // Nearest-neighbor ordering starting from startOutlet
                const remaining = [...outlets];
                const ordered = [];
                let current = remaining.splice(remaining.findIndex(o => o.id === startOutlet.id), 1)[0] || startOutlet;
                ordered.push(current);
                const dSq = (a, b) => Math.pow(a.latitude - b.latitude, 2) + Math.pow(a.longitude - b.longitude, 2);
                while (remaining.length > 0) {
                    let bestIdx = 0, bestDist = Infinity;
                    for (let i = 0; i < remaining.length; i++) {
                        const d = dSq(current, remaining[i]);
                        if (d < bestDist) { bestDist = d; bestIdx = i; }
                    }
                    current = remaining.splice(bestIdx, 1)[0];
                    ordered.push(current);
                }

                // OSRM Route API (more reliable than Trip API)
                let overviewPath = null;
                let totalDistanceKm = 0;
                try {
                    const coordStr = ordered.map(o => `${o.longitude},${o.latitude}`).join(';');
                    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.routes && data.routes[0]) {
                            overviewPath = data.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
                            totalDistanceKm = Math.round((data.routes[0].distance / 1000) * 100) / 100;
                        }
                    } else {
                        console.warn('OSRM Route API failed:', res.status);
                    }
                } catch (e) {
                    console.warn('OSRM request failed:', e);
                }

                if (!overviewPath) {
                    // Straight-line fallback
                    overviewPath = ordered.map(o => ({ lat: Number(o.latitude), lng: Number(o.longitude) }));
                    totalDistanceKm = 0;
                }

                return {
                    routeIndex: index,
                    isActive: false,
                    totalDistanceKm,
                    startOutletId: startOutlet.id,
                    outletOrder: ordered.map((o, i) => ({ id: o.id, sequence: i + 1 })),
                    overviewPath,
                    fullOutlets: ordered,
                };
            }));

            setRoutes(generatedRoutes);
        } catch (err) {
            console.error('Failed to generate routes:', err);
        } finally {
            setIsGeneratingRoutes(false);
        }
    }, [clusterColor, outletCount, panTo, mapInstanceRef, clearPolylines]);

    // Keep the ref up-to-date with the latest version of handleCenterSelection
    handleCenterSelectionRef.current = handleCenterSelection;

    // Show all outlets as visible markers on the map
    useEffect(() => {
        if (!allOutlets || allOutlets.length === 0) return;
        const bgMarkers = allOutlets
            .filter((o) => o.latitude != null && o.longitude != null)
            .map((o) => ({
                id: `bg-${o.id}`,
                lat: o.latitude,
                lng: o.longitude,
                title: o.name,
                icon: {
                    path: 0, // google.maps.SymbolPath.CIRCLE
                    scale: 7,
                    fillColor: o.clusterId ? '#6366f1' : '#f97316', // indigo = assigned, orange = free
                    fillOpacity: 0.85,
                    strokeColor: '#ffffff',
                    strokeWeight: 1.5,
                },
                onClick: () => {
                    if (step === 2) {
                        handleCenterSelectionStable({ lat: o.latitude, lng: o.longitude });
                    } else {
                        handleToggleOutlet(o.id);
                    }
                },
            }));
        setMarkers(bgMarkers);
    }, [allOutlets, setMarkers, handleToggleOutlet, step, handleCenterSelectionStable]);

    // Handle map click to pick center point (step 2)
    useEffect(() => {
        if (step !== 2 || !isMapReady) return;
        addClickListener(handleCenterSelectionStable);
        return () => removeClickListener();
    }, [step, isMapReady, handleCenterSelectionStable, addClickListener, removeClickListener]);

    // Highlight selected outlets on map
    const highlightSelected = useCallback((outletList) => {
        if (!outletList || outletList.length === 0) return;

        const selectedMarkers = outletList.map((o, idx) => ({
            id: `sel-${o.id}`,
            lat: o.latitude,
            lng: o.longitude,
            title: `${idx + 1}. ${o.name}`,
            label: { text: String(idx + 1), color: '#ffffff', fontSize: '10px', fontWeight: 'bold' },
            icon: {
                path: 0, // circle
                scale: 10,
                fillColor: clusterColor,
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
            },
            zIndex: 100,
            onClick: () => {
                    // Allows clicking a selected marker to recalculate a new center from there
                    if (step === 2) {
                        handleCenterSelectionStable({ lat: o.latitude, lng: o.longitude });
                    } else {
                        handleToggleOutlet(o.id);
                    }
                },
        }));

        // Replace all markers: background + selected on top
        const bgMarkers = (allOutlets || [])
            .filter((o) => o.latitude != null && o.longitude != null)
            .map((o) => ({
                id: `bg-${o.id}`,
                lat: o.latitude,
                lng: o.longitude,
                title: o.name,
                icon: {
                    path: 0,
                    scale: 4,
                    fillColor: o.clusterId ? '#94a3b8' : '#d1d5db',
                    fillOpacity: 0.5,
                    strokeWeight: 0,
                },
                onClick: () => {
                    if (step === 2) {
                        handleCenterSelectionStable({ lat: o.latitude, lng: o.longitude });
                    } else {
                        handleToggleOutlet(o.id);
                    }
                },
            }));
        setMarkers([...bgMarkers, ...selectedMarkers]);

        // Do not fit bounds to prevent auto-zoom on click
    }, [clusterColor, setMarkers, allOutlets, handleToggleOutlet, step, handleCenterSelectionStable]);



    // Re-highlight when selectedOutlets change
    useEffect(() => {
        if (selectedOutlets.length > 0) {
            highlightSelected(selectedOutlets);
        }
    }, [selectedOutlets, highlightSelected]);

    // Draw route polyline on map (declared before useEffect that calls it to avoid TDZ)
    const drawRoute = useCallback((route, idx) => {
        if (!route) return;

        let path;
        if (route.overviewPath && route.overviewPath.length > 0) {
            // Use real road path from Google Directions API
            path = route.overviewPath;
        } else {
            // Fallback: straight lines between outlet coords (Haversine server fallback)
            const outletMap = {};
            selectedOutlets.forEach((o) => { outletMap[o.id] = o; });
            allOutlets.forEach((o) => { outletMap[o.id] = o; });
            path = (route.outletOrder || [])
                .map((item) => outletMap[item.id])
                .filter(Boolean)
                .map((o) => ({ lat: Number(o.latitude), lng: Number(o.longitude) }));
        }

        setPolylines([{
            id: `route-${idx}`,
            path,
            color: clusterColor,
            isActive: true,
        }]);
    }, [selectedOutlets, allOutlets, clusterColor, setPolylines]);

    // (Route generation is handled directly inside handleCenterSelection)




    // Route selection
    const handleSelectRoute = useCallback((idx) => {
        setActiveRouteIndex(idx);
        if (routes[idx]) {
            drawRoute(routes[idx], idx);
        }
    }, [routes, drawRoute]);

    // Auto-generate cluster name when entering step 4
    const handleNext = () => {
        const nextStep = Math.min(step + 1, 4);
        if (nextStep === 4 && !nameManuallyEditedRef.current) {
            // Auto-fill: "Cluster {Region} - {SalesName}" or just "Cluster {Region}"
            const salesName = salesUsers.find((s) => s.id === assignedSalesId)?.name;
            const regionPart = clusterRegion.trim() || 'Baru';
            const salesPart = salesName ? ` - ${salesName}` : '';
            const generated = `Cluster ${regionPart}${salesPart}`;
            setClusterName(generated);
        }
        setStep(nextStep);
    };

    // Wrapped setClusterName that marks the name as manually edited
    const handleSetClusterName = (val) => {
        nameManuallyEditedRef.current = true;
        setClusterName(val);
    };

    // Save cluster
    const handleSave = async () => {
        if (!clusterName.trim()) {
            alert('Nama cluster wajib diisi.');
            return;
        }
        if (selectedOutlets.length === 0) {
            alert('Pilih minimal 1 outlet.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: clusterName.trim(),
                region: clusterRegion.trim(),
                colorHex: clusterColor,
                centerLat: centerPoint?.lat || null,
                centerLng: centerPoint?.lng || null,
                outletIds: selectedOutlets.map((o) => o.id),
                routes: routes.map((r, i) => ({
                    routeIndex: i,
                    isActive: activeRouteIndex === -1 ? i === 0 : i === activeRouteIndex,
                    totalDistanceKm: r.totalDistanceKm || 0,
                    startOutletId: r.startOutletId || null,
                    outletOrder: r.outletOrder || [],
                    overviewPath: r.overviewPath || [], // Include road path for database
                })),
                assignedSalesId: assignedSalesId || null,
            };

            await clustersApi.createFull(payload);

            addNotification?.({
                title: 'Cluster Dibuat',
                message: `Cluster "${clusterName}" berhasil dibuat dengan ${selectedOutlets.length} outlet.`,
                roleTarget: 'MANAJER_OPERASIONAL',
            });

            // Invalidate caches and navigate back
            invalidate?.('clusters');
            invalidate?.('outlets');
            setActiveTab(TAB_IDS.ROUTE_PLANNING);
        } catch (err) {
            console.error('Failed to save cluster:', err);
            alert(`Gagal menyimpan cluster: ${err?.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (onGoBack) onGoBack();
        else setActiveTab(TAB_IDS.ROUTE_PLANNING);
    };

    return (
        <div className="create-cluster-page">
            {/* Left: Map Area (60%) — the PersistentMapShell is already rendering behind */}
            <div className="map-spacer">
                {/* Map is rendered by PersistentMapShell; this area is transparent to show it */}
            </div>

            {/* Right: Control Panel (40%) */}
            <div className="control-panel-container">
                <ClusterControlPanel
                    step={step}
                    clusterName={clusterName}
                    setClusterName={handleSetClusterName}
                    clusterRegion={clusterRegion}
                    setClusterRegion={setClusterRegion}
                    clusterColor={clusterColor}
                    setClusterColor={setClusterColor}
                    outletCount={outletCount}
                    setOutletCount={setOutletCount}
                    selectedOutlets={selectedOutlets}
                    onToggleOutlet={handleToggleOutlet}
                    routes={routes}
                    activeRouteIndex={activeRouteIndex}
                    onSelectRoute={handleSelectRoute}
                    allOutlets={allOutlets}
                    salesUsers={salesUsers}
                    assignedSalesId={assignedSalesId}
                    setAssignedSalesId={setAssignedSalesId}
                    onNext={handleNext}
                    onBack={() => setStep((s) => Math.max(s - 1, 1))}
                    onSave={handleSave}
                    isSaving={isSaving}
                    onCancel={handleCancel}
                    isGeneratingRoutes={isGeneratingRoutes}
                />
            </div>
        </div>
    );
};
