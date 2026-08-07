import { useState, useMemo } from 'react';
import {
  calculateFuelCost,
  calculateVehicleFillRate,
  evaluateDropProfitability,
  VEHICLE_SPECIFICATIONS,
} from '../services/logisticsOptimizerService';

/**
 * useLogisticsDispatch Hook
 * Single Responsibility: Delivery Payload Capacity, Fuel Mileage & Drop Margin State.
 * 1 File = 1 Logic Hook
 */
export const useLogisticsDispatch = ({ deliveryStops = [] } = {}) => {
  const [selectedVehicleType, setSelectedVehicleType] = useState('CDE_ENGKEL_BOX');
  const [totalEstimatedDistanceKm, setTotalEstimatedDistanceKm] = useState(48);

  // Compute total cartons across delivery stops
  const totalCartons = useMemo(() => {
    if (!deliveryStops || deliveryStops.length === 0) return 140; // realistic default demonstration
    return deliveryStops.reduce((acc, stop) => acc + (stop.cartonCount || stop.itemsCount || 10), 0);
  }, [deliveryStops]);

  // Compute vehicle fill rate
  const fillRate = useMemo(() => {
    return calculateVehicleFillRate(totalCartons, selectedVehicleType);
  }, [totalCartons, selectedVehicleType]);

  // Compute fuel cost
  const fuelCost = useMemo(() => {
    return calculateFuelCost(totalEstimatedDistanceKm, selectedVehicleType);
  }, [totalEstimatedDistanceKm, selectedVehicleType]);

  // Compute drop profitability overview
  const profitability = useMemo(() => {
    return evaluateDropProfitability({
      cartonCount: totalCartons,
      pricePerCarton: 150000,
      grossMarginPercent: 6,
      estimatedDropCost: (deliveryStops.length || 8) * 18000,
    });
  }, [totalCartons, deliveryStops]);

  return {
    selectedVehicleType,
    setSelectedVehicleType,
    totalEstimatedDistanceKm,
    setTotalEstimatedDistanceKm,
    totalCartons,
    fillRate,
    fuelCost,
    profitability,
    vehicleSpecs: VEHICLE_SPECIFICATIONS,
  };
};
