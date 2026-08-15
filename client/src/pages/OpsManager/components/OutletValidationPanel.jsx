import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LuShieldCheck, LuShieldAlert, LuShieldQuestion, LuShieldX, LuShieldOff,
  LuChevronDown, LuChevronUp, LuSearch, LuTriangleAlert, LuMapPin,
  LuNavigation, LuGlobe, LuCrosshair, LuPlus, LuMinus
} from 'react-icons/lu';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { outletsApi, outletValidationApi } from '../../../services/api';
import { NearbySearchModal } from './NearbySearchModal';
import '../../../styles/components/OutletValidationPanel.css';

/**
 * OutletValidationPanel Component
 * Single Responsibility: Display outlet data in a table with per-outlet Google API
 * validation using 4-signal weighted scoring approach.
 * 1 File = 1 Component
 */

const PAGE_SIZE = 15;

// ─── Status Configs ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  VALID: { label: 'Valid', icon: LuShieldCheck, dotClass: 'ovp-dot-valid', badgeClass: 'ovp-badge-valid', statusClass: 'ovp-status-valid' },
  LIKELY_VALID: { label: 'Likely Valid', icon: LuShieldCheck, dotClass: 'ovp-dot-likely', badgeClass: 'ovp-badge-likely', statusClass: 'ovp-status-likely_valid' },
  WARNING: { label: 'Warning', icon: LuShieldAlert, dotClass: 'ovp-dot-warning', badgeClass: 'ovp-badge-warning', statusClass: 'ovp-status-warning' },
  SUSPECT: { label: 'Suspect', icon: LuShieldX, dotClass: 'ovp-dot-suspect', badgeClass: 'ovp-badge-suspect', statusClass: 'ovp-status-suspect' },
  UNVALIDATED: { label: 'Belum Validasi', icon: LuShieldQuestion, dotClass: 'ovp-dot-unvalidated', badgeClass: 'ovp-badge-unvalidated', statusClass: 'ovp-status-unvalidated' },
  INCOMPLETE: { label: 'Incomplete', icon: LuShieldOff, dotClass: 'ovp-dot-incomplete', badgeClass: 'ovp-badge-incomplete', statusClass: 'ovp-status-incomplete' },
};

const SIGNAL_LABELS = {
  reverseGeocode: { label: 'Reverse Geocode', color: '#3b82f6', icon: LuMapPin },
  forwardGeocode: { label: 'Forward Geocode', color: '#22c55e', icon: LuNavigation },
  findPlace: { label: 'Find Place', color: '#eab308', icon: LuSearch },
  nearbySearch: { label: 'Nearby Search', color: '#f97316', icon: LuGlobe },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getConfidenceColor = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#22c55e';
  if (score >= 30) return '#f59e0b';
  return '#ef4444';
};

