import React from 'react';
import { CLUSTER_COLORS } from '../../../services/clusterColorService';
import '../../../styles/components/ClusterMapLegend.css';

/**
 * ClusterMapLegend Component
 * Single Responsibility: Display color-coded legend indicators per cluster/region on Google Maps.
 * Restricts view to only assigned cluster for Sales, while showing all clusters for Supervisor & Operational Manager.
 */
export const ClusterMapLegend = ({
  totalOutletsCount = 0,
  isSalesRole = false,
  userClusterName = 'Klaster Cimahi Tengah',
}) => {
  const visibleClusters = isSalesRole
    ? CLUSTER_COLORS.filter(
        (c) =>
          c.name.toLowerCase().includes('cimahi') ||
          (userClusterName && c.name.toLowerCase().includes(userClusterName.toLowerCase()))
      )
    : CLUSTER_COLORS;

  return (
    <div className="cluster-map-legend">
      <div className="cluster-map-legend__header">
        <h4 className="cluster-map-legend__title">
          {isSalesRole ? 'Klaster Saya' : 'Peta Klaster Regional'}
        </h4>
        <span className="cluster-map-legend__badge">
          {totalOutletsCount} Outlet
        </span>
      </div>

      <div className="cluster-map-legend__grid">
        {visibleClusters.map((cluster) => (
          <div key={cluster.key} className="cluster-map-legend__item">
            <span
              className="cluster-map-legend__color"
              style={{ backgroundColor: cluster.hex }}
            />
            <span className="cluster-map-legend__label" title={cluster.name}>
              {cluster.name.replace('Klaster ', '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
