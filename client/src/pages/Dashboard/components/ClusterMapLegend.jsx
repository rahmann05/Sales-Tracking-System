import React from 'react';
import { CLUSTER_COLORS } from '../../../services/clusterColorService';

/**
 * ClusterMapLegend Component
 * Single Responsibility: Display color-coded legend indicators per cluster/region on Google Maps.
 * 1 File = 1 Component
 */
export const ClusterMapLegend = ({ totalOutletsCount = 0 }) => {
  return (
    <div className="absolute top-4 left-4 z-30 pointer-events-auto bg-surface/95 backdrop-blur-md p-3.5 rounded-2xl border border-border-glass shadow-xl max-w-xs space-y-2">
      <div className="flex items-center justify-between gap-2 border-b border-border-glass pb-1.5">
        <h4 className="font-extrabold text-xs text-on-surface">Peta Klaster Regional</h4>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {totalOutletsCount} Outlet
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        {CLUSTER_COLORS.map((cluster) => (
          <div key={cluster.key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: cluster.hex }}
            />
            <span className="font-medium text-on-surface truncate" title={cluster.name}>
              {cluster.name.replace('Klaster ', '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
