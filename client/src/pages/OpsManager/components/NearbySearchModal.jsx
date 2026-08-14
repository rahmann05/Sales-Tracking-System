import React from 'react';
import { LuX, LuMapPin, LuBuilding2 } from 'react-icons/lu';

export const NearbySearchModal = ({ isOpen, onClose, nearbyData }) => {
  if (!isOpen) return null;

  const places = nearbyData?.placesList || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '1rem',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                background: 'rgba(249, 115, 22, 0.1)', // orange
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LuBuilding2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0, color: 'var(--on-surface)' }}>
                Detail Nearby Search
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                Tempat-tempat di sekitar radius outlet berdasarkan Google Maps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--on-surface-variant)',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block' }}>Match Terbaik</span>
              <strong style={{ fontSize: '1rem', color: 'var(--on-surface)' }}>{nearbyData?.topMatchName || '-'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block' }}>Kecocokan Nama</span>
              <strong style={{ fontSize: '1rem', color: '#ea580c' }}>
                {nearbyData?.nameSimilarity != null ? Math.round(nearbyData.nameSimilarity * 100) + '%' : '-'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block' }}>Total Ditemukan</span>
              <strong style={{ fontSize: '1rem', color: 'var(--on-surface)' }}>{places.length} tempat</strong>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-glass)', color: 'var(--on-surface-variant)' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Nama Tempat</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Jenis Bisnis</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Alamat Google</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Lat/Lng</th>
              </tr>
            </thead>
            <tbody>
              {places.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    Tidak ada data tempat di sekitar.
                  </td>
                </tr>
              ) : (
                places.map((place, idx) => (
                  <tr key={place.placeId || idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--on-surface)', fontWeight: 500 }}>
                      {place.name}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                      {place.types?.slice(0, 2).join(', ') || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--on-surface-variant)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={place.formattedAddress || place.vicinity}>
                      {place.formattedAddress || place.vicinity || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {place.businessStatus === 'OPERATIONAL' ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 600 }}>Buka</span>
                      ) : place.businessStatus ? (
                        <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 600 }}>{place.businessStatus}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--on-surface-variant)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {place.lat?.toFixed(5)}, {place.lng?.toFixed(5)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
