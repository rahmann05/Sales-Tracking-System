/**
 * Logistics Optimizer Service
 * Single Responsibility: Pure Logistics Mathematical Calculations (Fuel Costs, Payload Capacity, and Drop Profitability).
 * No hardcoded vehicle types allowed.
 * 1 File = 1 Pure Logic Service
 */

/**
 * Calculates estimated fuel cost for a given distance and vehicle.
 */
export const calculateFuelCost = (totalDistanceKm = 0, vehicleSpec = null) => {
  if (!vehicleSpec) {
    return {
      litersNeeded: 0,
      totalCost: 0,
      fuelType: 'Unknown',
      fuelPricePerLiter: 0,
    };
  }

  const litersNeeded = totalDistanceKm / (vehicleSpec.fuelKmPerLiter || 1);
  const totalCost = litersNeeded * (vehicleSpec.fuelPricePerLiter || 0);

  return {
    litersNeeded: parseFloat(litersNeeded.toFixed(2)),
    totalCost: Math.round(totalCost),
    fuelType: vehicleSpec.fuelType,
    fuelPricePerLiter: vehicleSpec.fuelPricePerLiter,
  };
};

/**
 * Evaluates drop profitability: checks if carton order value covers logistical drop cost.
 */
export const evaluateDropProfitability = ({
  cartonCount,
  pricePerCarton,
  grossMarginPercent,
  estimatedDropCost,
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
export const calculateVehicleFillRate = (totalCartons = 0, vehicleSpec = null) => {
  if (!vehicleSpec) {
    return {
      percentage: 0,
      totalCartons,
      maxCartons: 0,
      isOverloaded: true,
      vehicleName: 'Unknown',
    };
  }

  const maxCartons = vehicleSpec.maxCartons || 1;
  const percentage = Math.min(100, Math.round((totalCartons / maxCartons) * 100));
  const isOverloaded = totalCartons > maxCartons;

  return {
    percentage,
    totalCartons,
    maxCartons,
    isOverloaded,
    vehicleName: vehicleSpec.name,
  };
};
