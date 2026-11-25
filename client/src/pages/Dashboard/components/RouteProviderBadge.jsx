import React from 'react';
import { LuRoute, LuTriangleAlert, LuServer, LuLoaderCircle } from 'react-icons/lu';
import '../../../styles/components/RouteProviderBadge.css';

const PROVIDER_CONFIG = {
  LOADING: {
    icon: LuLoaderCircle,
    label: 'Menghitung rute jalan…',
    modifier: 'route-provider-badge--loading',
    announce: false,
  },
  GOOGLE_SDK: {
    icon: LuRoute,
    label: 'Rute jalan · Google Maps',
    modifier: 'route-provider-badge--google-api',
    announce: false,
  },
  GOOGLE_API: {
    icon: LuServer,
    label: 'Rute jalan · Google Server',
    modifier: 'route-provider-badge--google-api',
    announce: false,
  },
  OSRM: {
    icon: LuRoute,
    label: 'Rute jalan · OSRM',
    modifier: 'route-provider-badge--osrm',
    announce: false,
  },
  FALLBACK: {
    icon: LuTriangleAlert,
    label: 'Mode fallback · garis lurus',
    modifier: 'route-provider-badge--fallback',
    announce: true,
  },
};

/**
 * RouteProviderBadge Component
 * Single Responsibility: Status sumber rute di atas peta.
 */
export const RouteProviderBadge = ({ provider, reason = '', inline = false }) => {
  const config = PROVIDER_CONFIG[provider];
  if (!config) return null;

  const Icon = config.icon;
  const iconClass =
    provider === 'LOADING' ? 'route-provider-badge__icon animate-spin' : 'route-provider-badge__icon';

  return (
    <div
      role={config.announce ? 'status' : undefined}
      className={`route-provider-badge ${config.modifier}${inline ? ' route-provider-badge--inline' : ''}`}
    >
      <Icon className={iconClass} aria-hidden="true" />
      <div className="route-provider-badge__text">
        <span>{config.label}</span>
        {provider === 'FALLBACK' && reason ? (
          <span className="route-provider-badge__reason">{reason}</span>
        ) : null}
      </div>
    </div>
  );
};
