import React from 'react';
import { LuRoute, LuTriangleAlert, LuServer } from 'react-icons/lu';
import '../../../styles/components/RouteProviderBadge.css';

const PROVIDER_CONFIG = {
    OSRM: {
        icon: LuRoute,
        label: 'Rute mengikuti jalan via OSRM (open-source)',
        modifier: 'route-provider-badge--osrm',
    },
    FALLBACK: {
        icon: LuTriangleAlert,
        label: 'Rute jalan tidak tersedia — ditampilkan garis lurus',
        modifier: 'route-provider-badge--fallback',
    },
    GOOGLE_API: {
        icon: LuServer,
        label: 'Rute mengikuti jalan via Google (server)',
        modifier: 'route-provider-badge--google-api',
    },
};

/**
 * RouteProviderBadge Component
 * Single Responsibility: Badge status sumber rute di atas peta.
 */
export const RouteProviderBadge = ({ provider }) => {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div className={`route-provider-badge ${config.modifier}`}>
            <Icon className="route-provider-badge__icon" />
            <span>{config.label}</span>
        </div>
    );
};
