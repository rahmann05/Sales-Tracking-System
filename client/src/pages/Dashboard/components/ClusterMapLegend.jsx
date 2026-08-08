import React from 'react';
import { CLUSTER_COLORS } from '../../../services/clusterColorService';
import '../../../styles/components/ClusterMapLegend.css';

/**
 * ClusterMapLegend Component
 * Single Responsibility: Display color-coded legend indicators per cluster/region on Google Maps.
 */
export const ClusterMapLegend = ({ totalOutletsCount = 0 }) => {
  return (
    <div className="cluster-map-legend">
      <div className="cluster-map-legend__header">
        <h4 className="cluster-map-legend__title">Peta Klaster Regional</h4>
        <span className="cluster-map-legend__badge">
          {totalOutletsCount} Outlet
        </span>
      </div>

      <div className="cluster-map-legend__grid">
        {CLUSTER_COLORS.map((cluster) => (
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
