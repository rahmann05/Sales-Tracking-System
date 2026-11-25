import React, { useState, useEffect } from 'react';
import { LuChevronDown, LuMapPin } from 'react-icons/lu';
import { clustersApi } from '../../../services/api';
import '../../../styles/components/ClusterMapLegend.css';

/**
 * ClusterMapLegend Component
 * Single Responsibility: Display cluster color swatches, marker/sequence symbols, and route mode legend.
 */
export const ClusterMapLegend = ({
  clusters: clustersProp,
  totalOutletsCount = 0,
  isSalesRole = false,
  userClusterName = 'Klaster Cimahi Tengah',
  isFiltered = false,
  activeSalesName = '',
  hasActiveRoute = false,
  isFallbackRoute = false,
  hasClusterSequence = false,
  inline = false,
}) => {
  const [fetchedClusters, setFetchedClusters] = useState([]);

  useEffect(() => {
    if (clustersProp !== undefined) return undefined;
    let isMounted = true;
    const fetchClusters = async () => {
      try {
        const res = await clustersApi.getAll();
        if (isMounted && res.data) {
          setFetchedClusters(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch clusters for map legend', err);
      }
    };
    fetchClusters();
    return () => {
      isMounted = false;
    };
  }, [clustersProp]);

  const rawClusters = clustersProp !== undefined ? clustersProp : fetchedClusters;
  const visibleClusters =
    clustersProp !== undefined
      ? rawClusters
      : isSalesRole
        ? rawClusters.filter(
            (c) =>
              c.name.toLowerCase().includes('cimahi') ||
              (userClusterName && c.name.toLowerCase().includes(userClusterName.toLowerCase()))
          )
        : rawClusters;

  if (!visibleClusters || visibleClusters.length === 0) {
    if (!isFiltered && !hasActiveRoute) return null;
  }

  const headingTitle = isFiltered && activeSalesName
    ? `Legend · ${activeSalesName}`
    : isSalesRole
      ? 'Klaster Saya'
      : 'Legend Peta';

  return (
    <details
      open
      className={`cluster-map-legend${inline ? ' cluster-map-legend--inline' : ''}`}
      aria-label="Legend peta operasional"
    >
      <summary className="cluster-map-legend__summary">
        <span className="cluster-map-legend__summary-left">
          <LuChevronDown className="cluster-map-legend__chevron" aria-hidden="true" />
          <span className="cluster-map-legend__title">{headingTitle}</span>
        </span>
        <span className="cluster-map-legend__badge">{totalOutletsCount} Outlet</span>
      </summary>

      <div className="cluster-map-legend__body">
        {visibleClusters.length > 0 ? (
          <div className="cluster-map-legend__section">
            <p className="cluster-map-legend__section-label">Cluster ({visibleClusters.length})</p>
            <ul className="cluster-map-legend__list" role="list">
              {visibleClusters.map((cluster) => {
                const color = cluster.color || cluster.colorHex || '#2563eb';
                const label = (cluster.name || 'Cluster').replace(/^Klaster\s+/i, '');
                return (
                  <li
                    key={cluster.id || label}
                    className="cluster-map-legend__item"
                    style={{ '--cluster-color': color }}
                  >
                    <span className="cluster-map-legend__pin-chip" aria-hidden="true">
                      <LuMapPin />
                    </span>
                    <span className="cluster-map-legend__label-group">
                      <span className="cluster-map-legend__label">{label}</span>
                      {cluster.salesName ? (
                        <span className="cluster-map-legend__sublabel">{cluster.salesName}</span>
                      ) : null}
                    </span>
                    {cluster.outletCount != null ? (
                      <span className="cluster-map-legend__count">{cluster.outletCount}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="cluster-map-legend__section">
          <p className="cluster-map-legend__section-label">Titik &amp; Urutan</p>
          <ul className="cluster-map-legend__symbols" role="list">
            <li className="cluster-map-legend__symbol-item">
              <svg
                className="cluster-map-legend__sample-pjp-svg"
                viewBox="0 0 34 44"
                width="16"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M17 2C9.268 2 3 8.268 3 16c0 9.6 14 25 14 25s14-15.4 14-25C31 8.268 24.732 2 17 2z"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x="17"
                  y="20.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="800"
                >
                  1
                </text>
              </svg>
              <span>Urutan kunjungan PJP hari ini (1, 2, 3...)</span>
            </li>
            <li className="cluster-map-legend__symbol-item">
              <span className="cluster-map-legend__sample-cluster" aria-hidden="true">
                {hasClusterSequence ? '2' : ''}
              </span>
              <span>
                {hasClusterSequence
                  ? 'Outlet lain dalam cluster (angka urutan cluster)'
                  : 'Outlet lain dalam cluster'}
              </span>
            </li>
            <li className="cluster-map-legend__status-row">
              <span className="cluster-map-legend__status-chip">
                <span className="cluster-map-legend__status-dot is-visited" aria-hidden="true" />
                Selesai
              </span>
              <span className="cluster-map-legend__status-chip">
                <span className="cluster-map-legend__status-dot is-arrived" aria-hidden="true" />
                Di lokasi
              </span>
              <span className="cluster-map-legend__status-chip">
                <span className="cluster-map-legend__status-dot is-skipped" aria-hidden="true" />
                Tutup/lewati
              </span>
            </li>
          </ul>
        </div>

        <div className="cluster-map-legend__section">
          <p className="cluster-map-legend__section-label">Garis Rute</p>
          <ul className="cluster-map-legend__symbols" role="list">
            <li className="cluster-map-legend__symbol-item">
              <span className="cluster-map-legend__line-solid" aria-hidden="true" />
              <span>Rute mengikuti jalan</span>
            </li>
            <li className="cluster-map-legend__symbol-item">
              <span className="cluster-map-legend__line-dashed" aria-hidden="true" />
              <span>
                Garis lurus (fallback{isFallbackRoute ? ' · sedang aktif' : ''})
              </span>
            </li>
          </ul>
        </div>
      </div>
    </details>
  );
};
