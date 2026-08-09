import { useState, useMemo, useEffect } from 'react';
import {
  calculateFuelCost,
  calculateVehicleFillRate,
  evaluateDropProfitability,
} from '../services/logisticsOptimizerService';
import { vehiclesApi, configApi } from '../services/api';

/**
 * useLogisticsDispatch Hook
 * Single Responsibility: Delivery Payload Capacity, Fuel Mileage & Drop Margin State.
 * Dynamic vehicle fetching from DB.
 */
export const useLogisticsDispatch = ({ deliveryStops = [] } = {}) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [totalEstimatedDistanceKm, setTotalEstimatedDistanceKm] = useState(48);

  const [logisticsConfig, setLogisticsConfig] = useState({
    pricePerCarton: 0,
    grossMarginPercent: 0,
    baseDropCost: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [vehiclesRes, configRes] = await Promise.all([
          vehiclesApi.getAll().catch(() => ({ data: [] })),
          configApi.getByKey('LOGISTICS_METRICS').catch(() => ({ data: null }))
        ]);
        
        if (isMounted) {
          if (vehiclesRes.data) {
            setVehicles(vehiclesRes.data);
            if (vehiclesRes.data.length > 0) {
              setSelectedVehicleId(vehiclesRes.data[0].id);
            }
          }
          if (configRes.data) {
            setLogisticsConfig((prev) => ({ ...prev, ...configRes.data }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch data for logistics dispatch', err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const selectedVehicleSpec = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Compute total cartons across delivery stops
  const totalCartons = useMemo(() => {
    if (!deliveryStops || deliveryStops.length === 0) return 140; // realistic default demonstration
    return deliveryStops.reduce((acc, stop) => acc + (stop.cartonCount || stop.itemsCount || 10), 0);
  }, [deliveryStops]);

  // Compute vehicle fill rate
  const fillRate = useMemo(() => {
    return calculateVehicleFillRate(totalCartons, selectedVehicleSpec);
  }, [totalCartons, selectedVehicleSpec]);

  // Compute fuel cost
  const fuelCost = useMemo(() => {
    return calculateFuelCost(totalEstimatedDistanceKm, selectedVehicleSpec);
  }, [totalEstimatedDistanceKm, selectedVehicleSpec]);

  // Compute drop profitability overview
  const profitability = useMemo(() => {
    return evaluateDropProfitability({
      cartonCount: totalCartons,
      pricePerCarton: logisticsConfig.pricePerCarton,
      grossMarginPercent: logisticsConfig.grossMarginPercent,
      estimatedDropCost: (deliveryStops.length || 8) * logisticsConfig.baseDropCost,
    });
  }, [totalCartons, deliveryStops, logisticsConfig]);

  return {
    vehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    selectedVehicleSpec,
    totalEstimatedDistanceKm,
    setTotalEstimatedDistanceKm,
    totalCartons,
    fillRate,
    fuelCost,
    profitability,
    logisticsConfig,
  };
};
