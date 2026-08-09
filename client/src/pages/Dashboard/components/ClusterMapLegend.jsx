import React, { useState, useEffect } from 'react';
import { clustersApi } from '../../../services/api';
import '../../../styles/components/ClusterMapLegend.css';

/**
 * ClusterMapLegend Component
 * Single Responsibility: Display color-coded legend indicators per cluster/region on Google Maps.
 * Fetches dynamic clusters from DB.
 */
export const ClusterMapLegend = ({
  totalOutletsCount = 0,
  isSalesRole = false,
  userClusterName = 'Klaster Cimahi Tengah',
}) => {
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchClusters = async () => {
      try {
        const res = await clustersApi.getAll();
        if (isMounted && res.data) {
          setClusters(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch clusters for map legend', err);
      }
    };
    fetchClusters();
    return () => { isMounted = false; };
  }, []);

  const visibleClusters = isSalesRole
    ? clusters.filter(
        (c) =>
          c.name.toLowerCase().includes('cimahi') ||
          (userClusterName && c.name.toLowerCase().includes(userClusterName.toLowerCase()))
      )
    : clusters;

  if (visibleClusters.length === 0) return null;

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
          <div key={cluster.id} className="cluster-map-legend__item">
            <span
              className="cluster-map-legend__color"
              style={{ backgroundColor: cluster.colorHex || '#3b82f6' }}
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
