import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMap } from '../../context/MapContext';
import { useMapData } from '../../context/MapDataContext';
import { useApp } from '../../context/AppContext';
import { clustersApi } from '../../services/api';
import { routingService } from '../../services/routingService';
import { ClusterControlPanel } from './components/ops/ClusterControlPanel';
import { TAB_IDS } from '../../constants/navigation';
import '../../styles/pages/CreateClusterPage.css';

/**
 * CreateClusterPage — Full-page split-screen wizard for creating a new cluster.
 * Left 60%: persistent map (click to select center → auto-pick N nearest outlets → 3 alt routes)
 * Right 40%: ClusterControlPanel (wizard steps 1-5)
 */
export const CreateClusterPage = ({ onGoBack }) => {
    const { setMapMode, setMarkers, clearMarkers, setPolylines, clearPolylines, panTo, addClickListener, removeClickListener, mapInstanceRef, isMapReady } = useMap();
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
    const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false);

    // Track whether user manually edited the name
    const nameManuallyEditedRef = useRef(false);

    const centerMarkerRef = useRef(null);
    const processingClickRef = useRef(false);
    const isGeneratingRef = useRef(false);

    // Sync isGeneratingRef with state
    useEffect(() => { isGeneratingRef.current = isGeneratingRoutes; }, [isGeneratingRoutes]);

    // Ref wrapper so markers always call the latest handleCenterSelection without stale closures
    const handleCenterSelectionRef = useRef(null);

    const handleCenterSelectionStable = useCallback((coords, type) => {
        if (processingClickRef.current || isGeneratingRef.current) return;
        if (handleCenterSelectionRef.current) handleCenterSelectionRef.current(coords, type);
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
            const outlet = allOutlets.find((o) => o.id === outletId);
            return outlet ? [...prev, outlet] : prev;
        });
    }, [allOutlets]);

    // Fetch real road driving path using Google Maps JS SDK with backend routingService fallback
    const fetchRoadPath = useCallback(async (orderedOutlets) => {
        if (!orderedOutlets || orderedOutlets.length < 2) return null;

        const points = orderedOutlets
            .map((o) => ({
                lat: Number(o.latitude ?? o.lat),
                lng: Number(o.longitude ?? o.lng),
            }))
            .filter((p) => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));

        if (points.length < 2) return null;

        // Strategy 1: Google Maps JS SDK DirectionsService (client-side)
        if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
            try {
                const directionsService = new window.google.maps.DirectionsService();
                const origin = points[0];
                const dest = points[points.length - 1];
                const waypoints = points.slice(1, -1).slice(0, 23).map((p) => ({
                    location: { lat: p.lat, lng: p.lng },
                    stopover: true,
                }));

                const sdkResult = await new Promise((resolve) => {
                    directionsService.route(
                        {
                            origin,
                            destination: dest,
                            waypoints,
                            travelMode: window.google.maps.TravelMode.DRIVING,
                            optimizeWaypoints: false,
                        },
                        (response, status) => {
                            if (status === window.google.maps.DirectionsStatus.OK && response?.routes?.[0]) {
                                const r = response.routes[0];
                                const path = r.overview_path.map((pt) => ({ lat: pt.lat(), lng: pt.lng() }));
                                let distMeters = 0;
                                r.legs?.forEach((l) => { distMeters += l.distance?.value || 0; });
                                resolve({
                                    path,
                                    roadDistanceKm: Math.round((distMeters / 1000) * 100) / 100,
                                });
                            } else {
                                console.warn('[CreateClusterPage] Google DirectionsService status:', status);
                                resolve(null);
                            }
                        }
                    );
                });

                if (sdkResult?.path?.length > 0) return sdkResult;
            } catch (err) {
                console.warn('[CreateClusterPage] Google SDK error, trying backend routingService:', err);
            }
        }

        // Strategy 2: Backend Routing Service Proxy (Google REST -> OSRM)
        try {
            const { legs } = await routingService.fetchRoadRoute(points);
            if (legs && legs.length > 0) {
                const fullPath = legs.flatMap((l) => l.path || []);
                const totalDist = legs.reduce((acc, l) => acc + (l.distanceKm || 0), 0);
                if (fullPath.length > 0) {
                    return {
                        path: fullPath,
                        roadDistanceKm: Math.round(totalDist * 100) / 100,
                    };
                }
            }
        } catch (err) {
            console.warn('[CreateClusterPage] Backend routing proxy error:', err);
        }

        return null;
    }, []);

    // Draw route polyline on map (following actual streets)
    const drawRoute = useCallback(async (route, idx) => {
        if (!route) return;

        const outletMap = {};
        selectedOutlets.forEach((o) => { outletMap[o.id] = o; });
        allOutlets.forEach((o) => { outletMap[o.id] = o; });

        const ordered = (route.outletOrder || [])
            .map((item) => outletMap[item.id])
            .filter(Boolean);

        const directPath = ordered.map((o) => ({
            lat: Number(o.latitude ?? o.lat),
            lng: Number(o.longitude ?? o.lng),
        }));

        // Draw current path (or direct fallback initially)
        setPolylines([{
            id: `route-${idx}`,
            path: route.overviewPath && route.overviewPath.length > 0 ? route.overviewPath : directPath,
            color: clusterColor,
            isActive: true,
        }]);

        // If road path not yet calculated, fetch from Google SDK or backend proxy
        if (!route.overviewPath && ordered.length >= 2) {
            const roadRes = await fetchRoadPath(ordered);
            if (roadRes?.path?.length > 0) {
                route.overviewPath = roadRes.path;
                if (roadRes.roadDistanceKm) {
                    route.totalDistanceKm = roadRes.roadDistanceKm;
                    setRoutes((prev) => prev.map((r, i) => i === idx ? { ...r, totalDistanceKm: roadRes.roadDistanceKm, overviewPath: roadRes.path } : r));
                }
                setPolylines([{
                    id: `route-${idx}`,
                    path: roadRes.path,
                    color: clusterColor,
                    isActive: true,
                }]);
            }
        }
    }, [selectedOutlets, allOutlets, clusterColor, setPolylines, fetchRoadPath]);

    // Highlight selected outlets on map with sequential numbering from active route
    const highlightSelected = useCallback((outletList, currentRoute = null) => {
        if (!outletList || outletList.length === 0) return;

        const orderMap = {};
        if (currentRoute?.outletOrder) {
            currentRoute.outletOrder.forEach((oo) => {
                orderMap[oo.id] = oo.sequence;
            });
        }

        const selectedMarkers = outletList.map((o, idx) => {
            const seqNum = orderMap[o.id] ?? (idx + 1);
            return {
                id: `sel-${o.id}`,
                lat: o.latitude,
                lng: o.longitude,
                title: `${seqNum}. ${o.name}`,
                label: { text: String(seqNum), color: '#ffffff', fontSize: '10px', fontWeight: 'bold' },
                icon: {
                    path: 0, // circle
                    scale: 11,
                    fillColor: clusterColor,
                    fillOpacity: 0.95,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                },
                zIndex: 100,
                onClick: () => {
                    if (step === 2) {
                        handleCenterSelectionStable({ lat: o.latitude, lng: o.longitude }, o.type);
                    } else {
                        handleToggleOutlet(o.id);
                    }
                },
            };
        });

        // Background markers for all other outlets
        const bgMarkers = (allOutlets || [])
            .filter((o) => o.latitude != null && o.longitude != null)
            .map((o) => ({
                id: `bg-${o.id}`,
                lat: o.latitude,
                lng: o.longitude,
                title: o.name,
                icon: {
                    path: 0,
                    scale: 6,
                    fillColor: o.type === 'GENERAL_TRADE' ? '#2563eb' : '#9333ea',
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 1,
                },
                onClick: () => {
                    if (step === 2) {
                        handleCenterSelectionStable({ lat: o.latitude, lng: o.longitude }, o.type);
                    } else {
                        handleToggleOutlet(o.id);
                    }
                },
            }));
        setMarkers([...bgMarkers, ...selectedMarkers]);
    }, [clusterColor, setMarkers, allOutlets, handleToggleOutlet, step, handleCenterSelectionStable]);

    // handleCenterSelection: runs once per click (1 click = fetch outlets + generate 3 routes)
    const handleCenterSelection = useCallback(async (coords, type) => {
        if (processingClickRef.current || isGeneratingRef.current) return;
        processingClickRef.current = true;
        isGeneratingRef.current = true;
        
        try {
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
            const poolSize = Math.max(outletCount * 2, 30);
            const res = await clustersApi.getNearestOutlets(coords.lat, coords.lng, poolSize, type);
            const pool = res?.data || [];

            if (pool.length > 0) {
                const distSq = (lat1, lng1, lat2, lng2) => Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2);
                outlets = [...pool].sort((a, b) =>
                    distSq(coords.lat, coords.lng, a.latitude, a.longitude) -
                    distSq(coords.lat, coords.lng, b.latitude, b.longitude)
                ).slice(0, outletCount);
                setSelectedOutlets(outlets);
            }

            if (outlets.length === 0) return;

            // Generate 3 route combinations from different starting points
            setIsGeneratingRoutes(true);
            clearPolylines();
            setRoutes([]);
            setActiveRouteIndex(-1);

            const routeRes = await clustersApi.generateRoutes(outlets.map((o) => o.id));
            const generated = routeRes?.data || [];
            setRoutes(generated);

            if (generated.length > 0) {
                setActiveRouteIndex(0);
                highlightSelected(outlets, generated[0]);
                drawRoute(generated[0], 0);
            }

        } catch (err) {
            console.error('Failed to handle center selection or generate routes:', err);
        } finally {
            setIsGeneratingRoutes(false);
            isGeneratingRef.current = false;
            processingClickRef.current = false;
        }
    }, [clusterColor, outletCount, panTo, mapInstanceRef, clearPolylines, drawRoute, highlightSelected]);

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
                    scale: 6,
                    fillColor: o.type === 'GENERAL_TRADE' ? '#2563eb' : '#9333ea',
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 1,
                },
                onClick: () => {
                    if (step === 2) {
                        handleCenterSelectionStable({ lat: o.latitude, lng: o.longitude }, o.type);
                    } else {
                        handleToggleOutlet(o.id);
                    }
                },
            }));
        setMarkers(bgMarkers);
    }, [allOutlets, setMarkers, handleToggleOutlet, step, handleCenterSelectionStable, isMapReady]);

    // Handle map click to pick center point (step 2)
    useEffect(() => {
        if (step !== 2) {
            removeClickListener();
        }
        return () => removeClickListener();
    }, [step, removeClickListener]);

    // Re-highlight when selectedOutlets or active route changes
    useEffect(() => {
        if (selectedOutlets.length > 0) {
            const activeRoute = routes[activeRouteIndex] || routes[0] || null;
            highlightSelected(selectedOutlets, activeRoute);
        }
    }, [selectedOutlets, routes, activeRouteIndex, highlightSelected]);

    // Route selection
    const handleSelectRoute = useCallback((idx) => {
        setActiveRouteIndex(idx);
        if (routes[idx]) {
            highlightSelected(selectedOutlets, routes[idx]);
            drawRoute(routes[idx], idx);
        }
    }, [routes, drawRoute, selectedOutlets, highlightSelected]);

    // Auto-generate cluster name when entering step 4
    const handleNext = () => {
        if (step === 1 && !clusterRegion) {
            alert('Pilih region / wilayah cluster terlebih dahulu.');
            return;
        }
        if (step === 2 && selectedOutlets.length === 0) {
            alert('Klik titik pada peta untuk memilih outlet cluster terlebih dahulu.');
            return;
        }
        const nextStep = Math.min(step + 1, 4);
        if (nextStep === 4 && !nameManuallyEditedRef.current) {
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
                    overviewPath: r.overviewPath || [],
                })),
                assignedSalesId: assignedSalesId || null,
            };

            await clustersApi.createFull(payload);

            addNotification?.({
                title: 'Cluster Dibuat',
                message: `Cluster "${clusterName}" berhasil dibuat dengan ${selectedOutlets.length} outlet.`,
                roleTarget: 'MANAJER_OPERASIONAL',
            });

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
            {/* Left: Map Area (60%) */}
            <div className="map-spacer" />

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