const getScoreColor = (score) => {
  if (score >= 80) return { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' };
  if (score >= 60) return { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a' };
  if (score >= 40) return { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706' };
  return { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' };
};

// ─── Signal Detail Card ──────────────────────────────────────────────────────

const SignalDetailCard = ({ signalKey, data, outletId, onValidateNearby, isNearbyLoading, onOpenNearbyModal }) => {
  const cfg = SIGNAL_LABELS[signalKey];
  if (!cfg) return null;

  const scoreColor = data ? getScoreColor(data.score) : { bg: 'transparent', text: 'inherit' };

  return (
    <div className="ovp-detail-card">
      <div className="ovp-detail-card-header">
        <span className="ovp-detail-signal-label" style={{ color: cfg.color, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <cfg.icon color={cfg.color} size={14} />
          {cfg.label}
        </span>
        {data && (
          <span className="ovp-detail-signal-score" style={{ background: scoreColor.bg, color: scoreColor.text }}>
            {data.skipped ? 'SKIP' : `${data.score}/100`}
          </span>
        )}
      </div>

      {!data && signalKey !== 'nearbySearch' ? null : data?.skipped ? (
        <div className="ovp-detail-row-item">
          <span className="ovp-detail-label">Status:</span>
          <span className="ovp-detail-value" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            Di-skip (data tidak cukup)
          </span>
        </div>
      ) : (
        <>
          {/* Reverse Geocode details */}
          {signalKey === 'reverseGeocode' && (
            <>
              {data.outletAddress && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Alamat DB:</span>
                  <span className="ovp-detail-value">{data.outletAddress}</span>
                </div>
              )}
              {data.googleAddress && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Alamat Google:</span>
                  <span className="ovp-detail-value">{data.googleAddress}</span>
                </div>
              )}
              {data.addressSimilarity != null && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Kecocokan:</span>
                  <span className={`ovp-detail-value ${data.addressSimilarity >= 0.5 ? 'match' : 'mismatch'}`}>
                    {Math.round(data.addressSimilarity * 100)}%
                  </span>
                </div>
              )}
            </>
          )}

          {/* Forward Geocode details */}
          {signalKey === 'forwardGeocode' && (
            <>
              {data.distanceMeters != null && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Jarak:</span>
                  <span className={`ovp-detail-value ${data.distanceMeters <= 200 ? 'match' : 'mismatch'}`}>
                    {data.distanceMeters}m
                  </span>
                </div>
              )}
              {data.googleLat != null && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Google Coords:</span>
                  <span className="ovp-detail-value" style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                    {data.googleLat?.toFixed(7)}, {data.googleLng?.toFixed(7)}
                  </span>
                </div>
              )}
              {data.googleAddress && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Alamat Google:</span>
                  <span className="ovp-detail-value">{data.googleAddress}</span>
                </div>
              )}
              {data.note && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Catatan:</span>
                  <span className="ovp-detail-value" style={{ color: '#2563eb' }}>{data.note}</span>
                </div>
              )}
            </>
          )}

          {/* Find Place details */}
          {signalKey === 'findPlace' && (
            <>
              {data.outletName && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Nama DB:</span>
                  <span className="ovp-detail-value">{data.outletName}</span>
                </div>
              )}
              {data.googlePlaceName && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Nama Google:</span>
                  <span className="ovp-detail-value">{data.googlePlaceName}</span>
                </div>
              )}
              {data.nameSimilarity != null && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Kecocokan Nama:</span>
                  <span className={`ovp-detail-value ${data.nameSimilarity >= 0.5 ? 'match' : 'mismatch'}`}>
                    {Math.round(data.nameSimilarity * 100)}%
                  </span>
                </div>
              )}
              {data.distanceMeters != null && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Jarak:</span>
                  <span className={`ovp-detail-value ${data.distanceMeters <= 200 ? 'match' : 'mismatch'}`}>
                    {data.distanceMeters}m
                  </span>
                </div>
              )}
              {data.businessStatus && data.businessStatus !== 'UNKNOWN' && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Status Bisnis:</span>
                  <span className="ovp-detail-value">{data.businessStatus}</span>
                </div>
              )}
              {data.googleLat != null && data.googleLng != null && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Google Coords:</span>
                  <span className="ovp-detail-value" style={{ fontSize: '0.6875rem' }}>{data.googleLat}, {data.googleLng}</span>
                </div>
              )}
              {data.googleAddress && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Alamat Google:</span>
                  <span className="ovp-detail-value" style={{ fontSize: '0.6875rem', lineHeight: '1.2' }}>{data.googleAddress}</span>
                </div>
              )}
              {data.note && (
                <div className="ovp-detail-row-item">
                  <span className="ovp-detail-label">Catatan:</span>
                  <span className="ovp-detail-value" style={{ color: data.isFarMismatch ? '#dc2626' : '#2563eb', fontWeight: 600 }}>
                    {data.note}
                  </span>
                </div>
              )}
              {data.googleLat != null && data.googleLng != null && (
                <div style={{ marginTop: '0.75rem' }}>
                  <a 
                    href={data.placeId ? `https://www.google.com/maps/search/?api=1&query=${data.googleLat},${data.googleLng}&query_place_id=${data.placeId}` : `https://www.google.com/maps/search/?api=1&query=${data.googleLat},${data.googleLng}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ovp-action-btn"
                    style={{ 
                      display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '0.375rem',
                      background: 'var(--primary)', color: 'white', border: 'none', padding: '0.375rem', 
                      borderRadius: '0.375rem', fontSize: '0.6875rem', textDecoration: 'none' 
                    }}
                  >
                    <LuMapPin size={12} /> Buka di Google Maps
                  </a>
                </div>
              )}
            </>
          )}

          {/* Nearby Search details */}
          {signalKey === 'nearbySearch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!data ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem' }}>
                    Data tempat terdekat belum ditarik dari Google API.
                  </p>
                  <button
                    onClick={() => onValidateNearby(outletId)}
                    disabled={isNearbyLoading}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: isNearbyLoading ? 'not-allowed' : 'pointer',
                      opacity: isNearbyLoading ? 0.7 : 1,
                    }}
                  >
                    {isNearbyLoading ? 'Loading...' : 'Validasi dengan Nearby Search'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="ovp-detail-row-item">
                    <span className="ovp-detail-label">Match Terbaik:</span>
                    <span className="ovp-detail-value">{data.topMatchName || data.bestMatchName || '-'}</span>
                  </div>
                  <div className="ovp-detail-row-item">
                    <span className="ovp-detail-label">Kecocokan:</span>
                    <span className={`ovp-detail-value ${data.nameSimilarity >= 0.5 || data.bestMatchSimilarity >= 0.5 ? 'match' : 'mismatch'}`}>
                      {Math.round((data.nameSimilarity ?? data.bestMatchSimilarity ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="ovp-detail-row-item">
                    <span className="ovp-detail-label">Total Ditemukan:</span>
                    <span className="ovp-detail-value">{data.placesList?.length ?? data.totalNearbyPlaces ?? 0} tempat</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {data?.error && (
            <div className="ovp-detail-row-item">
              <span className="ovp-detail-label">Error:</span>
              <span className="ovp-detail-value mismatch">{data.error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Map Preview Card ────────────────────────────────────────────────────────

const MapPreviewCard = ({ outlet, details }) => {
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(18);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const hasDbCoords = outlet.latitude != null && outlet.longitude != null;
  const fpDetails = details?.signals?.findPlace;
  const fwDetails = details?.signals?.forwardGeocode;
  
  // Use Find Place or Forward Geocode coords for Google's point (only if within reasonable local radius)
  const googleCoords = useMemo(() => {
    if (fpDetails && fpDetails.googleLat != null && !fpDetails.isFarMismatch) {
      return { lat: parseFloat(fpDetails.googleLat), lng: parseFloat(fpDetails.googleLng) };
    }
    if (fwDetails && fwDetails.googleLat != null && !fwDetails.outOfBounds) {
      return { lat: parseFloat(fwDetails.googleLat), lng: parseFloat(fwDetails.googleLng) };
    }
    return null;
  }, [
    fpDetails?.googleLat,
    fpDetails?.googleLng,
    fpDetails?.isFarMismatch,
    fwDetails?.googleLat,
    fwDetails?.googleLng,
    fwDetails?.outOfBounds,
  ]);

  const dbCoords = useMemo(() => {
    if (!hasDbCoords) return null;
    return { lat: parseFloat(outlet.latitude), lng: parseFloat(outlet.longitude) };
  }, [outlet.latitude, outlet.longitude, hasDbCoords]);

  // Primary anchor is always DB coords (outlet's actual location), memoized to prevent scroll re-center
  const initialCenter = useMemo(() => {
    if (dbCoords) return dbCoords;
    if (googleCoords) return googleCoords;
    return { lat: -6.9, lng: 107.6 };
  }, [outlet.id]);

  if (!isLoaded) {
    return (
      <div className="ovp-map-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>Memuat Peta...</span>
      </div>
    );
  }

  const svgMarkerPath = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

  return (
    <div className="ovp-map-card">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={initialCenter}
        zoom={zoom}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onZoomChanged={() => {
          if (map) {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom !== zoom) {
              setZoom(currentZoom);
            }
          }
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          scrollwheel: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
          mapTypeId: 'roadmap',
        }}
      >
        {googleCoords && (
          <MarkerF
            position={googleCoords}
            title="Titik Hasil Validasi (Google)"
            icon={{ 
              path: svgMarkerPath,
              fillColor: '#059669', // Emerald Green
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
              scale: 1.6,
              anchor: window.google ? new window.google.maps.Point(12, 22) : null,
            }}
            zIndex={100}
          />
        )}
        {dbCoords && (
          <MarkerF
            position={dbCoords}
            title="Titik Awal Database"
            icon={{ 
              path: svgMarkerPath,
              fillColor: '#3b82f6', // Vibrant Blue
              fillOpacity: 1,
              strokeWeight: 1.5,
              strokeColor: '#ffffff',
              scale: 1.3,
              anchor: window.google ? new window.google.maps.Point(12, 22) : null,
            }}
            zIndex={90}
          />
        )}
      </GoogleMap>
      
      {/* Floating Action Buttons to Focus & Zoom */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: '0.375rem', zIndex: 10 }}>
        {/* Quick Focus Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {googleCoords && (
            <button
              onClick={() => map?.panTo(googleCoords)}
              title="Fokus ke Titik Google"
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '0.375rem 0.625rem',
                borderRadius: '0.375rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <LuCrosshair size={12} /> Google
            </button>
          )}
          {dbCoords && (
            <button
              onClick={() => map?.panTo(dbCoords)}
              title="Fokus ke Titik Database"
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.375rem 0.625rem',
                borderRadius: '0.375rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <LuCrosshair size={12} /> DB
            </button>
          )}
        </div>

        {/* Dedicated Zoom In / Zoom Out Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '0.375rem', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => {
              const currentZ = map?.getZoom() || zoom;
              const newZ = Math.min(currentZ + 1, 21);
              setZoom(newZ);
              map?.setZoom(newZ);
            }}
            title="Perbesar Peta (Zoom In)"
            style={{
              background: 'white',
              color: 'var(--on-surface)',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              width: 30,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            <LuPlus size={14} />
          </button>
          <button
            onClick={() => {
              const currentZ = map?.getZoom() || zoom;
              const newZ = Math.max(currentZ - 1, 10);
              setZoom(newZ);
              map?.setZoom(newZ);
            }}
            title="Perkecil Peta (Zoom Out)"
            style={{
              background: 'white',
              color: 'var(--on-surface)',
              border: 'none',
              width: 30,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            <LuMinus size={14} />
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.95)', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.6875rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)' }}>
        {googleCoords && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#059669', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            <span style={{ color: '#047857' }}>Titik Validasi Google</span>
          </div>
        )}
        {dbCoords && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6', border: '1px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
            <span style={{ color: '#2563eb' }}>Titik Awal Database</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Expanded Detail Row ─────────────────────────────────────────────────────

const ExpandedDetail = ({ 
  outlet, 
  onValidateNearby, 
  isNearbyLoading, 
  onOpenNearbyModal,
  onApplySuggestedCoords,
  isApplyingCoords 
}) => {
  const details = outlet.validationDetails;
  if (!details) return null;

  const signals = details.signals || {};
  const warnings = details.warnings || [];
  
  // Nearby search data may be top-level or inside signals depending on new/old format
  const nearbySearchData = details.nearbySearch || signals.nearbySearch || null;

  return (
    <div className="ovp-detail-panel">
      {/* Signal Cards and Map */}
      <div className="ovp-detail-grid">
        {['reverseGeocode', 'forwardGeocode', 'findPlace'].map((key) => (
          <SignalDetailCard key={key} signalKey={key} data={signals[key]} outletId={outlet.id} />
        ))}
        <SignalDetailCard 
          signalKey="nearbySearch" 
          data={nearbySearchData} 
          outletId={outlet.id}
          onValidateNearby={onValidateNearby}
          isNearbyLoading={isNearbyLoading}
          onOpenNearbyModal={onOpenNearbyModal}
        />
        {/* Map always shown as part of the grid */}
        <MapPreviewCard outlet={outlet} details={details} />
      </div>

      {/* Suggested Coordinates with 1-Click Fix Action */}
      {outlet.googleSuggestedLat != null && (
        <div className="ovp-suggested-coords" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div className="ovp-suggested-label">
              <LuMapPin style={{ display: 'inline', marginRight: 4 }} />
              Koordinat yang Disarankan Google (Lokasi Sebenarnya):
            </div>
            <div className="ovp-suggested-value">
              {outlet.googleSuggestedLat?.toFixed(7)}, {outlet.googleSuggestedLng?.toFixed(7)}
            </div>
          </div>
          {onApplySuggestedCoords && (
            <button
              onClick={() => onApplySuggestedCoords(outlet.id, outlet.googleSuggestedLat, outlet.googleSuggestedLng)}
              disabled={isApplyingCoords}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.875rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: isApplyingCoords ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
              }}
              title="Perbarui koordinat database dengan titik Google ini dan validasi ulang"
            >
              <LuShieldCheck size={14} />
              {isApplyingCoords ? 'Menyimpan...' : '✓ Terapkan ke Database & Validasi Ulang'}
            </button>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="ovp-warnings">
          {warnings.map((w, i) => (
            <div key={i} className="ovp-warning-item">
              <LuTriangleAlert style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const OutletValidationPanel = () => {
  const [outlets, setOutlets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [validatingNearbyId, setValidatingNearbyId] = useState(null);
  const [isBatchValidating, setIsBatchValidating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [applyingCoordsId, setApplyingCoordsId] = useState(null);
  
  // Modal state
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [nearbyModalData, setNearbyModalData] = useState(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────

  const fetchOutlets = useCallback(async () => {
    try {
      const res = await outletsApi.getAll();
      setOutlets(res.data || []);
    } catch (err) {
      console.error('[OutletValidationPanel] Failed to fetch outlets:', err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await outletValidationApi.getSummary();
      setSummary(res.data || null);
    } catch (err) {
      console.error('[OutletValidationPanel] Failed to fetch summary:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOutlets(), fetchSummary()]);
      setLoading(false);
    };
    init();
  }, [fetchOutlets, fetchSummary]);

  // ─── Validate Single Outlet ──────────────────────────────────────────────

  const handleValidate = async (outletId) => {
    const outlet = outlets.find((o) => o.id === outletId);
    if (outlet && outlet.validationStatus !== 'UNVALIDATED') {
      const confirmed = window.confirm(
        'Toko ini sudah pernah divalidasi sebelumnya. Yakin ingin memvalidasi ulang (menggunakan kuota API baru)?'
      );
      if (!confirmed) return;
    }

    setValidatingId(outletId);
    try {
      const res = await outletValidationApi.validateSingle(outletId);
      const result = res.data;

      // Update local state
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === outletId
            ? {
                ...o,
                validationStatus: result.validationStatus,
                validationConfidence: result.validationConfidence,
                validatedAt: result.validatedAt,
                validationDetails: result.validationDetails,
                googleSuggestedLat: result.googleSuggestedLat ?? o.googleSuggestedLat,
                googleSuggestedLng: result.googleSuggestedLng ?? o.googleSuggestedLng,
              }
            : o
        )
      );

      // Expand to show results
      setExpandedId(outletId);

      // Refresh summary
      await fetchSummary();
    } catch (err) {
      console.error('[OutletValidationPanel] Validation failed:', err);
      alert(`Validasi gagal: ${err.message}`);
    } finally {
      setValidatingId(null);
    }
  };

  const handleValidateNearby = async (outletId) => {
    setValidatingNearbyId(outletId);
    try {
      const res = await outletValidationApi.validateNearby(outletId);
      const result = res.data;

      // Update local state
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === outletId
            ? {
                ...o,
                validationDetails: result.updatedOutlet.validationDetails,
              }
            : o
        )
      );

      // Show modal immediately
      setNearbyModalData(result.nearbySearch);
      setIsNearbyModalOpen(true);
      
    } catch (err) {
      console.error('[OutletValidationPanel] Nearby Search failed:', err);
      alert(`Nearby Search gagal: ${err.message}`);
    } finally {
      setValidatingNearbyId(null);
    }
  };

  const handleApplySuggestedCoords = async (outletId, lat, lng) => {
    const confirmed = window.confirm(
      `Terapkan koordinat yang disarankan Google (${lat.toFixed(6)}, ${lng.toFixed(6)}) ke database dan validasi ulang outlet ini?`
    );
    if (!confirmed) return;

    setApplyingCoordsId(outletId);
    try {
      await outletsApi.update(outletId, { latitude: lat, longitude: lng });
      await handleValidate(outletId);
      await fetchOutlets();
    } catch (err) {
      console.error('[OutletValidationPanel] Failed to apply coordinates:', err);
      alert(`Gagal menerapkan koordinat: ${err.message}`);
    } finally {
      setApplyingCoordsId(null);
    }
  };

  const handleBatchValidate = async (targetFilter = 'NEEDS_REVIEW') => {
    const filterLabel = targetFilter === 'SUSPECT' ? 'semua outlet SUSPECT' : 'semua outlet yang butuh review (Suspect/Warning/Belum Validasi)';
    const confirmed = window.confirm(
      `Jalankan validasi batch untuk ${filterLabel} dengan algoritma perbaikan akurasi baru?`
    );
    if (!confirmed) return;

    setIsBatchValidating(true);
    try {
      const res = await outletValidationApi.validateBatch({ filter: targetFilter, limit: 50 });
      alert(`Validasi batch selesai: ${res.data?.success || 0} outlet berhasil divalidasi.`);
      setSelectedIds(new Set());
      await Promise.all([fetchOutlets(), fetchSummary()]);
    } catch (err) {
      console.error('[OutletValidationPanel] Batch validation failed:', err);
      alert(`Validasi batch gagal: ${err.message}`);
    } finally {
      setIsBatchValidating(false);
    }
  };

  // ─── Multi-Select Handlers ───────────────────────────────────────────────

  const handleToggleSelect = (id, e) => {
    e?.stopPropagation?.();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredOutlets.map((o) => o.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleValidateSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Jalankan validasi untuk ${count} outlet yang dipilih?`
    );
    if (!confirmed) return;

    setIsBatchValidating(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await outletValidationApi.validateBatch({ outletIds: ids });
      alert(`Validasi selesai: ${res.data?.success || 0} dari ${count} outlet berhasil divalidasi.`);
      setSelectedIds(new Set());
      await Promise.all([fetchOutlets(), fetchSummary()]);
    } catch (err) {
      console.error('[OutletValidationPanel] Selected validation failed:', err);
      alert(`Validasi gagal: ${err.message}`);
    } finally {
      setIsBatchValidating(false);
    }
  };

  // ─── Filter & Pagination ─────────────────────────────────────────────────

  const filteredOutlets = useMemo(() => {
    let result = outlets;

    if (filterStatus) {
      result = result.filter((o) => o.validationStatus === filterStatus);
    }

    if (filterType !== 'ALL') {
      result = result.filter((o) => o.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          (o.name || '').toLowerCase().includes(q) ||
          (o.address || '').toLowerCase().includes(q) ||
          (o.outletCode || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [outlets, filterStatus, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredOutlets.length / PAGE_SIZE);
  const paginatedOutlets = useMemo(
    () => filteredOutlets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredOutlets, currentPage]
  );

  const allPageSelected = paginatedOutlets.length > 0 && paginatedOutlets.every((o) => selectedIds.has(o.id));

  const handleToggleSelectAllPage = (e) => {
    e?.stopPropagation?.();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedOutlets.forEach((o) => next.delete(o.id));
      } else {
        paginatedOutlets.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, searchQuery]);

  // ─── Toggle Filter ───────────────────────────────────────────────────────

  const handleFilterClick = (status) => {
    setFilterStatus((prev) => (prev === status ? null : status));
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ovp-card">
        <div className="ovp-empty">
          <div className="ovp-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <div className="ovp-empty-text">Memuat data outlet...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ovp-card">
      {/* Summary Bar */}
      <div className="ovp-summary-bar">
        {/* Trade Type Filters (Moved to Left Top Bar) */}
        <div style={{ display: 'flex', gap: '0.125rem', background: 'var(--surface-container-high)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)' }}>
          {['ALL', 'GENERAL_TRADE', 'MODERN_TRADE'].map(type => {
            const isActive = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  border: 'none',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {type === 'ALL' ? 'Semua' : type === 'GENERAL_TRADE' ? 'GT' : 'MT'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="ovp-controls">
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <LuSearch
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--on-surface-variant)',
              opacity: 0.5,
              fontSize: '0.875rem',
            }}
          />
          <input
            type="text"
            className="ovp-search-input"
            placeholder="Cari nama outlet, alamat, atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2rem' }}
          />
        </div>
        
        {/* Status Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = summary?.[status] ?? outlets.filter((o) => o.validationStatus === status).length;
            return (
              <button
                key={status}
                className={`ovp-summary-badge ${cfg.badgeClass} ${filterStatus === status ? 'active' : ''}`}
                onClick={() => handleFilterClick(status)}
                title={`Filter: ${cfg.label}`}
              >
                <span className={`ovp-badge-dot ${cfg.dotClass}`} />
                {cfg.label}: {count}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            className="ovp-validate-btn"
            onClick={() => handleBatchValidate('NEEDS_REVIEW')}
            disabled={isBatchValidating}
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.375rem 0.75rem',
              background: isBatchValidating ? 'var(--surface-container-high)' : 'var(--primary)',
              color: 'white',
              opacity: isBatchValidating ? 0.7 : 1,
              cursor: isBatchValidating ? 'not-allowed' : 'pointer'
            }}
            title="Validasi ulang outlet SUSPECT, WARNING, dan UNVALIDATED dengan algoritma lokasi baru"
          >
            {isBatchValidating ? 'Memvalidasi Batch...' : '⚡ Validasi Ulang Batch'}
          </button>

          {filterStatus && (
            <button
              className="ovp-validate-btn"
              onClick={() => setFilterStatus(null)}
              style={{ fontSize: '0.6875rem' }}
            >
              ✕ Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Multi-Select Action Banner */}
      {selectedIds.size > 0 && (
        <div className="ovp-selection-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700 }}>
              {selectedIds.size}
            </span>
            <span>outlet dipilih untuk divalidasi</span>
          </div>
          <div className="ovp-selection-actions">
            <button
              className="ovp-validate-btn"
              onClick={handleValidateSelected}
              disabled={isBatchValidating}
              style={{
                background: '#059669',
                color: 'white',
                fontWeight: 700,
                padding: '0.375rem 0.875rem',
                fontSize: '0.75rem',
                boxShadow: '0 2px 4px rgba(5,150,105,0.3)',
              }}
            >
              {isBatchValidating ? 'Memvalidasi...' : `⚡ Validasi ${selectedIds.size} Outlet Terpilih`}
            </button>
            {filteredOutlets.length > selectedIds.size && (
              <button
                className="ovp-validate-btn"
                onClick={handleSelectAllFiltered}
                style={{ fontSize: '0.75rem', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
              >
                Pilih Semua ({filteredOutlets.length})
              </button>
            )}
            <button
              className="ovp-validate-btn"
              onClick={handleClearSelection}
              style={{ fontSize: '0.75rem', background: 'transparent', color: 'var(--on-surface-variant)', border: '1px solid var(--border-glass)' }}
            >
              ✕ Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ovp-table-container">
        <table className="ovp-table">
          <thead>
            <tr>
              <th className="ovp-th" style={{ width: 36, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={handleToggleSelectAllPage}
                  title={allPageSelected ? 'Batalkan pilihan halaman ini' : 'Pilih semua di halaman ini'}
                  style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--primary)' }}
                />
              </th>
              <th className="ovp-th">Kode</th>
              <th className="ovp-th">Nama Toko</th>
              <th className="ovp-th">Alamat</th>
              <th className="ovp-th">Lat/Lng</th>
              <th className="ovp-th">Status</th>
              <th className="ovp-th">Confidence</th>
              <th className="ovp-th" style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOutlets.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="ovp-empty">
                    <div className="ovp-empty-icon">
                      <LuSearch />
                    </div>
                    <div className="ovp-empty-text">
                      {searchQuery || filterStatus
                        ? 'Tidak ada outlet yang cocok dengan filter.'
                        : 'Belum ada data outlet.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOutlets.map((outlet) => {
                const status = outlet.validationStatus || 'UNVALIDATED';
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNVALIDATED;
                const isExpanded = expandedId === outlet.id;
                const isValidating = validatingId === outlet.id;
                const confidence = outlet.validationConfidence;
                const isSelected = selectedIds.has(outlet.id);

                return (
                  <React.Fragment key={outlet.id}>
                    {/* Main Row */}
                    <tr
                      className={`ovp-row ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
                      style={{ cursor: outlet.validationDetails ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (outlet.validationDetails) {
                          setExpandedId(isExpanded ? null : outlet.id);
                        }
                      }}
                    >
                      <td className="ovp-td" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(outlet.id, e)}
                          style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--primary)' }}
                        />
                      </td>
                      <td className="ovp-td">
                        <span className="ovp-code">{outlet.outletCode || '—'}</span>
                      </td>
                      <td className="ovp-td">
                        <div className="ovp-name">{outlet.name || '—'}</div>
                      </td>
                      <td className="ovp-td">
                        <div className="ovp-address" title={outlet.address}>
                          {outlet.address || <em style={{ color: '#ef4444' }}>Kosong</em>}
                        </div>
                      </td>
                      <td className="ovp-td">
                        {outlet.latitude != null && outlet.longitude != null ? (
                          <div className="ovp-coords">
                            {outlet.latitude.toFixed(6)}, {outlet.longitude.toFixed(6)}
                          </div>
                        ) : (
                          <div className="ovp-coords-missing">Tidak ada</div>
                        )}
                      </td>
                      <td className="ovp-td">
                        <span className={`ovp-status-badge ${cfg.statusClass}`}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </td>
                      <td className="ovp-td">
                        {confidence != null ? (
                          <div className="ovp-confidence-bar">
                            <div className="ovp-confidence-track">
                              <div
                                className="ovp-confidence-fill"
                                style={{
                                  width: `${confidence}%`,
                                  background: getConfidenceColor(confidence),
                                }}
                              />
                            </div>
                            <span
                              className="ovp-confidence-value"
                              style={{ color: getConfidenceColor(confidence) }}
                            >
                              {confidence}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>—</span>
                        )}
                      </td>
                      <td className="ovp-td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'center' }}>
                          <button
                            className={`ovp-validate-btn ${isValidating ? 'loading' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidate(outlet.id);
                            }}
                            disabled={isValidating}
                            title="Validasi outlet ini"
                          >
                            {isValidating ? (
                              <>
                                <div className="ovp-spinner" />
                                Validasi...
                              </>
                            ) : (
                              <>
                                <LuShieldCheck />
                                Validasi
                              </>
                            )}
                          </button>
                          {outlet.validationDetails && (
                            <button
                              className="ovp-validate-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(isExpanded ? null : outlet.id);
                              }}
                              style={{ padding: '0.375rem 0.5rem' }}
                              title={isExpanded ? 'Tutup detail' : 'Lihat detail'}
                            >
                              {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && outlet.validationDetails && (
                      <tr className="ovp-detail-row">
                        <td colSpan={8}>
                          <ExpandedDetail 
                            outlet={outlet} 
                            onValidateNearby={handleValidateNearby}
                            isNearbyLoading={validatingNearbyId === outlet.id}
                            onOpenNearbyModal={(data) => {
                              setNearbyModalData(data);
                              setIsNearbyModalOpen(true);
                            }}
                            onApplySuggestedCoords={handleApplySuggestedCoords}
                            isApplyingCoords={applyingCoordsId === outlet.id}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ovp-pagination">
          <div className="ovp-pagination-info">
            Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredOutlets.length)} dari {filteredOutlets.length} outlet
          </div>
          <div className="ovp-pagination-controls">
            <button
              className="ovp-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`ovp-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="ovp-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next ›
            </button>
          </div>
        </div>
      )}
      
      <NearbySearchModal 
        isOpen={isNearbyModalOpen} 
        onClose={() => setIsNearbyModalOpen(false)} 
        nearbyData={nearbyModalData} 
      />
    </div>
  );
};
