import { useCallback } from 'react';

export const useMapShapes = ({ mapInstanceRef, polylinesRef, polygonsRef, setMapState }) => {
  /** Replace all polylines. routesData: [{id, path:[{lat,lng}], color, isActive, strokeWeight, strokeOpacity}] */
  const setPolylines = useCallback((routesData = []) => {
    setMapState((prev) => ({ ...prev, routes: routesData }));

    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    const nextIds = new Set(routesData.map((r, i) => String(r.id ?? i)));
    for (const [id, poly] of polylinesRef.current.entries()) {
      if (!nextIds.has(String(id))) {
        poly.setMap(null);
        polylinesRef.current.delete(id);
      }
    }

    routesData.forEach((r, i) => {
      const key = String(r.id ?? i);
      const path = (r.path || []).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
      const strokeColor = r.color || '#4ade80';
      const strokeOpacity = r.strokeOpacity ?? (r.isActive ? 1.0 : 0.4);
      const opts = {
        path,
        map,
        strokeColor,
        strokeOpacity: r.isDashed ? 0 : strokeOpacity,
        strokeWeight: r.strokeWeight ?? (r.isActive ? 4 : 2),
        zIndex: r.zIndex ?? (r.isActive ? 10 : 1),
        icons: r.isDashed
          ? [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity,
                  strokeColor,
                  scale: 3,
                },
                offset: '0',
                repeat: '14px',
              },
            ]
          : [],
      };
      const existing = polylinesRef.current.get(key);
      if (existing) {
        existing.setOptions(opts);
        existing.setPath(path);
      } else {
        polylinesRef.current.set(key, new window.google.maps.Polyline(opts));
      }
    });
  }, []);

  const clearPolylines = useCallback(() => {
    setMapState((prev) => ({ ...prev, routes: [] }));
    for (const poly of polylinesRef.current.values()) poly.setMap(null);
    polylinesRef.current.clear();
  }, []);

  /** Render cluster territory polygons. polygonsData: [{id, path:[{lat,lng}], color, fillOpacity}] */
  const setPolygons = useCallback((polygonsData = []) => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    const nextIds = new Set(polygonsData.map((p) => String(p.id)));
    for (const [id, poly] of polygonsRef.current.entries()) {
      if (!nextIds.has(String(id))) {
        poly.setMap(null);
        polygonsRef.current.delete(id);
      }
    }
    polygonsData.forEach((p) => {
      const key = String(p.id);
      const path = (p.path || []).map((pt) => ({ lat: Number(pt.lat), lng: Number(pt.lng) }));
      const opts = {
        paths: path,
        map,
        strokeColor: p.color || '#3b82f6',
        strokeOpacity: p.strokeOpacity ?? 0.8,
        strokeWeight: p.strokeWeight ?? 2,
        fillColor: p.color || '#3b82f6',
        fillOpacity: p.fillOpacity ?? 0.12,
        zIndex: 1,
      };
      const existing = polygonsRef.current.get(key);
      if (existing) {
        existing.setOptions(opts);
        existing.setPaths(path);
      } else {
        polygonsRef.current.set(key, new window.google.maps.Polygon(opts));
      }
    });
  }, []);

  const clearPolygons = useCallback(() => {
    for (const poly of polygonsRef.current.values()) poly.setMap(null);
    polygonsRef.current.clear();
  }, []);

  return { setPolylines, clearPolylines, setPolygons, clearPolygons };
};
