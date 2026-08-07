/**
 * Logistics Optimizer Service
 * Single Responsibility: Pure Logistics Mathematical Calculations (Fuel Costs, Payload Capacity, and Drop Profitability).
 * 1 File = 1 Pure Logic Service
 */

/**
 * Standard fleet specifications
 */
export const VEHICLE_SPECIFICATIONS = {
  BLIND_VAN: {
    name: 'Daihatsu Gran Max / Luxio (Blind Van)',
    maxCartons: 90,
    maxWeightKg: 750,
    fuelKmPerLiter: 11,
    fuelType: 'Pertalite',
    fuelPricePerLiter: 10000,
  },
  CDE_ENGKEL_BOX: {
    name: 'Truk Engkel 4 Roda (CDE Box)',
    maxCartons: 220,
    maxWeightKg: 2000,
    fuelKmPerLiter: 8,
    fuelType: 'Solar Dexlite',
    fuelPricePerLiter: 6800,
  },
  CDD_DOUBLE_BOX: {
    name: 'Truk Double 6 Roda (CDD Box)',
    maxCartons: 450,
    maxWeightKg: 4500,
    fuelKmPerLiter: 6,
    fuelType: 'Solar Dexlite',
    fuelPricePerLiter: 6800,
  },
};

/**
 * Calculates estimated fuel cost for a given distance and vehicle type.
 */
export const calculateFuelCost = (totalDistanceKm = 0, vehicleType = 'CDE_ENGKEL_BOX') => {
  const spec = VEHICLE_SPECIFICATIONS[vehicleType] || VEHICLE_SPECIFICATIONS.CDE_ENGKEL_BOX;
  const litersNeeded = totalDistanceKm / spec.fuelKmPerLiter;
  const totalCost = litersNeeded * spec.fuelPricePerLiter;

  return {
    litersNeeded: parseFloat(litersNeeded.toFixed(2)),
    totalCost: Math.round(totalCost),
    fuelType: spec.fuelType,
    fuelPricePerLiter: spec.fuelPricePerLiter,
  };
};

/**
 * Evaluates drop profitability: checks if carton order value covers logistical drop cost.
 */
export const evaluateDropProfitability = ({
  cartonCount = 1,
  pricePerCarton = 150000,
  grossMarginPercent = 6, // 6% distributor margin
  estimatedDropCost = 18000, // fuel share + labor share per drop
}) => {
  const totalGrossRevenue = cartonCount * pricePerCarton;
  const grossProfit = (totalGrossRevenue * grossMarginPercent) / 100;
  const netMargin = grossProfit - estimatedDropCost;
  const isProfitable = netMargin >= 0;
  const minimumCartonsToBreakEven = Math.ceil(estimatedDropCost / ((pricePerCarton * grossMarginPercent) / 100));

  return {
    totalGrossRevenue,
    grossProfit,
    estimatedDropCost,
    netMargin,
    isProfitable,
    minimumCartonsToBreakEven,
  };
};

/**
 * Calculates vehicle load utilization percentage.
 */
export const calculateVehicleFillRate = (totalCartons = 0, vehicleType = 'CDE_ENGKEL_BOX') => {
  const spec = VEHICLE_SPECIFICATIONS[vehicleType] || VEHICLE_SPECIFICATIONS.CDE_ENGKEL_BOX;
  const percentage = Math.min(100, Math.round((totalCartons / spec.maxCartons) * 100));
  const isOverloaded = totalCartons > spec.maxCartons;

  return {
    percentage,
    totalCartons,
    maxCartons: spec.maxCartons,
    isOverloaded,
    vehicleName: spec.name,
  };
};
